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
import { Server } from "http";
import helmet from 'helmet'
import { typeable } from './middleware/typeable';
import { Log } from '@/lib/logger';
import ms from 'ms';
import moment from 'moment';
import color from 'colors'

export interface Service {
    createRoutes(): void
}

export interface ServiceInitter {
    init(): void
}

export interface ServiceCloser {
    close(): void
}

export interface Plugin<T> {
    install(app: App<T>, option: AppOption): void
}

export interface App<T> {
    server: Server
    services: Service[]
    app: T

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

export class Application implements App<Express> {

    server: Server
    services: Service[] = []

    private BASE_URL = env.get('BASE_URL').toString('http://localhost:3000')
    private option: AppOption
    private db: Connection = new Database()
    private memstore: Connection = new Memstore()
    private environment = env.get('NODE_ENV').toString('dev')

    private plugins: Plugin<Express>[] = []

    constructor(public app: Express, option?: AppOption) {
        this.option = {
            services,
            name: 'index',
            useDb: true,
            useMemstore: true,
            port: 3000,
            ...option
        }

        logger.token('time', () => `[${moment().format('HH:mm:ss')}]`)

        // default middleware
        app.disable('x-powered-by')
        app.use(
            rateLimit({ windowMs: ms('1m'), limit: 60 }),
            typeable, 
            helmet(),
            express.json(),
            bodyParser.urlencoded({ extended: true }),
            cookieParser(),
            logger(`\[${color.green('LOG')}\] :time ${color.green(':method')} :url - ${color.yellow(':response-time ms')}`),
            cors({ 
                origin: env.get('CORS_ALLOWED_ORIGIN').toString('*'),
                credentials: true,
                allowedHeaders: ["Accept", 'X-Requested-With', 'X-HTTP-Method-Override', "Content-Type", "Content-Length", "Accept-Encoding", "Authorization"]
            }),
        )

        this.server = this.app.listen(this.option.port, () => {
            const BASE_URL = this.changePort(this.option.port!)
            Log.info(`Server ${this.option.name} is running at`, BASE_URL)
        })
    }

    private changePort(port: number): string {
        let baseUrl = this.BASE_URL
        const splitted = this.BASE_URL.split(':')
        if (splitted.length > 2) {
            splitted[2] = String(port)
            baseUrl = splitted.join(':')
        }

        return baseUrl
    }

    use(plugin: Plugin<Express>): App<Express> {
        this.plugins.push(plugin)
        return this
    }

    private installPlugin() {
        for (const plugin of this.plugins) {
            plugin.install(this, this.option)
        }
    }

    private canInit(service: any): service is ServiceInitter {
        return 'init' in service
    }

    start() {
        if (this.option.useDb) this.db.open()
        if (this.option.useMemstore) this.memstore.open()
        this.installPlugin()

        for (const service of this.option.services!) {
            const svc = service(this.app)

            if (this.canInit(svc)) svc.init()
            svc.createRoutes()

            this.services.push(svc)
        }

        this.app._router.stack
            .filter((router: any) => router.name === 'router' || router.route)
            .flatMap((router: any) => router.name === 'router' ? router.handle.stack : router)
            .forEach((router: any) => {
                Log.info(`Registered route ${router.route.stack[0].method.toUpperCase()}`, router.route.path)
            })
    }

    private canClose(service: any): service is ServiceCloser {
        return 'close' in service
    }

    private _shutdown() {
        for (const service of this.services) {    
            if (this.canClose(service)) service.close()
        }

        Log.info('HTTP server closed...')
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
                Log.warning(`${signal} signal caught. Terminating...`);
                this._shutdown()
            })
        }
    }
}