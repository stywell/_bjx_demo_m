const router = require('koa-router')()


const oidc = require('./oidc')
router.use(oidc.routes())

const api = require('./api')
router.use(api.routes())

const main = require('./1.main')
router.use(main.routes())


module.exports = router