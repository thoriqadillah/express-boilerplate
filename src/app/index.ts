import cors from 'cors'
import logger from "morgan";
import express from "express";
import bodyParser from 'body-parser'
import cookieParser from "cookie-parser";
import { rateLimit } from 'express-rate-limit'

import { env } from "@/lib/env";
import { Express } from "express";
import { Connection } from "@/db";
import { ExpressService } from "@/app/module";
import { Server } from "http";
import helmet from 'helmet'
import { typeable } from './middleware/typeable';
import { Log } from '@/lib/logger';
import ms from 'ms';
import moment from 'moment';
import color from 'colors'
import { Pluggable, Plugin, PluginCloser } from '@/plugin';

export interface Service {
    createRoutes(): void
}

export interface ServiceInitter {
    init(): void
}

export interface ServiceCloser {
    close(): void
}

export interface App<T> {
    server: Server
    services: Service[]
    app: T

    start(): void
    shutdown(): void
}

export interface AppOption<T> {
    name?: string
    services?: ExpressService[],
    port?: number
    stores?: Connection[],
    plugins?: Pluggable<T>[],
}

export class Application implements App<Express> {

    server: Server
    services: Service[] = []

    private BASE_URL = env.get('BASE_URL').toString('http://localhost:3000')
    private option: AppOption<Express>
    private environment = env.get('NODE_ENV').toString('dev')
    private plugins: Plugin[] = []

    constructor(public app: Express, option?: AppOption<Express>) {
        this.option = {
            services: [],
            name: 'index',
            port: 3000,
            stores: [],
            plugins: [],
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

    private canInit<T>(service: any): service is T {
        return 'init' in service
    }

    private installPlugin() {
        for (const install of this.option.plugins!) {
            const plugin = install(this, this.option)

            this.plugins.push(plugin)
        }
    }

    start() {
        this.option.stores!.forEach(store => store.open())
        this.installPlugin()

        for (const service of this.option.services!) {
            const svc = service(this.app)

            if (this.canInit<ServiceInitter>(svc)) svc.init()
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

    private canClose<T>(service: any): service is T {
        return 'close' in service
    }

    private destroyPlugin() {
        for (const plugin of this.plugins) {
            if (this.canClose<PluginCloser>(plugin)) plugin.close()
        }
    }

    private _shutdown() {
        this.destroyPlugin()
        
        for (const service of this.services) {    
            if (this.canClose<ServiceCloser>(service)) service.close()
        }

        Log.info('HTTP server closed...')
        if (this.server) this.server.close()

        this.option.stores!.forEach(store => store.close())
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