import { RedisClientType, createClient } from "redis";
import { Connection, ConnectionOption } from ".";
import { env } from "@/lib/env";
import { Log } from "@/lib/logger";

export class Redis implements Connection {
    
    private static client: Record<string, RedisClientType> = {} 
    private option: ConnectionOption

    constructor(private key: string = 'default', option?: ConnectionOption) {
        this.option = {
            user: env.get('REDIS_USERNAME').toString(),
            password: env.get('REDIS_PASSWORD').toString(),
            host: env.get('REDIS_HOST').toString('127.0.0.1'),
            port: env.get('REDIS_PORT').toNumber(),
            ...option
        }
    }

    static instance(key: string = 'default'): RedisClientType {
        return Redis.client[key]
    }

    async open(): Promise<void> {
        Redis.client[this.key] = createClient({ 
            url: `redis://${this.option.user!}:${this.option.password!}@${this.option.host!}:${this.option.port!}`
        })

        Redis.client[this.key].on('error', err => Log.error("Redis client error", err))
        await Redis.client[this.key].connect()
        Log.info(`Memstore ${this.key} client opened...`)
    }

    async close(): Promise<void> {
        Log.info(`Memstore ${this.key} client disconnected...`);
        if (Redis.client[this.key].isOpen) await Redis.client[this.key].quit()
    }
}