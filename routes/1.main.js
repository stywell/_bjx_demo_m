const router = require('koa-router')()
const utils = require('../inc/utils')



//首页
router.get('/', async (ctx, next) => {
    //页面数据
    let output = {}
        output.url = ctx.url
        output.href = ctx.href
        output.site = ctx.site

    //热词
    {
        let url = utils.apis.pub3+'/api/v1/News/GetHotWords'
        let headers = {
            'Content-Type': 'application/json',
            'Authorization': ctx.state.user ? ctx.state.user.token.token_type+' '+ctx.state.user.token.access_token : '',
            'x-app-token': utils.getHeadSign(ctx.uuid)
        }
        let body = JSON.stringify({
            num: 9,
            site: 1,
            keyPosition: 4,
        })

        try {
            let res = await utils.fetchJson(url, {method: 'POST', headers, body})

            if (res.IsError === false) {
                output.keyword_list = res.Data
            } else {
                throw 'DataError: '+url+'=>'+JSON.stringify(res)
            }
        } catch (error) {
            ctx.app.emit('error', error, ctx, 'home-1')
        }
    }

    //打印数据
    // ctx.body = output
    // return

    //渲染页面
    await ctx.render('home.htm', output)
})

//404页面
router.get('/404.html', async (ctx, next) => {
    //页面数据
    let output = {}
        output.url = ctx.url
        output.href = ctx.href
        output.site = ctx.site

    ctx.status = 404
    ctx.body = '404 Not Found'
})

//503页面
router.get('/503.html', async (ctx, next) => {
    //页面数据
    let output = {}
        output.url = ctx.url
        output.href = ctx.href
        output.site = ctx.site

    ctx.status = 503
    ctx.body = '503 Service Unavailable'
})

//注册
router.get('/signup', async (ctx, next) => {
    let f = ctx.query.f||ctx.headers['referer']||'/'
    ctx.redirect('/oidc/signup/?f='+encodeURIComponent(f))
})

//登录
router.get('/login', async (ctx, next) => {
    let f = ctx.query.f||ctx.headers['referer']||'/'
    ctx.redirect('/oidc/login/?f='+encodeURIComponent(f))
})


module.exports = router
