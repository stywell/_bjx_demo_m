const router = require('koa-router')()
const { passport, client, scope } = require('../inc/passport')
const utils = require('../inc/utils')


//注册
router.get('/oidc/signup',
    async (ctx, next) => {
        let f = ctx.query.f||''
        let r = new RegExp('^'+utils.apis.self)
        if (f && /^\//.test(f)) {
            f = utils.apis.self + f
        } else if (f && !r.test(f)) {
            f = utils.apis.self
        }
        if (f) {
            ctx.redirect(utils.apis.acc+'/Account/Register?returnurl='+encodeURIComponent(f))
        } else {
            ctx.redirect(utils.apis.acc+'/Account/Register')
        }
    }
)

//登录
router.get('/oidc/login',
    async (ctx, next) => {
        let f = ctx.query.f||ctx.headers['referer']||''
        let r = new RegExp('^'+utils.apis.self)
        if (f && !/^\//.test(f) && !r.test(f)) {
            f = utils.apis.self
        }
        ctx.session.passport_callback = f||'/'
        await next()
    },
    passport.authenticate('oidc')
)

//登录回调
router.get('/oidc/callback',
    async (ctx, next) => {  //在已登录的情况访问callback地址, 直接跳回源地址或者根目录
        if (ctx.isAuthenticated()) {
            ctx.redirect(ctx.session.passport_callback||ctx.headers['referer']||'/')
            delete ctx.session.passport_callback
            return
        }
        await next()
    },
    passport.authenticate('oidc', {failureRedirect: '/oidc/error/'}),  //鉴权过程
    async (ctx, next) => {  //获取账号基本信息
        let user = {}
        {
            let url = utils.apis.auth+'/api/User/BaseInfoV1'
            let headers = {
                'Content-Type': 'application/json',
                'Authorization': ctx.state.user.token.token_type+' '+ctx.state.user.token.access_token,
            }
            let body = JSON.stringify({
                ...utils.getReqSign(ctx.uuid)
            })

            try {
                let res = await utils.fetchJson(url, {method: 'POST', headers, body})

                if (res.IsError === false) {
                    user.info = {ts: Date.now(), ...res.Data}
                } else {
                    throw 'DataError: '+url+' '+JSON.stringify(res)
                }
            } catch (err) {
                ctx.logout()
                ctx.status = 500
                ctx.type = 'html'
                ctx.body = '用户信息无效：'+err
                ctx.app.emit('error', err, ctx, 'oidc-1')
                return
            }
        }
        Object.assign(ctx.state.user, user)
        await next()
    },
    async (ctx, next) => {  //设置前台登录
        ctx.cookies.set(utils.keys.cookie.prefix+':keep', Math.random().toString(16).slice(2), {
            maxAge: 0,         //session
            signed: true,
            path: '/',
            domain: ctx.isProd ? utils.keys.cookie.domain : '',
            secure: false,
            httpOnly: true,    //仅服务器访问
            overwrite: true    //同一响应中覆盖同名的cookie(不管路径或域名)
        })
        ctx.type = 'html'
        ctx.body = `
        <script>
            localStorage.setItem("bjx_user_info", '${JSON.stringify(ctx.state.user.info)}');
            location.href = "${ctx.session.passport_callback}";
        </script>
        <noscript><a href="${ctx.session.passport_callback}">马上跳转</a></noscript>
        `
        delete ctx.session.passport_callback
    }
)

//授权错误
router.get('/oidc/error', async (ctx, next) => {
    ctx.type = 'html'
    ctx.body = '授权错误，请<a href="/oidc/login/?f=%2F" rel="nofollow">重新登录</a>'
})

//登出
router.get('/oidc/logout', async (ctx, next) => {
    //https://openid.net/specs/openid-connect-frontchannel-1_0.html#RPInitiated
    let f = ctx.query.f||''
    let n = ctx.query.n||''  //不显示"重新登录"页, 直接退出
    let r = new RegExp('^'+utils.apis.self)
    if (f && /^\//.test(f)) {
        f = utils.apis.self + f
    } else if (f && !r.test(f)) {
        f = utils.apis.self
    }
    if (ctx.isAuthenticated() || n) {
        let url
        if (f) {
            url = utils.apis.acc + '/Account/LogoutExt?returnurl=' + encodeURIComponent(f)
        } else {
            url = utils.apis.acc + '/Account/LogoutExt?returnurl=' + encodeURIComponent('/Account/Login?returnurl=' + encodeURIComponent(utils.apis.self))
        }
        ctx.type = 'html'
        ctx.body = `
        <script>
            localStorage.setItem("bjx_user_info", Date.now());
            location.href = "${url}";
        </script>
        <noscript><a href="${url}">马上跳转</a></noscript>
        `
    } else {
        ctx.type = 'html'
        ctx.body = '<a href="/oidc/login/?f=%2F">重新登录</a>'
    }
    ctx.logout()
})

//清除RP状态
router.get('/oidc/clear_session', async (ctx, next) => {
    //https://openid.net/specs/openid-connect-frontchannel-1_0.html#OPLogout
    // let iss = ctx.query.iss
    // let sid = ctx.query.sid
    // if (ctx.isAuthenticated()) {
    //     const {TokenSet} = require('openid-client')
    //     let tokenset = new TokenSet(ctx.state.user.token)
    //     let claims = tokenset.claims
    //     if (claims.iss === iss && claims.sid === sid) {
    //         ctx.logout()
    //         ctx.body = 'clear session success'
    //     } else {
    //         ctx.status = 400
    //     }
    // } else {
    //     ctx.status = 401
    // }

    //不验证OP退出请求合法性
    ctx.logout()
    ctx.type = 'html'
    ctx.body = `
    <script>
        localStorage.setItem("bjx_user_info", Date.now());
        document.write("clear session success");
    </script>
    `

    ctx.set('Cache-Control', 'no-cache, no-store')
    ctx.set('Pragma', 'no-cache')
})

//设置OP登出
router.get('/oidc/set_op_logout', async (ctx, next) => {
    let code = `
!function() {
    var jsonp = function(){"use strict";var e=0;return function(n,r,t){t||(t=r,r={});var c=r.object||window,o=r.key||"j"+e++,a="parameter"in r?r.parameter:"callback",d=document.createElement("script");d.src=a?n+(~n.indexOf("?")?"&":"?")+a+"="+o:n,d.onerror=function(){delete c[o],t(Error())},c[o]=function(e){delete c[o],t(null,e)},document.head.removeChild(document.head.appendChild(d))}}();
    var op_logout = function() {
        var ifr = window.document.createElement("iframe");
            ifr.style.visibility = "hidden";
            ifr.style.position = "absolute";
            ifr.style.display = "none";
            ifr.style.width = 0;
            ifr.style.height = 0;
            ifr.className = "js-op-logout-ifr";
            ifr.src = "${utils.apis.acc}/Account/LogoutExt";
        window.document.body.appendChild(ifr);
    };
    //检查当前帐号是否登录超限
    jsonp('${utils.apis.acc}/Account/LimitCheckForJsonp', function(err, data) {
        if (err) return;
        if (!data.is_login) {
            op_logout();
        }
    });
    window.set_op_logout = 1;
}();
!function() {
    var r = function(e) {
        e && e.parentNode.removeChild(e);
    };
    var s = document.getElementsByTagName('script');
    var s1 = s[s.length - 1];
    r(s1);
}();
`
    ctx.type = 'js'
    ctx.body = code
})


/** 静默登录 */
const sess_key = 'oidc:silent_login'

//静默登录
router.get('/oidc/silent_login', async (ctx, next) => {
    if (ctx.isAuthenticated()) return

    //防止CSRF
    let state = Math.random().toString(16).substr(2)
    ctx.session[sess_key] = {state, response_type: 'code'}

    let url = client.authorizationUrl({
        redirect_uri: utils.apis.self+'/oidc/silent_callback',
        scope: scope
    })
    ctx.redirect(url+'&state='+state+'&prompt=none')
})

//静默登录回调
router.get('/oidc/silent_callback', async (ctx, next) => {
    if (ctx.isAuthenticated()) return

    //解析响应
    let params = client.callbackParams(ctx.req)

    //获取登录请求保存的session
    let checks = ctx.session[sess_key]
    delete ctx.session[sess_key]

    //执行回调
    let tokenset = {}
    try {
        tokenset = await client.callback(utils.apis.self+'/oidc/silent_callback', params, checks)
    } catch (err) {
        ctx.status = 500
        ctx.type = 'html'
        ctx.body = '授权信息无效：'+err
        ctx.app.emit('error', err, ctx, 'oidc-2')
        return
    }

    //获取用户信息
    let userinfo = {}
    {
        let url = utils.apis.auth+'/api/User/BaseInfoV1'
        let headers = {
            'Content-Type': 'application/json',
            'Authorization': tokenset.token_type+' '+tokenset.access_token,
        }
        let body = JSON.stringify({
            ...utils.getReqSign(ctx.uuid)
        })

        try {
            let res = await utils.fetchJson(url, {method: 'POST', headers, body})

            if (res.IsError === false) {
                userinfo = {ts: Date.now(), ...res.Data}
            } else {
                throw 'DataError: '+url+' '+JSON.stringify(res)
            }
        } catch (err) {
            ctx.status = 500
            ctx.type = 'html'
            ctx.body = '用户信息无效：'+err
            ctx.app.emit('error', err, ctx, 'oidc-3')
            return
        }
    }

    //存储登录信息
    ctx.login({token: tokenset, info: userinfo})

    //设置登录状态cookie
    ctx.cookies.set(utils.keys.cookie.prefix+':keep', Math.random().toString(16).slice(2), {
        maxAge: 0,         //session
        signed: true,
        path: '/',
        domain: ctx.isProd ? utils.keys.cookie.domain : '',
        secure: false,
        httpOnly: true,    //仅服务器访问
        overwrite: true    //同一响应中覆盖同名的cookie(不管路径或域名)
    })
    //设置本地存储以通知其他页面
    ctx.type = 'html'
    ctx.body = `
    <script>
        localStorage.setItem("bjx_user_info", '${JSON.stringify(userinfo)}');
    </script>
    `
})

//检查OP登录
router.get('/oidc/check_op_login', async (ctx, next) => {
    let code = `
!function() {
    var jsonp = function(){"use strict";var e=0;return function(n,r,t){t||(t=r,r={});var c=r.object||window,o=r.key||"j"+e++,a="parameter"in r?r.parameter:"callback",d=document.createElement("script");d.src=a?n+(~n.indexOf("?")?"&":"?")+a+"="+o:n,d.onerror=function(){delete c[o],t(Error())},c[o]=function(e){delete c[o],t(null,e)},document.head.removeChild(document.head.appendChild(d))}}();
    var op_login = function() {
        var ifr = window.document.createElement("iframe");
            ifr.style.visibility = "hidden";
            ifr.style.position = "absolute";
            ifr.style.display = "none";
            ifr.style.width = 0;
            ifr.style.height = 0;
            ifr.className = "js-op-login-ifr";
            ifr.src = "/oidc/silent_login";
        window.document.body.appendChild(ifr);
    };
    //检查授权服务器是否登录
    jsonp('${utils.apis.acc}/Account/LoginStateV3ForJsonp', function(err, data) {
        if (err) return;
        if (data.is_login) {
            op_login();
        }
    });
    window.check_op_login = 1;
}();
!function() {
    var r = function(e) {
        e && e.parentNode.removeChild(e);
    };
    var s = document.getElementsByTagName('script');
    var s1 = s[s.length - 1];
    r(s1);
}();
`
    ctx.type = 'js'
    ctx.body = ctx.isUnauthenticated()?code:''
})

module.exports = router
