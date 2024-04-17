import { Service, ServiceCloser, ServiceInitter } from "@/app";
import express, { Express, Request, Response } from "express";
import { Payload, broker } from "@/lib/broker";
import { NotifierName, notifier, SendEmail } from "@/lib/notifier";
import { ExpressService } from "@/app/module";
import bodyParser from "body-parser";
import axios from "axios";
import { env } from "@/lib/env";
import { Log } from "@/lib/logger";
import { MessageQueueName, queue } from "@/lib/queue";

export class NotifierService implements Service, ServiceInitter, ServiceCloser {

    private NOTIFIER_DRIVER = env.get('NOTIFIER_DRIVER').toUnion<NotifierName>('ses')
    private QUEUE_DRIVER = env.get('QUEUE_DRIVER').toUnion<MessageQueueName>('bull')

    private event = broker.create('event')
    private mailer = notifier.create(this.NOTIFIER_DRIVER)
    private queue = queue.create(this.QUEUE_DRIVER, 'Notification')
    
    constructor(private app: Express) {}

    async init(): Promise<void> {
        // for testing (dev only)
        this.event.subscribe('notification', this.enqueue)

        this.queue.work(this.notify)
        if (this.queue.initable()) this.queue.init()
    }

    enqueue = (payload?: Payload) => {
        this.queue.push<Payload<SendEmail>>(payload!, { 
            priority: payload?.priority,
        })
    }

    close(): void {
        if (this.queue.closable()) this.queue.close()
    }

    // for testing (dev only)
    notify = async (payload?: Payload) => {
        const { notifiers, data } = payload!
        if (notifiers) for (const notifier of notifiers) {
            if (notifier === 'email' && data) await this.sendEmail(data).catch(err => { throw new Error(`${err}`) })
        }
    }

    sendEmail = async (data: SendEmail) => {
        try {
            const { recipient, subject, template, ...payload } = data
            await this.mailer.send([recipient], { subject, template, payload })
        } catch (error) {
            Log.error(`${error}`)
            throw error
        }
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