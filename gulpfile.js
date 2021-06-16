const { src, dest, lastRun, watch, series, parallel } = require('gulp')

const spritesmith = require('gulp.spritesmith')           //压缩雪碧图
const plumber = require('gulp-plumber')                   //加强的错误处理
const notify = require('gulp-notify')                     //弹窗提示
const sass = require('gulp-sass')                         //SASS支持
const postcss = require('gulp-postcss')                   //posscss支持
const px2vw = require('@moohng/postcss-px2vw')            //px2vw插件
const webserver = require('gulp-webserver')               //服务器
const clean = require('gulp-clean')                       //清除文件

const autoprefixer = require('autoprefixer')              //自动添加前缀
const cssnano = require('cssnano');                       //最小化css
const cleanCss = require('gulp-clean-css')                //合并压缩css
const replace = require('gulp-replace')                   //字符串替换
const babel = require('gulp-babel')                       //ES6转ES5
const uglify = require('gulp-uglify')                     //混淆压缩js
const htmlMinify = require('gulp-html-minify')            //压缩html
const nunjucks = require('gulp-nunjucks')                 //nunjucks支持
const rename = require('gulp-rename')                     //重命名
const zip = require('gulp-zip')                           //zip支持
const ossUpload = require('gulp-oss-upload')              //oss文件上传

const keys = require('./inc/_keys')
const pkg = require('./package.json')
const site_name = pkg.name
const cdn_path = '/public/'+keys.cdn+'/'+site_name
const cdn_href = 'https://static.bjx.com.cn'+cdn_path



/**************/
/* 静态页开发 */
/*************/

//创建雪碧图
function sprite() {
    return  src(['_src/img/snippet/*', '!_src/img/snippet/*.txt'])
            .pipe(spritesmith({
                imgName: 'img/sprite.png',
                cssName: 'css/_sprite.scss',
                padding:5,
                algorithm: 'binary-tree',
                cssTemplate: function (data) {
                    var arr=[]
                    data.sprites.forEach(function (sprite) {
                        arr.push("%ico_"+sprite.name+
                        " {"+
                        "background-image:url('"+sprite.escaped_image+"?_="+Date.now()+"');"+
                        "background-position:"+sprite.px.offset_x+" "+sprite.px.offset_y+";"+
                        "width:"+sprite.px.width+";"+
                        "height:"+sprite.px.height+";"+
                        "}\n")
                    })
                    return arr.join("")
                }
            }))
            .pipe(dest('_src/'))
}

//编译scss
function scss() {
    return  src('_src/css/**/*.{scss,sass}', {since: lastRun(scss)})
            .pipe(plumber({
                errorHandler: notify.onError("Message:\n<%= error.message %> 行 : <%= error.line %> 列 : <%= error.column %>")
            }))
            .pipe(sass({outputStyle:'compact'}))    //手写样式:expanded 单行样式:compact 压缩样式:compressed
            .pipe(postcss([
                px2vw({
                    viewportWidth: 750,
                    rootValue: 0,
                    unitPrecision: 6,
                    minPixelValue: 1
                })
            ]))
            .pipe(dest('_src/css/'))
}
//监听scss
function watch_scss() {
    return  watch('_src/css/**/*.{scss,sass}', series(scss))
}

//创建服务
function serve() {
    return  src('_src/')
            .pipe(webserver({
                host:'0.0.0.0',
                port: 9999,
                livereload: true,
                directoryListing: {
                    enable: true,
                    path: '_src/'
                },
                open: 'http://localhost:9999'
            }))
}

//清空piblic的css目录
function clean_public_css() {
    return  src('public/css/', {allowEmpty: true})
            .pipe(clean())
}
//清空piblic的img目录
function clean_public_img() {
    return  src('public/img/', {allowEmpty: true})
            .pipe(clean())
}

//复制css到public目录
function copy_public_css() {
    return  src(['_src/css/*.css', '_src/css/*/**'])
            .pipe(dest('public/css/'))
}
//复制img到public目录
function copy_public_img() {
    return  src(['_src/img/**', '!_src/img/snippet/**', '!_src/img/recycle/**'])
            .pipe(dest('public/img/'))
}

/*静态页开发环境*/
exports.env = exports.default = series(
    sprite,
    scss,
    parallel(
        serve,
        watch_scss
    )
)
/*发布样式相关文件到public目录*/
exports.style = series(
    sprite,
    scss,
    parallel(
        clean_public_css,
        clean_public_img
    ),
    parallel(
        copy_public_css,
        copy_public_img
    )
)
/*其他几个公开的任务*/
exports.sprite = sprite
exports.scss = scss



/************/
/* 网站开发 */
/***********/

//清空dist目录
function clean_dist() {
    return  src('_dist/', {allowEmpty: true})
            .pipe(clean())
}

//复制图片目录
function copy_dist_img() {
    return  src('public/img/**')
            .pipe(dest('_dist/img/'))
}

//复制css子目录文件
function copy_dist_css() {
    return  src('public/css/*/**')
            .pipe(dest('_dist/css/'))
}
//压缩css
function compress_css() {
    return  src(['public/css/**/*.css', '!public/css/**/*.min.css'])
            .pipe(postcss([
                autoprefixer(),
                cssnano()
            ]))
            .pipe(cleanCss())
            .pipe(dest('_dist/css/'))
}

//复制js子目录文件
function copy_dist_js() {
    return  src('public/js/*/**')
            .pipe(dest('_dist/js/'))
}
//压缩js
function compress_js() {
    return  src(['public/js/**/*.js', '!public/js/**/*.min.js'])
            .pipe(replace("'/js/", "'"+cdn_href+"/js/"))
            .pipe(replace("'/img/", "'"+cdn_href+"/img/"))
            .pipe(babel({presets: ['@babel/preset-env'], sourceType: 'script'}))
            .pipe(uglify())
            .pipe(dest('_dist/js/'))
}

//压缩模板
function compress_htm() {
    return  src('views/**/*.htm')
            .pipe(replace("'/img/", "'"+cdn_href+"/img/"))
            .pipe(htmlMinify())
            .pipe(dest('views_min/'))
}

//预编译压缩过的模板
function precompile_tpl() {
    return  src('views_min/snippet/*.htm')
            .pipe(nunjucks.precompile())
            .pipe(replace('"snippet/', '"'))
            .pipe(dest('_dist/tpl/'))
}

//打包程序
function packaging_all() {
    return src([
                '**/*.*',
                '**/www',
                '!node_modules/**',
                '!.git/**',
                '!.vscode/**',
                '!_dist/**',
                '!_src/**',
                '!inc/font/**',
                '!inc/ip/**',
                '!misc/**',
                '!public/**',
                '!static/h5jobs/**/*.html',
                '!views/**',
                '!.gitignore',
                '!gulpfile.js',
                '!issue.txt',
                '!nodemon.json',
                '!preview.bat',
                '!preview.vbs',
                '!publish.bat',
              ])
            .pipe(replace('__CC20180105130000CC__', new Date(Date.now()+28800000).toJSON().replace(/-|:|T|\.\d{3}Z/gi,'') ))
            .pipe(rename(function(path){
                if (/^views_min/.test(path.dirname)) path.dirname = path.dirname.replace('views_min', 'views')
            }))
            .pipe(zip(site_name+'.zip'))
            .pipe(dest('_dist/'))
}

//清理压缩过的模板
function clean_views_min() {
    return  src('views_min/', {allowEmpty: true})
            .pipe(clean())
}

//预编译模板
function tpl() {
    return  src('views/snippet/*.htm', {since: lastRun(tpl)})
            .pipe(nunjucks.precompile())
            .pipe(replace('"snippet/', '"'))
            .pipe(dest('public/tpl/'))
}
//监听预编译模板
function watch_tpl() {
    return  watch('views/snippet/*.htm', series(tpl))
}

//发布CDN文件
function upload() {
    return  src(['_dist/**', '!_dist/*.zip'])
            .pipe(ossUpload({
                region: 'oss-cn-beijing',
                accessKeyId: keys.alioss.acc,
                accessKeySecret: keys.alioss.pwd,
                bucket: 'bjxhr-oss-file',
                rootDir: cdn_path // upload file root directory in the bucket(optional)
            }))
}

//打包CDN文件
function pack() {
    return  src(['_dist/**', '!_dist/*.zip'])
            .pipe(zip('_dist.zip'))
            .pipe(dest('_dist/'))
}

/*打包发布版本*/
exports.pub = series(
    clean_dist,
    parallel(
        copy_dist_img,
        copy_dist_css,
        copy_dist_js,
        compress_css,
        compress_js,
        compress_htm
    ),
    parallel(
        precompile_tpl,
        packaging_all
    ),
    clean_views_min
)
/*打包发布版本(仅CDN所需文件)*/
exports['pub-cdn'] = series(
    parallel(
        copy_dist_img,
        copy_dist_css,
        copy_dist_js,
        compress_css,
        compress_js,
        compress_htm
    ),
    precompile_tpl,
    clean_views_min
)
/*打包发布版本(仅服务器所需文件)*/
exports['pub-ser'] = series(
    compress_htm,
    packaging_all,
    clean_views_min
)
/*其他几个公开的任务*/
exports.tpl = tpl
exports['watch-tpl'] = watch_tpl
exports['pub-tpl'] = series(
    compress_htm,
    precompile_tpl,
    clean_views_min
)
exports.upload = upload
exports.pack = pack
