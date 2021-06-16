const Koa = require('koa')
const onerror = require('koa-onerror')
const serve = require('koa-static')
const session2 = require('koa-session2')
const views = require('koa-views')

const path = require('path')
const utils = require('./inc/utils')
const middleware = require('./inc/middleware')
const RedisStore = require('./inc/store')
const { passport, client } = require('./inc/passport')
const nunjucksEnv = require('./inc/nunjucks_env')
const router = require('./routes')


//检测是否为生产环境
const isProd = process.env.NODE_ENV === 'production'

//创建koa实例
const app = new Koa()

//设置koa参数
app.keys = utils.keys.koa
app.proxy = true

//开发/生成环境下的不同中间件
if (isProd) {
    //错误处理
    onerror(app, {
        html: function(err, ctx) {
            // console.log(err.name, err.code, err.message, err.stack)
            let body = err.name+': '+err.message
            if (err.message.startsWith('did not find expected authorization request details in session')) {
                body = '授权错误，请<a href="/oidc/login/?f=%2F" rel="nofollow">重新登录</a>'
            }
            ctx.body = body
            ctx.type = 'html'
            ctx.status = 500
        }
    })
    //响应日志(生产)
    app.use(async (ctx, next) => {
        const start = Date.now()
        await next()
        const ms = Date.now() - start
        console.log(`${ctx.method} ${ctx.url} ${ctx.status} ${ms}ms ${ctx.response.length||0}b ${ctx.headers['x-forwarded-for']||ctx.ip} ${ctx.headers['user-agent']}`)
    })
    //开启Gzip支持
    const compress = require('koa-compress')
    app.use(compress({
        filter: function(content_type) {
            return /text|application\/javascript|application\/json/i.test(content_type)
        },
        threshold: 2048,
        flush: require('zlib').constants.Z_SYNC_FLUSH
    }))
} else {
    //错误处理
    onerror(app)
    //响应日志(开发)
    const logger = require('koa-logger')
    app.use(logger())
    //格式化JSON响应
    const json = require('koa-json')
    app.use(json())
    //开启CORS支持
    const cors = require('kcors')
    app.use(cors({
        credentials: true,
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Content-Type', 'Skip-Auth'],
    }))
}

//引入自定义中间件(放在这个位置, 建议仅是一些数据)
middleware.forEach((fun) => {
    app.use(fun())
})

//基础配置相关
app.use(async (ctx, next) => {
    //UUID  用户唯一ID cookie存储, 存1年...
    let uuid = ctx.cookies.get(utils.keys.cookie.prefix+':uuid')||''
    if (!uuid) {
        const { v4: uuidv4 } = require('uuid')
        let _uuid = uuidv4()
        ctx.cookies.set(utils.keys.cookie.prefix+':uuid', _uuid, {
            maxAge: 365*86400000,    //365天有效期
            signed: false,
            path: '/',
            domain: isProd ? utils.keys.cookie.domain : '',
            secure: false,
            httpOnly: false,         //仅服务器访问
            overwrite: true          //同一响应中覆盖同名的cookie(不管路径或域名)
        })
        uuid = _uuid
    }

    //bjx:nonce  配合bjx:rand使用 防止采集ajax数据(cookie不跨域, 在当前站点下!)
    let nonce = ctx.cookies.get(utils.keys.cookie.prefix+':nonce')||''
    if (!nonce) {
        let _nonce = Math.random().toString().substr(2, 10)
        ctx.cookies.set(utils.keys.cookie.prefix+':nonce', _nonce, {
            maxAge: 0,               //session
            signed: false,
            path: '/',
            domain: '',
            secure: false,
            httpOnly: false,         //仅服务器访问
            overwrite: true          //同一响应中覆盖同名的cookie(不管路径或域名)
        })
    }

    ctx.uuid = uuid
    ctx.isProd = isProd
    await next()
})

//手机访问相关
app.use(async (ctx, next) => {
    //判断是否为手机
    let isMobi = false
    if (ctx.header['user-agent']) {
        let ua = ctx.header['user-agent'].toLowerCase()
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))) {
            isMobi = true
        }
    }

    //某些路径跳转手机端
    // if (isMobi) {
    //     if (ctx.path == '/') {
    //         ctx.redirect('https://'+ctx.site.url_m+'/')
    //         return
    //     }
    //     if (/^\/companys\/\d+.html|^\/jobs\/\d+.html/.test(ctx.path)) {
    //         ctx.redirect('https://'+ctx.site.url_m+ctx.url)
    //         return
    //     }
    // }

    ctx.isMobi = isMobi
    await next()
})

//静态资源支持
app.use(serve(path.join(__dirname, 'public'), {
    maxage: isProd?3600000:0    //生产环境缓存1小时(但是生产环境的资源文件都放在CDN上了)(毫秒)
}))

//启用session
app.use(session2({
    key: utils.keys.cookie.prefix+':sess',
    store: new RedisStore(),
    maxAge: 10*60*60*1000,  //10个小时有效期
    signed: true,
    path: '/',
    domain: isProd ? utils.keys.cookie.domain : '',
    secure: false,
    httpOnly: true,
    overwrite: true
}))

//启用passport
app.use(passport.initialize())
app.use(passport.session())

//检查登录状态
app.use(async (ctx, next) => {
    //假如浏览器不存在bjx:keep 则清空登录状态
    let keep = ctx.cookies.get(utils.keys.cookie.prefix+':keep', {signed: true})||''
    if (!keep) {
        ctx.logout()
    }
    await next()
})

//更新访问令牌
app.use(async (ctx, next) => {
    let now = Date.now()
    let user = ctx.state.user||{}
    if (!/^\/oidc\//.test(ctx.url) && !ctx.session.token_loading && user.token && (user.token.expires_at*1000 - 60*1000 < now)) {  //提前一分钟验证
    // if (true) {
        // console.log('更新访问令牌', user.token.expires_at*1000, now)
        ctx.session.token_loading = 1

        //https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.12.1
        try {
            let tokenset = await client.refresh(user.token.refresh_token)
            // console.log(tokenset)
            Object.assign(ctx.state.user.token, tokenset)
            ctx.session.refresh()
            delete ctx.session.token_loading
        } catch (err) {
            delete ctx.session.token_loading
            ctx.logout()
            ctx.app.emit('error', err, ctx, 'app-refresh_token')
        }
    }
    await next()
})

//更新用户信息
app.use(async (ctx, next) => {
    let now = Date.now()
    let user = ctx.state.user||{}
    if (!/^\/oidc\//.test(ctx.url) && !ctx.session.info_loading && user.info && (user.info.ts + 10*60*1000 < now)) {  //每10分钟更新一次用户信息
    // if (true) {
        // console.log('更新用户信息', user.info.ts, now)
        ctx.session.info_loading = 1

        let url = utils.apis.auth+'/api/User/BaseInfo'
        let headers = {
            'Content-Type': 'application/json',
            "X-Forwarded-For": ctx.headers['x-forwarded-for']||ctx.ip,
            'Authorization': user.token.token_type+' '+user.token.access_token,
        }
        let body = JSON.stringify({
            ...utils.getReqSign(ctx.uuid)
        })

        try {
            let res = await utils.fetchJson(url, {method: 'POST', headers, body})

            if (res.IsError === false) {
                Object.assign(ctx.state.user.info, {ts: Date.now(), ...res.Data})
                delete ctx.session.info_loading
            } else {
                throw 'DataError: '+url+'=>'+JSON.stringify(res)
            }
        } catch (err) {
            delete ctx.session.info_loading
            ctx.app.emit('error', err, ctx, 'app-update_info')
        }
    }
    await next()
})

//登录调试相关
app.use(async (ctx, next) => {
    // if (!isProd) {
    //     //后台自动登录
    //     let skip_auth = ctx.cookies.get('Skip-Auth')||ctx.get('Skip-Auth')||''
    //     if (skip_auth) {
    //         ctx.state.user = {
    //               "token": {
    //                 "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IlRrLVNaQXcyWUsyQnhHZS1mTFpaV2M5QnljUSIsInR5cCI6IkpXVCIsIng1dCI6IlRrLVNaQXcyWUsyQnhHZS1mTFpaV2M5QnljUSJ9.eyJuYmYiOjE2MTI3NTI2NDQsImV4cCI6MTYxMjc1Mjk0NCwiaXNzIjoiaHR0cHM6Ly9wYXNzcG9ydC5ianguY29tLmNuIiwiYXVkIjoiaHIucGMubXlociIsImlhdCI6MTYxMjc1MjY0NCwiYXRfaGFzaCI6Il9SQ0p6OUl5UUVnZVZDR29ENjdLRmciLCJzaWQiOiJjMDU0ODJlZjA2ZjIxOGU3MjVhYzg3OTgxZmNkNWVjNCIsInN1YiI6IkU1NURBOTQ2LTExRjgtNEVCQi05QzNCLTUzNkRBQzMzNzk3OSIsImF1dGhfdGltZSI6MTYxMjc1MjY0MywiaWRwIjoibG9jYWwiLCJhbXIiOlsicHdkIl19.UMyjluzDz_igHpmy0G8Wnwn4WqQxPWtT4OI-bJMo7H6HVpgcqh_jj4QlyR_p9Sux7afhPrrakWbYqBONzXMeAhp_Zx10Z90PpUP3uHBbJcfXwf_D_RE3j6UOUHLhWL6iy4qPaiWQ-Zwf3dy_wTPE_KNZjI2oTLPW6lvIyQG1u1lG_EUtZRzbX8OpfikB7cXewJkjq9oGvunC0jRxWG4a_I5gAxaVNrmCSr9gmeCBH0e9hJzYGTM4verR1X_0ALeW0B3OEbF6U5qymr62yQT1pOa1tAxrHKICAdBDFr7qxfJW0VKIMSy27P13T58cHrQoD50IaUrG80jTgoP45C9xEQ",
    //                 "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IlRrLVNaQXcyWUsyQnhHZS1mTFpaV2M5QnljUSIsInR5cCI6IkpXVCIsIng1dCI6IlRrLVNaQXcyWUsyQnhHZS1mTFpaV2M5QnljUSJ9.eyJuYmYiOjE2MTI3NTI2NDMsImV4cCI6MTYxMjc1NjI0MywiaXNzIjoiaHR0cHM6Ly9wYXNzcG9ydC5ianguY29tLmNuIiwiYXVkIjpbImh0dHBzOi8vcGFzc3BvcnQuYmp4LmNvbS5jbi9yZXNvdXJjZXMiLCJhdXRoLmFwaSIsInNlZWtlci5hcGkiXSwiY2xpZW50X2lkIjoiaHIucGMubXlociIsInN1YiI6IkU1NURBOTQ2LTExRjgtNEVCQi05QzNCLTUzNkRBQzMzNzk3OSIsImF1dGhfdGltZSI6MTYxMjc1MjY0MywiaWRwIjoibG9jYWwiLCJzZXJJZCI6IjM2ODAzNTIiLCJyZWNJZCI6IjEwIiwibmFtZSI6ImJqeGFkbWluIiwidWlkIjoiMTEwMDAwMDAxMCIsInNjb3BlIjpbIm9wZW5pZCIsInByb2ZpbGUiLCJhdXRoLmFwaSIsInNlZWtlci5hcGkiLCJvZmZsaW5lX2FjY2VzcyJdLCJhbXIiOlsicHdkIl19.VmXflRNHNmQ8LDQKW6xn0jNAVMp0OABu6dnSXBYWc-XGb-jDoi486Cv28DcL2XyYppKY5t-BPcfqo7Wb_9tHFfX93qFpaAuzZXu6myH6IK_wAnb99v8fQ3E-gMq7K8AT4hXLy6Y4KnpT0xwq9K3vSfxpX8CmVIN55CfkFjOsob9eJamwd-nw1OCfJcwYWH1JiOHgL7tE3WI6yKUh4Ahzt1mZ1vuHGES0fvvgFZYRM9Y91afESAUDIijjFKzou5mvdxVfWz-le8sterdA0mcHsxKrUGfe8zeb6DFL1pt7-bv72vqNdLbMKDDzG6PgPnzs0l_WP-FRGJUJUchU83tj3A",
    //                 "expires_at": 1612756244,
    //                 "token_type": "Bearer",
    //                 "refresh_token": "2c934045fe3fa87df85e9992b5e2596fed61f4c3d37cd6901b65995b7e00a7f0",
    //                 "session_state": "4inBJEGHs7m9HMOFk_tadj9LykIMxan7drwHTxb7ih8.d922600e0afaf7eea07baed52162c8d2"
    //               },
    //               "info": {
    //                 "ts": 1612752644047,
    //                 "HasCompany": false,
    //                 "Id": "E55DA946-11F8-4EBB-9C3B-536DAC337979",
    //                 "UId": 1100000010,
    //                 "UserName": "bjxadmin",
    //                 "NickName": "徐薇",
    //                 "Email": "hr@bjxmail.com",
    //                 "EmailIsCheck": true,
    //                 "Phone": "13522133427",
    //                 "PhoneIsCheck": true,
    //                 "HeadUrl": "https://static.bjx.com.cn/EnterpriseNew/HRHead/4638/2019082309072959_719773.jpeg",
    //                 "Industry": 2,
    //                 "Source": 9,
    //                 "ShowName": "徐薇",
    //                 "HeadIsDef": false,
    //                 "Nick": ""
    //               }
    //         }
    //     }

    //     //前台错误提示
    //     let show_debug = ctx.cookies.get('Show-Debug')||''
    //     if (!show_debug) {
    //         ctx.cookies.set('Show-Debug', '1', {
    //             maxAge: 0,               //session
    //             signed: false,
    //             path: '/',
    //             domain: '',
    //             secure: false,
    //             httpOnly: false,         //仅服务器访问
    //             overwrite: true          //同一响应中覆盖同名的cookie(不管路径或域名)
    //         })
    //     }
    // }

    await next()
})

//暴露登录状态
app.use(async (ctx, next) => {
    //设置
    let uid = ctx.cookies.get(utils.keys.cookie.prefix+':uid')||''
    let _uid = ctx.isAuthenticated()&&ctx.state.user.info?ctx.state.user.info.UId+'':''
    if (uid !== _uid) {
        ctx.cookies.set(utils.keys.cookie.prefix+':uid', _uid, {
            maxAge: 0,               //session
            signed: false,
            path: '/',
            domain: isProd ? utils.keys.cookie.domain : '',
            secure: false,
            httpOnly: false,         //仅服务器访问
            overwrite: true          //同一响应中覆盖同名的cookie(不管路径或域名)
        })
    }

    await next()
})

//设置请求响应
app.use(async (ctx, next) => {
    //禁止浏览器缓存页面
    ctx.set("Cache-Control", "no-cache, no-store, must-revalidate")
    ctx.set("Pragma", "no-cache")
    ctx.set("Expires", "0")

    await next()

    //登录相关处理
    if (ctx.set_op_logout) {
        //服务端退出时 通知前端退出 
        if (!/^\/oidc\//.test(ctx.url)) {
            if (/text\/html/.test(ctx.response.headers['content-type']) && typeof ctx.body=='string') {  //html响应 添加一条script引用
                ctx.body = ctx.body.replace('</body', '<script src="/oidc/set_op_logout"></script></body')
            } else if (/application\/json/.test(ctx.response.headers['content-type'])) {  //json响应 在对象内添加一个字段
                ctx.body = {set_op_logout: 1, ...ctx.body}
            }
        }
    } else {
        //没有登录时 检查登录状态并确定是否静默登录
        if (ctx.isUnauthenticated()) {
            if (!/^\/oidc\/|^\/api\//.test(ctx.url) && /text\/html/.test(ctx.response.headers['content-type']) && typeof ctx.body=='string') {  //html响应 添加两条script引用
                ctx.body = ctx.body.replace('</body', '<script src="/oidc/check_op_login"></script></body')
            }
        }
    }
})

//静态页面支持
app.use(serve(path.join(__dirname, 'static'), {
    maxage: isProd?3600000:0    //生产环境缓存1小时(毫秒)
}))

//设置服务端缓存(缓存某些路由)
if (isProd) {
    /**
     * 关于 缓存 与 压缩 的一些说明 (注意中间件的顺序!)
     * 
     *    路径                                    缓存方式                压缩方式    验证并发送登录状态
     * 1. public目录(CSS/JS/IMG/预编译模板文件)    浏览器缓存              启用Gzip    不验证登录
     * 2. static目录(专题静态页)                   浏览器不缓存            启用Gzip    验证登录(设置包含uid的cookie)
     * 3. 路由(网址/接口)                          服务器缓存(部分)        启用gzip    验证登录(设置包含uid的cookie)
     * 
     * CSS/JS/IMG       开发环境时,使用动态时间戳,以保证每次都是最新的! 生产环境时,使用发版日期的时间戳,遵循服务器设置的浏览器缓存策略! 但是,生产环境时,CSS/JS/IMG文件会放在CDN上, 所以使用阿里云的ETAG缓存策略
     * 预编译模板文件    现在已放在CDN,和CSS/JS/IMG策略相同
     * 专题静态页        因为是静态页,所以没有设置浏览器缓存
     * 网址/接口         路由产生的页面,禁止浏览器缓存! 以防止IIS(ARR)缓存页面! 而企业详情和职位详情内容变化不大,所以做了1分钟的服务器缓存
     * 
     */
    // const cache = require('koa-redis-cache')
    // app.use(cache({
    //     prefix: function(ctx) {
    //         return process.env.npm_package_name+':page_cache:'+ctx.path+':'
    //     },
    //     routes: [
    //         {
    //             path: '/',
    //             expire: 4*3600          //过期时间(秒)
    //         },
    //     ],
    //     redis: {
    //         host: utils.keys.redis.host,
    //         port: utils.keys.redis.port,
    //         options: {
    //             db: utils.keys.redis.db
    //         }
    //     }
    // }))
}

//添加模板环境
app.use(views(path.join(__dirname, 'views'), {
    extension: 'htm',
    map: {
        htm: 'nunjucks'
    },
    options: {
        nunjucksEnv: nunjucksEnv
    }
}))

//添加路由数据
app.use(router.routes(), router.allowedMethods())

//路由匹配失败
app.use((ctx, next) => {
    ctx.redirect('/404.html')
})

//记录错误日志
app.on('error', (err, ctx, flag) => {
    // console.log(err.name, err.code, err.message, err.stack)
    if (isProd) {
        console.error(`${flag&&('['+flag+'] ')||''}${err} ${ctx.method} ${ctx.url} ${ctx.status} ${ctx.headers['x-forwarded-for']||ctx.ip} ${ctx.headers['user-agent']}`)
    } else {
        flag && console.error(flag)
        console.error(err)
        console.error(ctx)
    }
})

//清除服务端缓存
;(async () => {
    const flag = '__CC20180105130000CC__'
    const Redis = require("ioredis")
    let redis = new Redis(utils.keys.redis)
    let key = process.env.npm_package_name+':page_cache_flag'
    let current = await redis.get(key)
    if (current !== flag) {
        //设置标志
        await redis.set(key, flag)
        //查询缓存条目
        let res = await redis.keys(process.env.npm_package_name+':page_cache:*')
        if (res.length > 0) {
            await redis.del(...res)
        }
        console.log('清除路由缓存', flag)
    }
    redis.disconnect()
})()


module.exports = app