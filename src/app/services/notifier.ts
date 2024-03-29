import { Service, ServiceCloser, ServiceInitter } from "@/app";
import express, { Express, Request, Response } from "express";
import { Payload, broker } from "@/lib/broker";
import { NotifierName, notifier, SendEmail } from "@/lib/notifier";
import { ExpressService } from "@/app/module";
import bodyParser from "body-parser";
import axios from "axios";
import { env } from "@/lib/env";
import Bull, { BackoffOptions, Job } from 'bull'
import { Log } from "@/lib/logger";

export class NotifierService implements Service, ServiceInitter, ServiceCloser {

    private NOTIFIER_DRIVER = env.get('NOTIFIER_DRIVER').toString('ses') as NotifierName

    private event = broker.create('event')
    private mailer = notifier.create(this.NOTIFIER_DRIVER)
    private queue = new Bull('notification', {
        redis: {
            host: env.get('REDIS_HOST').toString(),
            username: env.get('REDIS_USERNAME').toString(),
            password: env.get('REDIS_PASSWORD').toString(),
            port: env.get('REDIS_PORT').toNumber()
        }
    })
    
    constructor(private app: Express) {}

    async init(): Promise<void> {
        // for testing (dev only)
        this.event.subscribe('notification', this.enqueue)

        for (const failed of await this.queue.getFailed())  {
            await this.notify(failed.data)
            failed.remove()
        }

        this.queue.process(async (job, done) => {
            await this.notify(job.data)
            job.remove()
            done()
        })
    }

    enqueue = (payload?: Payload) => {
        this.queue.add(payload, {
            priority: payload?.priority,
            backoff: <BackoffOptions>{
                type: 'fixed',
                delay: 1000
            }
        })
    }

    close(): void {
        this.queue.close()
        Log.info('Queue closed...');
    }

    // for testing (dev only)
    notify = async (payload?: Payload) => {
        const { notifiers, data } = payload!
        if (notifiers) for (const notifier of notifiers) {
            if (notifier === 'email' && data) await this.sendEmail(data)
        }
    }

    sendEmail = async (data: SendEmail) => {
        const { recipient, subject, template, ...payload } = data
        await this.mailer.send([recipient], { subject, template, payload })
    }

    subscribe = async (req: Request, res: Response) => {
        const body = JSON.parse(req.body)
        if (body.Type === 'SubscriptionConfirmation') {
            await axios.get(body.SubscribeURL)
            return res.sendStatus(200)
        }

        const payload = JSON.parse(body.Message) as Payload
        this.enqueue(payload)

        res.Ok()
    }

    createRoutes(): void {
        const v1 = express.Router()
        v1.post('/subscribe', bodyParser.text(), this.subscribe)

        this.app.use('/api/v1', v1)
    }
}

export const service: ExpressService[] = [
    app => new NotifierService(app)
]