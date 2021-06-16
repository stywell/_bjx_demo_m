const router = require('koa-router')()
const koaBody = require('koa-body')
const utils = require('../inc/utils')


/**
 * ```js
 * // 接口响应数据
 * let rsp = {status: 1000, message: '参数不正确'                                     }     //参数错误
 * let rsp = {status: 800,  message: '人机验证失败'                                   }     //上游错误      (某些第三方接口错误时使用)
 * let rsp = {status: 704,  message: '管理员用户无法使用该功能'                        }     //访问受限      (限制某些特殊用户)
 * let rsp = {status: 703,  message: '错误的请求'                                     }     //访问受限      (防止采集ajax=1的请求)
 * let rsp = {status: 702,  message: '当前登录状态不可使用该功能'                       }     //访问受限      (登录状态不符合预期)
 * let rsp = {status: 701,  message: '没有权限'                                       }     //访问受限      (已登录, 但没有权限)
 * let rsp = {status: 700,  message: '没有登录'                                       }     //访问受限      (未登录)
 * let rsp = {status: 601,  message: '直接跳转',    data: '/activate/'                }     //重定向        (直接跳转)
 * let rsp = {status: 600,  message: '弹框跳转',    data: '/oidc/login/'              }     //重定向        (先弹窗在跳转)
 * let rsp = {status: 1,    message: '请求成功',    data: rsp_obj.Data                }     //请求成功      (请求上游接口成功, 返回上游接口返回的数据)
 * let rsp = {status: 0,    message: '请求失败',    data: rsp_obj                     }     //请求失败      (请求上游接口失败, 返回上游接口返回的内容)
 * let rsp = {status: -1,   message: '请求错误'                                       }     //程序崩溃
 * 
 * // 前台处理顺序
 * if (rsp.status === 1) {
 *     // rsp.data...
 * } else if (rsp.status === 600) {                                                        //先弹窗提示rsp.message, 然后跳转到rsp.data! (弹出弹框之后, 任何操作都要重定向!)
 *     alert(rsp.message)
 *     location.href = rsp.data
 * } else if (rsp.status === 601) {                                                        //直接跳转rsp.data
 *     location.href = rsp.data
 * } else {                                                                                //弹出错误或控制台报错 (如有接口错误就弹接口错误, 否则弹node端错误) (按钮操作->弹出错误 / 页面加载->控制台报错)
 *     alert(rsp.data&&rsp.data.Error?rsp.data.Error:rsp.message)
 *     // console.error(rsp.data&&rsp.data.Error?rsp.data.Error:rsp.message)
 * }
 * ```
 */

 /**
 * ```js
 * // 上游接口响应数据
 * {"HttpStatusCode": 200, "Data": {}, "Error": "查询成功!", "IsError": false}                         //查询正常
 * {"HttpStatusCode": 401, "Error": "未授权", "IsError": true}                                         //未授权 => 登录失效  常用于强制授权的接口
 * {"HttpStatusCode": 450, "Data": {"Limit": 1}, "Error": "登录超限，请重新登录！", "IsError": true}    //超出限制 => 登录超限  常用于强制授权的接口
 * {"HttpStatusCode": 451, "Data": {}, "Error": "登录超限，请重新登录！", "IsError": false}             //用于不需要授权的接口, 并退出登录状态
 * ```
 */


//拉取登录信息
router.get('/api/get_login_info', async (ctx, next) => {
    let output = {}
        output.url = ctx.headers['referer']?ctx.headers['referer'].replace(/^.+?\w\//, '/'):'/'
        output.href = ctx.headers['referer']||'/'
        output.site = ctx.site
    await ctx.render('chip/login.htm', output)
})
//拉取登录数据
router.all('/api/get_login_data', async (ctx, next) => {
    if (ctx.isAuthenticated()) {
        ctx.body = {status: 1, message: '已登录', data: ctx.state.user.info}
    } else {
        ctx.body = {status: 0, message: '未登录'}
    }
})

//拉取AJAX签名
router.all('/api/get_rand', koaBody(), async (ctx, next) => {
    //前台参数
    let nonce = ctx.cookies.get(utils.keys.cookie.prefix+':nonce')||''
    let t = ctx.request.body.t
    let r = ctx.request.body.r

    //需要验证的选项
    let ip = ctx.headers['x-forwarded-for']||ctx.ip
    let ua = ctx.headers['user-agent']||''
    let ref = ctx.headers['referer']||''

    //用到的一个随机数
    let rand = (Math.random()*1e9).toString().substr(0, 5)
    let ts = Date.now().toString()

    if ((t*1 + nonce*1 == r*1) && ip != '' && ua != '' && ref != '') {
        const crypto = require('crypto')

        let part1 = ((rand+ts)*1).toString(16)
        let part2 = crypto.createHmac('sha1', 'illegal478'+part1).update(JSON.stringify({ip, ua})).digest('hex').substr(2, 15)

        ctx.cookies.set(utils.keys.cookie.prefix+':rand', part2+part1, {
            maxAge: 0,               //session
            signed: false,
            path: '/',
            domain: '',
            secure: false,
            httpOnly: false,         //仅服务器访问
            overwrite: true          //同一响应中覆盖同名的cookie(不管路径或域名)
        })
    }
    ctx.body = rand.substr(1, 3)
})

//极验验证-初始化
router.get('/api/gtest/register', async (ctx, next) => {
    const Geetest = require('gt3-sdk')
    const captcha = new Geetest({
        geetest_id: utils.keys.geetest.acc,
        geetest_key: utils.keys.geetest.pwd
    })

    try {
        let data = await captcha.register(null)
        if (data.success) {
            ctx.body = {status: 1, message: '初始化成功', data: data}
            ctx.cookies.set('geetest_fallback', 0, {
                maxAge: 0,         //session
                signed: true,
                path: '',
                domain: '',
                secure: false,
                httpOnly: true,    //仅服务器访问
                overwrite: true    //同一响应中覆盖同名的cookie(不管路径或域名)
            })
        } else {
            ctx.body = {status: 1, message: '初始化成功，故障恢复', data: data}
            ctx.cookies.set('geetest_fallback', 1, {
                maxAge: 0,         //session
                signed: true,
                path: '',
                domain: '',
                secure: false,
                httpOnly: true,    //仅服务器访问
                overwrite: true    //同一响应中覆盖同名的cookie(不管路径或域名)
            })
        }
    } catch (err) {
        ctx.body = {status: -1, message: '请求错误'}
    }
})
//极验验证-二次验证
router.post('/api/gtest/validate', koaBody(), async (ctx, next) => {
    let fallback = ctx.cookies.get('geetest_fallback', {signed: true})||''
    if (!fallback) {
        ctx.body = {status: 1000, message: '无效请求'}
        return
    }

    //前台数据
    let geetest_challenge = ctx.request.body.geetest_challenge||''
    let geetest_validate = ctx.request.body.geetest_validate||''
    let geetest_seccode = ctx.request.body.geetest_seccode||''

    if (!geetest_challenge || !geetest_validate || !geetest_seccode) {
        ctx.body = {status: 1000, message: '参数不正确'}
        return
    }

    const Geetest = require('gt3-sdk')
    const captcha = new Geetest({
        geetest_id: utils.keys.geetest.acc,
        geetest_key: utils.keys.geetest.pwd
    })

    try {
        let success = await captcha.validate(!!(fallback*1), {
            geetest_challenge,
            geetest_validate,
            geetest_seccode,
        })
        if (success) {
            ctx.body = {status: 1, message: '二次验证成功', data: success}
            ctx.cookies.set('geetest_verified', 1, {
                maxAge: 0,         //session
                signed: true,
                path: '',
                domain: '',
                secure: false,
                httpOnly: true,    //仅服务器访问
                overwrite: true    //同一响应中覆盖同名的cookie(不管路径或域名)
            })
        } else {
            ctx.body = {status: 0, message: '二次验证失败', data: success}
            ctx.cookies.set('geetest_verified', '', {
                maxAge: 0,         //session
                signed: true,
                path: '',
                domain: '',
                secure: false,
                httpOnly: true,    //仅服务器访问
                overwrite: true    //同一响应中覆盖同名的cookie(不管路径或域名)
            })
        }
    } catch (err) {
        ctx.body = {status: -1, message: '请求错误'}
    }
})
//发送短信验证码
router.get('/api/send_phone_sms', utils.isAuthed(), async (ctx, next) => {
    let verified = ctx.cookies.get('geetest_verified', {signed: true})||''
    if (!verified) {
        ctx.body = {status: 800,  message: '人机验证失败，请稍后再试'}
        return
    }

    //前台数据
    let phone =  ctx.request.body.phone||''

    //参数处理
    if (!/^1\d{10}$/.test(phone)) {
        ctx.body = {status: 1000, message: '手机号不合法'}
        return
    }

    //请求参数
    let url = utils.apis.auth+'/api/Sms/SendNoAuth'
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': ctx.state.user ? ctx.state.user.token.token_type+' '+ctx.state.user.token.access_token : '',
    }
    let body = JSON.stringify({
        "FunctionType": 3,
        "Phone": phone,
        ...utils.getReqSign(ctx.uuid)
    })

    //发送请求
    try {
        let res = await utils.fetchJson(url, {method: 'POST', headers, body})

        if (res.IsError === false) {
            ctx.body = {status: 1, message: '请求成功', data: res.Data}
        } else {
            ctx.body = {status: 0, message: '请求失败', data: res}
            ctx.app.emit('error', 'DataError: '+url+'=>'+JSON.stringify(res), ctx)
        }
    } catch (error) {
        ctx.body = {status: -1, message: '请求错误'}
        ctx.app.emit('error', error, ctx)
    }
})


module.exports = router
