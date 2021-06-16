const utils = require('../inc/utils')
const isProd = process.env.NODE_ENV === 'production'

module.exports = [
    () => {
        return async (ctx, next) => {
            //服务端所需
            let conf = {
                industry_id: -1,
                industry_depth: -1,
                home_seo: {
                    title: `北极星招聘-电力招聘_电厂招聘_环保招聘_工程招聘_电气招聘服务平台`,
                    keywords: `北极星招聘,电力招聘,电厂招聘,电厂招聘信息,电力英才网招聘,电力人才网,环保招聘,工程招聘,电气招聘`,
                    description: `北极星招聘是垂直行业招聘服务平台，目前已覆盖电力招聘、电厂招聘、电气招聘、环保招聘、工程招聘等行业、专为企（事）业单位提供社会招聘、校园招聘、猎头RPO服务、学习培训、HR交流咨询等一站式人力资源服务。`
                },
            }

            //前端所需
            let site = {
                name: '北极星招聘',
                url: 'www.bjx.com.cn',
                url_m: 'm.bjx.com.cn',
                statis: ``,
                apis: {
                    acc: utils.apis.acc,
                    self: utils.apis.self,
                    usr: utils.apis.usr,
                    hr_usr: utils.apis.hr_usr,
                    edu_usr: utils.apis.edu_usr,
                },
                is_prod: isProd,
                year: new Date().getFullYear(),
            }
        
            //页面资源缓存处理
            if (!isProd) {
                site.asset = {
                    rev: '?_='+Date.now(),
                    base: ''
                }
            } else {
                site.asset = {
                    rev: '?_=__CC20180105130000CC__',
                    base: 'https://static.bjx.com.cn/public/'+utils.keys.cdn+'/'+process.env.npm_package_name
                }
            }

            ctx.conf = conf
            ctx.site = site
            await next()
        }
    },
]