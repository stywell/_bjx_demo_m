const Redis = require("ioredis")
const { Store } = require("koa-session2")
const keys = require('./_keys')

class RedisStore extends Store {
    constructor() {
        super()
        this.redis = new Redis(keys.redis)
    }

    async get(sid, ctx) {
        let data = await this.redis.get(`SESSION:${sid}`)
        return JSON.parse(data)
    }

    async set(session, { sid = this.getID(24), maxAge = 10*60*60*1000 } = {}, ctx) {  //10个小时有效期
        try {
            // Use redis set EX to automatically drop expired sessions
            await this.redis.set(`SESSION:${sid}`, JSON.stringify(session), 'EX', maxAge / 1000)
        } catch (e) {}
        return sid
    }

    async destroy(sid, ctx) {
        return await this.redis.del(`SESSION:${sid}`)
    }
}

module.exports = RedisStore