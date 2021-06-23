###这里写你的网站说明###

PC端 和 手机端的 主要区别  在于 gulpfile.js 以及 package.json 中的不同!
移动端使用px2vw的解决屏幕宽度问题!


=================================================



# 站点目录
_src                 静态页目录
    css                  样式表
        font             字体图标 (www.iconfont.cn)
        lib              类库
    img                  图片资源
        chip             不可合并的碎图片
        snippet          合并到雪碧图的碎图片 (不会复制到public目录)
    js                   静态页脚本
        lib              类库
    pic                  网页占位图片 (不会复制到public目录)
_dist                生产文件打包目录
bin
    www              程序入口
inc                  引入文件目录
    _apis.js             接口文件 (不允许上传到git)
    _keys.js             密匙文件 (不允许上传到git)
    middleware.js        站点差异数据中间件
    nunjucks_env.js      模板环境模块
    passport.js          登录授权模块
    store.js             session模块
    utils.js             工具模块
public               资源文件目录 (网站模板所需资源)
    css                  从_src构建而来
    img                  从_src构建而来
    js                   网站模板所需脚本
        lib
            nunjucks-slim.min.js    浏览器模板渲染类库 (可以不使用浏览器渲染!)
        nunjucks_env.js             浏览器模板渲染环境 (配合tpl中的预编译模板)
        module
            child_module.js         浏览器模块支持
        page_module.esm.js          浏览器模块支持
    tpl                  从views/cnippet构建而来 (预编译模板片段)
routes               路由文件目录
    api.js               页面内请求路由
    oidc.js              登录相关路由
static               静态文件目录
    favicon.ico          网站图标
    robots.txt           爬虫协议
views                模板文件目录
    chip                 模板片段 (仅服务端使用)
    snippet              模板片段 (需要预编译以供前台使用)
.gitignore           git忽略配置
app.js               网站主文件
ecosystem.config.js  pm2生产环境配置文件
gulpfile.js          gulp构建工具配置文件
nodemon.json         nodemon开发环境配置文件
package.json         项目配置文件
preview.bat          一键预览
publish.bat          一键打包
reload.bat           一键重启 (服务端用)


# 开发环境
1. 下载并安装 node.js / redis
2. 全局安装 cnpm
    npm install -g cnpm --registry=https://registry.npm.taobao.org
3. 全局安装 以下模块
    cnpm i nodemon -g                     //进程运行工具(v1.19.0)
    cnpm i gulp-cli -g                    //构建工具(gulp4)
4. 网站目录执行
    cnpm i                                //安装网站所需依赖

常用命令(网站目录执行)与一键脚本:
    gulp (gulp env)                       //运行静态页开发环境
    gulp style                            //编译scss到public

    npm run dev                           //运行网站开发环境

    gulp tpl                              //编译浏览器所需预编译模板
    gulp pub                              //打包发布版本
    gulp pub-cdn                          //打包发布版本(仅CDN所需文件)
    gulp pub-ser                          //打包发布版本(仅服务器所需文件)

    preview.bat                           //快速 预览站点 [npm run dev]
    publish.bat                           //快速 打包站点 [gulp style && gulp pub]

    gulp upload                           //上传阿里云OSS
    gulp pack                             //打包资源文件为zip

    npm outdated                          //检查依赖更新
    netstat -aon|findstr "3099"           //查看端口占用
    tasklist /fi "imagename eq node.exe"  //查看进程
    taskkill /im node.exe /f              //结束进程


# 生产环境
1. 下载并安装 node.js / redis
2. 全局安装 cnpm
    npm install -g cnpm --registry=https://registry.npm.taobao.org
3. 全局安装 以下模块
    cnpm i pm2 -g                         //进程管理工具(v3.5.0)
    cnpm i pm2-windows-startup -g         //pm2开机启动工具(仅windows)
4. 设置PM2相关配置
    pm2-startup install                   //添加PM2在windows下的开机启动的服务(仅windows)
    pm2 startup                           //添加PM2在linux下的开机启动的服务

    pm2 install pm2-logrotate             //安装PM2日志分割插件 并设置规则
    pm2 set pm2-logrotate:max_size 100M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress false
    pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    pm2 set pm2-logrotate:workerInterval  30
    pm2 set pm2-logrotate:rotateInterval 0 0 * * *
    pm2 set pm2-logrotate:rotateInterval Etc/GMT-1
    pm2 get pm2-logrotate

5. 网站目录执行
    cnpm i                                //安装网站所需依赖

常用命令(网站目录执行)与一键脚本:
    npm run prd                          //运行网站生成环境(集群模式请修改PM2配置文件)
    npm run delete                       //删除PM2守护进程
    npm run reload                       //重启PM2守护进程

    reload.bat                           //快速 重新加载站点 [npm run reload]


# PM2相关命令
## 通用 
pm2 start app.js               #启动，守护进程并自动重启应用程序（node）
pm2 start app.py               #启动，守护进程并自动重启应用程序（python）
pm2 start npm -- start         #启动，守护进程并自动重启node应用程序

## 集群模式（仅适用于Node.js）
pm2 start app.js -i 4          #在集群模式下启动4个应用程序实例
pm2 reload all                 #不停机重新加载
pm2 scale [app-name] 10        #将群集应用程序扩展到10进程

## 进程监控 
pm2 list                       #列出所有进程
pm2 list --sort=<field>        #排序所有进程
pm2 monit                      #显示每个app的内存和CPU的使用情况
pm2 show [app-name]            #显示应用程序的所有信息

## 日志管理 
pm2 logs                       #显示所有应用的日志
pm2 logs [app-name]            #显示特定应用的日志 
pm2 logs --json                #显示json格式的日志
pm2 flush
pm2 reloadLogs

## 进程状态管理 
pm2 start app.js --name="api"  #启动应用程序并将其命名为“api”
pm2 start app.js -- -a 34      #启动应用程序并将“-a 34”作为参数
pm2 start app.js --watch       #文件变更时重启应用
pm2 start script.sh            #启动bash脚本
pm2 start app.json             #启动在app.json声明的所有应用程序
pm2 reset [app-name]           #复位某个app的计数器
pm2 stop all                   #停止所有应用
pm2 stop 0                     #停止ID为0的应用
pm2 restart all                #重启所有应用
pm2 gracefulReload all         #集群模式时 优雅地重启应用
pm2 delete all                 #删除所有应用
pm2 delete 0                   #删除ID为0的应用

## 启动/引导管理 
pm2 startup                    #探测init系统，在系统启动时生成并配置pm2启动
pm2 save                       #保存当前进程列表
pm2 resurrect                  #恢复先前保存的进程列表
pm2 unstartup                  #禁用并删除自动启动

pm2 update                     #保存进程，杀掉PM2并恢复进程列表
pm2 init                       #生成一个样例js配置文件

## 部署 
pm2 deploy app.json prod setup
pm2 deploy app.json prod
pm2 deploy app.json prod revert 2

## 模块系统 
pm2 module:generate [name]     #生成名称为[name]的样本模块 
pm2 install pm2-logrotate      #安装模块（这里是日志轮换系统）
pm2 uninstall pm2-logrotate    #卸载模块 
pm2 publish                    #增量版本，git push并npm发布


## Fork mode
pm2 start app.js --name my-api # Name process

## Cluster mode
pm2 start app.js -i 0          # Will start maximum processes with LB depending on available CPUs
pm2 start app.js -i max        # Same as above, but deprecated.
pm2 scale app +3               # Scales `app` up by 3 workers
pm2 scale app 2                # Scales `app` up or down to 2 workers total

## Listing
pm2 list                       # Display all processes status
pm2 jlist                      # Print process list in raw JSON
pm2 prettylist                 # Print process list in beautified JSON

pm2 describe 0                 # Display all informations about a specific process

pm2 monit                      # Monitor all processes

## Logs
pm2 logs [--raw]               # Display all processes logs in streaming
pm2 flush                      # Empty all log files
pm2 reloadLogs                 # Reload all logs

## Actions
pm2 stop all                   # Stop all processes
pm2 restart all                # Restart all processes

pm2 reload all                 # Will 0s downtime reload (for NETWORKED apps)

pm2 stop 0                     # Stop specific process id
pm2 restart 0                  # Restart specific process id

pm2 delete 0                   # Will remove process from pm2 list
pm2 delete all                 # Will remove all processes from pm2 list

## Misc
pm2 reset <process>            # Reset meta data (restarted time...)
pm2 updatePM2                  # Update in memory pm2
pm2 ping                       # Ensure pm2 daemon has been launched
pm2 sendSignal SIGUSR2 my-app  # Send system signal to script
pm2 start app.js --no-daemon
pm2 start app.js --no-vizion
pm2 start app.js --no-autorestart
