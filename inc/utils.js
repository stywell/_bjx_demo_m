const fs = require('fs')
const crypto = require('crypto')
const fetch = require('node-fetch');
const apis = require('./_apis')
const keys = require('./_keys')


module.exports = {
    //接口地址
    apis: apis,

    //帐号密匙
    keys: keys,

    //http://www.ruanyifeng.com/blog/2020/12/fetch-tutorial.html
    // fetch(url, {
    //     method: "GET",
    //     headers: {
    //       "Content-Type": "text/plain;charset=UTF-8"
    //     },
    //     body: undefined,
    //     referrer: "about:client",
    //     referrerPolicy: "no-referrer-when-downgrade",
    //     mode: "cors", 
    //     credentials: "same-origin",
    //     cache: "default",
    //     redirect: "follow",
    //     integrity: "",
    //     keepalive: false,
    //     signal: undefined
    // })

    //获取TEXT数据
    fetchText: function(url, opt) {
        return new Promise((resolve, reject) => {
            fetch(url, opt)
            .then(res => res.text())
            .then(data => { resolve(data) })
            .catch(err => { reject(err) })
        })
    },

    //获取JSON数据
    fetchJson: function(url, opt) {
        return new Promise((resolve, reject) => {
            fetch(url, opt)
            .then(res => res.json())
            .then(data => { resolve(data) })
            .catch(err => { reject(err) })
        })
    },

    //读取文件
    readFilePromise: function(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, (error, data) => {
                if (error) reject(error)
                resolve(data)
            })
        })
    },

    //写入文件
    writeFilePromise: function(file, data) {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, data, (error) => {
                if (error) reject(error)
                resolve('done')
            })
        })
    },

    //删除文件
    unlinkPromise: function(file, allowEmpty) {
        return new Promise((resolve, reject) => {
            fs.unlink(file, (error) => {
                if (error) {
                    if (allowEmpty && error.errno !== -4058) {
                        reject(error)
                    } else if (!allowEmpty) {
                        reject(error)
                    }
                }
                resolve('done')
            })
        })
    },

    //重命名文件
    renamePromise: function(file, newName) {
        return new Promise((resolve, reject) => {
            fs.rename(file, newName, (error) => {
                if (error) reject(error)
                resolve('done')
            })
        })
    },

    //标签转HTML实体
    escape: function(html) {
        if (typeof html !== 'string') return ''
        var keys = Object.keys || function(obj) {
            obj = Object(obj)
            var arr = []
            for (var a in obj) arr.push(a)
            return arr
        }
        var entityMap = {
            '&': '&amp;',
            '"': '&quot;',
            '\'': '&#39;',
            '<': '&lt;',
            '>': '&gt;'
        }
        var entityReg = new RegExp('[' + keys(entityMap).join('') + ']', 'g')
        return html.replace(entityReg, function(match) {
            return entityMap[match]
        })
    },

    //分页处理程序
    pageList: function(current, total, relativeURL, suffix, size) {
        suffix = suffix||''
        size = size||5
        var pagelist = []
        //当总页数小于2时，或当前页大于总页数时（手动URL输入），返回空数组也就是不显示分页
        if (total < 2 || current > total) {
            return pagelist
        }
        //当总数 小于等于分页大小时 分页大小为总页数
        if (total <= size) {
            size = total
        }
        //首页
        if (current == 1) {
            pagelist.push({name:'首页', url: 'javascript:;'})
        } else {
            pagelist.push({name:'首页', url: relativeURL+'1'+suffix})
        }
        //上一页
        if (current > 1) {
            pagelist.push({name:'上一页', url: relativeURL+(current-1)+suffix})
        }
        for (let i=1; i<=size; i++) {
            if (current < Math.round(size/2)){
                var index = i
            } else if (current >= (total-Math.round(size/2)+1)) {
                var index = (total-size)+i
            } else {
                var index = current-Math.round(size/2)+i
            }
            if ( index == current ) {
                pagelist.push({name: index, url: relativeURL+index+suffix, class: 'active'})
            } else {
                pagelist.push({name: index, url: relativeURL+index+suffix})
            }

        }
        //下一页
        if (current < total) {
            pagelist.push({name:'下一页', url: relativeURL+(current+1)+suffix})
        }
        //末页
        if (current == total) {
            pagelist.push({name:'末页', url: 'javascript:;'})
        } else {
            pagelist.push({name:'末页', url: relativeURL+total+suffix})
        }
        //返回数据
        return pagelist
    },

    //分页处理程序2
    pageList2: function(current, total, relativeURL, opt) {
        if (current == undefined || total == undefined || relativeURL ==undefined) {
            return []
        }
        opt = opt||{}
        let suffix = opt.suffix||''
        let size = opt.size||5
        let start = opt.start||true //首页
        let prev = opt.prev||true   //上一页
        let pageno = opt.next||true //页码
        let next = opt.next||true   //下一页
        let end = opt.end||true     //尾页

        //输出对象
        let pagelist = []

        //当总页数小于2时，或当前页大于总页数时（手动URL输入），返回空数组也就是不显示分页
        if (total < 2 || current > total) {
            return pagelist
        }
        //当总数 小于等于分页大小时 分页大小为总页数
        if (total <= size) {
            size = total
        }

        //首页
        if (start) {
            if (current == 1) {
                pagelist.push({name:'首页', url: 'javascript:;'})
            } else {
                pagelist.push({name:'首页', url: relativeURL+'1'+suffix})
            }
        }
        //上一页
        if (prev) {
            if (current > 1) {
                pagelist.push({name:'上一页', url: relativeURL+(current-1)+suffix})
            }
        }
        //页码
        if (pageno) {
            for (let i=1; i<=size; i++) {
                if (current < Math.round(size/2)){
                    var index = i
                } else if (current >= (total-Math.round(size/2)+1)) {
                    var index = (total-size)+i
                } else {
                    var index = current-Math.round(size/2)+i
                }
                if ( index == current ) {
                    pagelist.push({name: index, url: relativeURL+index+suffix, class: 'active'})
                } else {
                    pagelist.push({name: index, url: relativeURL+index+suffix})
                }
            }
        }
        //下一页
        if (next) {
            if (current < total) {
                pagelist.push({name: '下一页', url: relativeURL+(current+1)+suffix})
            }
        }
        //末页
        if (end) {
            if (current == total) {
                pagelist.push({name: '末页', url: 'javascript:;'})
            } else {
                pagelist.push({name: '末页', url: relativeURL+total+suffix})
            }
        }

        //返回数据
        return pagelist
    },

    //前端自验签名-生成
    getReqParam: function(method, path, param, secret) {
        if (!method || !path || typeof param !== 'object') return {}
        const SECRET = secret||'Bjx180917*SecRet_Key'
        let random = Math.random().toString(16).slice(2)
        let timestamp = Date.now()
        let args = Object.assign({}, param, {random, timestamp})

        let args_sort_arr = Object.keys(args).sort()
        let args_str = args_sort_arr.map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(typeof args[key] === 'object'?JSON.stringify(args[key]):args[key])
        }).join('&')

        let str2sign = encodeURIComponent(method.toUpperCase()) + '&' + encodeURIComponent(path) + '&' + encodeURIComponent(args_str)
        let signature = crypto.createHmac('sha1', SECRET).update(str2sign).digest('hex')
        // console.log(args, args_sort_arr, args_str, str2sign, signature)

        return Object.assign({}, args, {signature})
    },

    //前端自验签名-验证
    verifyParam: function(ctx) {
        /**
         * 支持的请求格式
         *      GET
         *      POST (application/x-www-form-urlencoded | application/json)
         * 
         * 签名所需参数
         *      random     随机数
         *      timestamp  时间戳(精确到毫秒)
         *      signature  签名
         * 
         * 签名算法
         *      示例: https://yun.bjx.com.cn/api/super_login/?token=111&redirect=222&random=333&timestamp=444&signature=*
         * 
         *      1. 排序请求中的所有参数(signature除外) 以创建 结构化的请求字符串
         *          说明:
         *              按参数名称排序后, 使用encodeURIComponent()编码, 参数的键和值, 使用=连接; 之后使用&连接键值对
         *          算法:
         *              encodeURIComponent('random')+'='+encodeURIComponent('333')+'&'+
         *              encodeURIComponent('redirect')+'='+encodeURIComponent('222')+'&'+
         *              encodeURIComponent('timestamp')+'='+encodeURIComponent('444')+'&'+
         *              encodeURIComponent('token')+'='+encodeURIComponent('111')
         *          结果:
         *              random=333&redirect=222&timestamp=444&token=111
         *
         *      2. 使用请求方法/路径/结构化的请求字符串 创建 签名字符串
         *          说明:
         *              使用encodeURIComponent()编码, 请求方法(大写!) / 请求路径 / 结构化的请求字符串, 并使用&连接三段
         *          算法:
         *              encodeURIComponent('GET')+'&'+encodeURIComponent('/api/super_login/')+'&'+encodeURIComponent('结构化的请求字符串')
         *          结果:
         *              GET&%2Fapi%2Fsuper_login%2F&random=333&redirect=222&timestamp=444&token=111
         *
         *      3. 使用HMAC-SHA1加密 签名字符串 获取其16进制(HEX)结果 作为 签名
         *          HMAC密匙:
         *              Bjx180917*SecRet_Key
         *          Node算法:
         *              crypto.createHmac('sha1', 'Bjx180917*SecRet_Key').update('签名字符串').digest('hex')
         *          结果:
         *              a455b90c8d92da319218d496e53ff4dce36c53e8
         *          测试地址:
         *              https://1024tools.com/hmac
         *
         *      4. 把签名放回参数中, 发送请求
         */
        const SECRET = 'Bjx180917*SecRet_Key'
        const TIMEOUT = 60  //单位:秒

        //加密参数
        let req_method = ctx.method
        let req_path = ctx.url.split('?')[0]
        let req_args = req_method === 'GET'?ctx.request.query:ctx.request.body

        //检查参数是否正常
        if (!req_args.signature) {
            return {status: 0, message: '缺少signature参数'}
        }
        if (!req_args.timestamp) {
            return {status: 0, message: '缺少timestamp参数'}
        }
        if (!req_args.random) {
            return {status: 0, message: '缺少random参数'}
        }

        //验证是否在有效期内
        if (req_args.timestamp && (Date.now() - req_args.timestamp*1 >= TIMEOUT*1000) ) {
            return {status: 0, message: '签名已过期'}
        }

        //接收的签名
        let req_signature = req_args.signature
        delete req_args.signature

        let args_sort_arr = Object.keys(req_args).sort()
        let args_str = args_sort_arr.map(function(key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(typeof req_args[key] === 'object'?JSON.stringify(req_args[key]):req_args[key])
        }).join('&')

        let str2sign = encodeURIComponent(req_method)+'&'+encodeURIComponent(req_path)+'&'+encodeURIComponent(args_str)
        let signature = crypto.createHmac('sha1', SECRET).update(str2sign).digest('hex')
        // console.log(args_str, req_signature, str2sign, signature)

        //验证是否在有效期内
        if (req_signature.toLowerCase() === signature) {
            return {status: 1, message: '签名有效'}
        } else {
            return {status: 0, message: '签名无效'}
        }
    },


    //人才接口自验签名
    getReqSign: function(EQP, OS, BA, BP) {
        const secret = 'bjxstat2019'
        let obj = {
            EQP: '',
            OS: 1,
            BA: '',
            BP: '',
            Ver: process.env.npm_package_version||'',
            TS: Date.now(),
        }
        if (EQP) {
            obj.EQP = EQP
        } else {
            throw 'missing parameter: EQP'
        }
        OS ? obj.OS = OS : ''
        BA ? obj.BA = BA : ''
        BP ? obj.BP = BP : ''
        let str = `EQP=${obj.EQP}&OS=${obj.OS}&BA=${obj.BA}&BP=${obj.BP}&Ver=${obj.Ver}&TS=${obj.TS}+${secret}`
        let Sign = crypto.createHash('md5').update(str).digest('hex').toUpperCase()
        return Object.assign(obj, {Sign})
    },

    //媒体接口自验签名
    getHeadSign: function(uuid, appid = 1026) {
        if (!uuid) throw 'missing parameter: uuid'
        //请注释掉不用的以防止泄露到前端
        const secret_map = {
          1000: 'BBABEDAA71204FD5ACC4426E9E1936C9',  //北极星学院
          1001: '830195C99B76457F-A5E8CFFE582EBAD3',  //北极星社区
          1002: '9CD68BC4A4B5429AAFAC2C340DD890C1',  //北极星电力学院
          1003: 'FC62F891733043E18300BC21AF8050F2',  //北极星光伏新闻小程序
          1004: 'A9B6CA3E-F373CB3D79D4FD41B35802CA',  //工业水处理工专项训练
          1005: 'DF5171A236754D42940FF2397E97DE9E',  //北极星环保头条ios
          1006: '0FE80DED882648089E4BE40CECE50C6A',  //北极星环保头条android
          1007: '752D6DE6391D406C8F7AE10E6F9645A0',  //北极星光伏ios
          1008: 'F5ABFD3072F54EA3AF2B3C18BFCE8651',  //北极星光伏android
          1009: 'E59BB1EFA787433A9D1A361D89316BC3',  //北极星电力ios
          1010: '920A71508C304730BF5E58D828A5E87E',  //北极星电力android
          1011: '731abf14e12e48cc898db724e796794e',  //北极星环保学院
          1012: '4AFCF00F52734721AB4F636DAB7FF41A',  //北极星环保新闻小程序
          1013: '3D097D74025549F3AA9894AF6148807B',  //北极星电力新闻小程序
          1014: 'DE86BBAE537C44A483ABF4EDB0333917',  //北极星学院小程序
          1015: '392C66B178548898923011E16A84D8E',   //北极星学院个人中心
          1016: '5B9C2CCBC9D04DE7B0A734A99F5E9F93',  //北极星直播
          1017: '10D6251551F7848F4317F4E128846D45',  //北极星招聘(学院学院版块)ios
          1018: '95AEC997FD09DA706DA843EACC5B02F0',  //北极星招聘(学院学院版块)android
          1019: '639715B936F7447D8831EA5A85118D4B',  //北极星投票
          1020: '65709D8EB8A54D25BAAD13612558599D',  //北极星电力新闻手机版
          1021: 'A10B575FF85E45DC827B691979EA1914',  //北极星环保新闻手机版
          1022: '1E792A770CC14C09BF1B940262F36C22',  //北极星光伏新闻手机版
          1023: '9F144B442D121B18B30C9F37FF27E19',   //北极星智能电网新闻手机版
          1024: '3227AD74C9DAF8B7437CA17A12C1E22B',  //edu管理后台
          1026: 'CADFC5FBCAFE425A92050D79AFA1A450',  //电力
          1027: '081E3655EF0045E5A8284D1DF56BCA8D',  //环保

        }
        const secret = secret_map[appid]
        const indate = 5  //时间偏移 单位分钟
        let now = parseInt(Date.now()/1000)
        let ver = ((process.env.VUE_APP_VERSION||0)+'').replace(/\./g, '')
        let nonce = Math.random().toString(36).substr(2)+Math.random().toString(36).substr(2)+Math.random().toString(36).substr(2)+Math.random().toString(36).substr(2)
        let str = `AT-${appid}-${now}-${now+indate*60}-${ver}-${uuid.replace(/-/g, '')}-${nonce.substr(1, 32)}-${secret}`
        let sign = crypto.createHash('md5').update(str).digest('hex').toUpperCase()
        return str.replace(secret, sign)
    },

    //检查登录中间件
    isAuthed: function(flag) {
        return async (ctx, next) => {
            if (ctx.isUnauthenticated()) {
                if (flag) {
                    let r = new RegExp('^'+apis.self)
                    if (r.test(ctx.headers['referer']||'')) {
                        if (!ctx.session.overstep_login_num) {
                            await ctx.render('403.htm', {site: ctx.site, type: 1, href: '/oidc/login/'})
                        } else {
                            await ctx.render('403.htm', {site: ctx.site, type: 2, href: '/oidc/login/', num: ctx.session.overstep_login_num})
                        }
                    } else {
                        ctx.redirect('/oidc/login/?f='+encodeURIComponent(ctx.url))
                    }
                } else {
                    if (!ctx.session.overstep_login_num) {
                        ctx.body = {status: 600, message: '登录失效，请重新登录', data: '/oidc/login/?f='+encodeURIComponent(ctx.headers['referer']||'/'), extra: 'set_op_logout'}
                    } else {
                        ctx.body = {status: 600, message: '登录超限，请重新登录', data: '/oidc/login/?f='+encodeURIComponent(ctx.headers['referer']||'/'), extra: 'set_op_logout'}
                    }
                }
                return
            } else {
                await next()
            }
        }
    },

    //检查权限中间件
    isAllowed: function(type, flag) {
        return async (ctx, next) => {
            await next()
        }
    },

    //防采集中间件
    isCred: function(flag) {
        return async (ctx, next) => {
            if (!flag || (flag && ctx.request.query.ajax == '1')) {
                let rand = ctx.cookies.get(keys.cookie.prefix+':rand')||''
                if (rand) {
                    let p1 = rand.substr(15)
                    let p2 = rand.substr(0, 15)
                    let ts = (parseInt(p1, 16).toString().substr(5))*1

                    if (ts + 5*60*1000 < Date.now()) {
                        ctx.status = 400
                        ctx.body = {status: 0, message: "请求错误，请刷新页面-1"}
                        return
                    } else {
                        let ip = ctx.headers['x-forwarded-for']||ctx.ip
                        let ua = ctx.headers['user-agent']||''
                        let part2 = crypto.createHmac('sha1', 'illegal478'+p1).update(JSON.stringify({ip, ua})).digest('hex').substr(2, 15)

                        if (p2 !== part2) {
                            ctx.status = 400
                            ctx.body = {status: 0, message: "请求错误，请刷新页面-2"}
                            return
                        }
                    }
                } else {
                    ctx.status = 400
                    ctx.body = {status: 0, message: "请求错误，请刷新页面-0"}
                    return
                }
            }
            await next()
        }
    },

    //https://blog.csdn.net/chaos_hf/article/details/80150911
    breadthQuery: function(tree, value) {  //根据value
        var stark = []
        stark = stark.concat(tree)
        while(stark.length) {
            var temp = stark.shift()
            if(temp.children) {
                stark = stark.concat(temp.children)
            }
            if(temp.value === value) {
                return temp
            }
        }
    },
    breadthQuery2: function(tree, path) {  //根据path
        var stark = []
        stark = stark.concat(tree)
        while(stark.length) {
            var temp = stark.shift()
            if(temp.children) {
                stark = stark.concat(temp.children)
            }
            if(temp.path === path) {
                return temp
            }
        }
    },
    deepQuery: function(tree, id) {  //不移除子分类
        var isGet = false
        var retNodes = []
        function deepSearch(tree, id, layer){
            for(var i = 0; i<tree.length; i++) {
                isGet || (retNodes[layer] = tree[i])
                if(tree[i].children && tree[i].children.length>0) {
                    deepSearch(tree[i].children, id, layer+1)
                }
                if(!tree[i].isMinor && (tree[i].value === id || isGet)) {
                    if (!isGet) {
                        retNodes[layer] = tree[i]
                        retNodes.splice(layer+1, 10)
                    }
                    isGet = true
                    break
                }
            }
        }
        deepSearch(tree, id, 0)
        return retNodes.length&&isGet?retNodes:null
    },
    deepQuery2: function(tree, id) {  //移除子分类
        var isGet = false
        var retNodes = []
        function deepSearch(tree, id, layer){
            for(var i = 0; i<tree.length; i++) {
                isGet || (retNodes[layer] = Object.assign({}, tree[i], {children: undefined}))
                if(tree[i].children && tree[i].children.length>0) {
                    deepSearch(tree[i].children, id, layer+1)
                }
                if(!tree[i].isMinor && (tree[i].value === id || isGet)) {
                    if (!isGet) {
                        retNodes[layer] = Object.assign({}, tree[i], {children: undefined})
                        retNodes.splice(layer+1, 10)
                    }
                    isGet = true
                    break
                }
            }
        }
        deepSearch(tree, id, 0)
        return retNodes.length&&isGet?retNodes:null
    }
}