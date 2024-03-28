import { RedisClientType, createClient } from "redis";
import { Connection } from ".";
import { env } from "@/lib/env";

export class Memstore implements Connection {
    
    private static client: RedisClientType 

    static instance(): typeof Memstore.client {
        return Memstore.client
    }

    async open(): Promise<void> {
        Memstore.client = createClient({ 
            url: `redis://${env.get('REDIS_USERNAME').toString()}:${env.get('REDIS_PASSWORD').toString()}@${env.get('REDIS_HOST').toString('127.0.0.1')}:${env.get('REDIS_PORT').toString()}`
        })

        Memstore.client.on('error', err => console.log("redis client error", err))
        await Memstore.client.connect()
    }

    async close(): Promise<void> {
        console.log('Memstore client disconnected...');
        if (Memstore.client.isOpen) await Memstore.client.quit()
    }
}