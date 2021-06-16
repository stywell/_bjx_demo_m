const passport = require('koa-passport')
const {Issuer, Strategy, custom} = require('openid-client')

const apis = require('./_apis')
const keys = require('./_keys')

const issuer_conf = {
    "issuer": apis.acc,
    "jwks_uri": apis.acc+"/.well-known/openid-configuration/jwks",
    "authorization_endpoint": apis.acc+"/connect/authorize",
    "token_endpoint": apis.acc+"/connect/token",
    "userinfo_endpoint": apis.acc+"/connect/userinfo",
    "end_session_endpoint": apis.acc+"/connect/endsession",
    "check_session_iframe": apis.acc+"/connect/checksession",
    "revocation_endpoint": apis.acc+"/connect/revocation",
    "introspection_endpoint": apis.acc+"/connect/introspect",
    "device_authorization_endpoint": apis.acc+"/connect/deviceauthorization",
    "frontchannel_logout_supported": true,
    "frontchannel_logout_session_supported": true,
    "backchannel_logout_supported": true,
    "backchannel_logout_session_supported": true,
    "scopes_supported": ["openid", "profile", "email", "phone", "bjx.blend", "auth.api", "seeker.api", "cmp.api", "media.api", "media2.api", "offline_access"],
    "claims_supported": ["sub", "recId", "role", "updated_at", "locale", "zoneinfo", "birthdate", "gender", "website", "profile", "preferred_username", "nickname", "middle_name", "given_name", "family_name", "name", "picture", "email_verified", "email", "phone_number", "phone_number_verified", "serId", "sid", "jti", "uid", "mgr", "mswt"],
    "grant_types_supported": ["authorization_code", "client_credentials", "refresh_token", "implicit", "password", "urn:ietf:params:oauth:grant-type:device_code"],
    "response_types_supported": ["code", "token", "id_token", "id_token token", "code id_token", "code token", "code id_token token"],
    "response_modes_supported": ["form_post", "query", "fragment"],
    "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
    "subject_types_supported": ["public"],
    "id_token_signing_alg_values_supported": ["RS256"],
    "code_challenge_methods_supported": ["plain", "S256"]
}

const client_conf = {
    client_id: keys.oidc.id,
    client_secret: keys.oidc.secret,
    redirect_uris: [apis.self+'/oidc/callback'],
    response_types: ['code'],  //使用授权码流 框架默认也为授权码流! 使用混合流可以传"code id_token token"等 详情https://openid.net/specs/openid-connect-core-1_0.html#codeExample
}


const issuer = new Issuer(issuer_conf)
const client = new issuer.Client(client_conf)
      client[custom.clock_tolerance] = 5  //允许系统时钟偏差5分钟

passport.use('oidc',
    new Strategy(
        {client, params: {scope: keys.oidc.scope}},
        (tokenset, done) => {
            // console.log('tokenset', tokenset, tokenset.claims())
            done(null, {token: tokenset})
        }
    )
)

//http://www.passportjs.org/docs/configure/#sessions
passport.serializeUser((user, done) => {
    done(null, user)
})
passport.deserializeUser((user, done) => {
    done(null, user)
})


module.exports = {passport, client, scope: keys.oidc.scope}