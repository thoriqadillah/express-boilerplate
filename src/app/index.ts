import cors from 'cors'
import logger from "morgan";
import express from "express";
import bodyParser from 'body-parser'
import cookieParser from "cookie-parser";
import { rateLimit } from 'express-rate-limit'

import { env } from "@/lib/env";
import { Express } from "express";
import { Memstore } from "@/db/memstore";
import { Connection, Database } from "@/db";
import { ExpressService, services } from "@/app/module";
import { IncomingMessage, Server, ServerResponse } from "http";
import helmet from 'helmet'
import { Typeable } from '@/plugin/typeable';

export interface Service {
    createRoutes(): void
}

export interface ServiceInitter {
    init(): void
}

function canInit(service: any): service is ServiceInitter {
    return 'init' in service
}

export interface ServiceCloser {
    close(): void
}

function canClose(service: any): service is ServiceCloser {
    return 'close' in service
}

export interface Plugin {
    install(app: App, option: AppOption): void
}

export interface App {
    server: Server<typeof IncomingMessage, typeof ServerResponse>
    services: Service[]
    app: Express

    start(): void
    shutdown(): void
}

export interface AppOption {
    name?: string
    useDb?: boolean
    useMemstore?: boolean
    services?: ExpressService[],
    port?: number
}


export class Application implements App {

    server: Server<typeof IncomingMessage, typeof ServerResponse>
    services: Service[] = []

    private BASE_URL = env.get('BASE_URL').toString('http://localhost:3000')
    private option: AppOption
    private db: Connection = new Database()
    private memstore: Connection = new Memstore()
    private environment = env.get('NODE_ENV').toString('dev')

    private plugins: Plugin[] = []

    constructor(public app: Express, option?: AppOption) {
        this.option = {
            services,
            name: 'index',
            useDb: true,
            useMemstore: true,
            port: 3000,
            ...option
        }

        // default middleware
        app.disable('x-powered-by')
        app.use(
            // rateLimit({
            //     windowMs: 60 * 1000, // 1 minute,
            //     limit: 60,
            // }),
            helmet(),
            express.json(),
            bodyParser.urlencoded({ extended: true }),
            cookieParser(),
            logger(':method \t :url \t :status \t :response-time ms'),
            cors({ 
                origin: env.get('CORS_ALLOWED_ORIGIN').toString('*'),
                credentials: true,
                allowedHeaders: ["Accept", 'X-Requested-With', 'X-HTTP-Method-Override', "Content-Type", "Content-Length", "Accept-Encoding", "Authorization"]
            }),
        )

        this.server = this.app.listen(this.option.port, () => {
            const BASE_URL = this.changePort(this.option.port!)
            console.log(`Server ${this.option.name} is running at ${BASE_URL}`)
        })
    }

    changePort(port: number): string {
        let baseUrl = this.BASE_URL
        const splitted = this.BASE_URL.split(':')
        
        if (splitted.length > 2) {
            splitted[2] = String(port)
            baseUrl = splitted.join(':')
        }

        return baseUrl
    }

    use(plugin: Plugin): App {
        this.plugins.push(plugin)
        return this
    }

    installPlugin() {
        for (const plugin of this.plugins) {
            plugin.install(this, this.option)
        }
    }

    start() {
        if (this.option.useDb) this.db.open()
        if (this.option.useMemstore) this.memstore.open()

        this.use(new Typeable())
        this.installPlugin()

        for (const service of this.option.services!) {
            const svc = service(this.app)

            if (canInit(svc)) svc.init()
            svc.createRoutes()

            this.services.push(svc)
        }
    }

    private _shutdown() {
        for (const service of this.services) {    
            if (canClose(service)) service.close()
        }

        console.log('HTTP server closed...')
        if (this.server) this.server.close()

        if (this.option.useDb) this.db.close()
        if (this.option.useMemstore) this.memstore.close()
    }

    shutdown() {
        if (this.environment === 'test') this._shutdown()
        
        // graceful shutdown
        const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT']
        for (const signal of signals) {
            process.on(signal, (signal) => {
                console.log(`\n${signal} signal caught. Terminating...`);
                this._shutdown()
            })
        }
    }
}