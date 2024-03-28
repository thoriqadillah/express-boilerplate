import { Notifier, NotifierOption, SendOption } from ".";
import { env } from "../env";
import nodemailer from 'nodemailer'
import mustache from 'mustache'
import fs from 'fs'
import path from "path";

export class EmailNotifier implements Notifier {

    private option: NotifierOption
    private transport
    constructor(option?: NotifierOption) {
        this.option = {
            authMethod: env.get("NOTIFIER_AUTH_METHOD").toString(),
            host: env.get('NOTIFIER_HOST').toString(),
            sender: env.get('NOTIFIER_SENDER').toString(),
            username: env.get('NOTIFIER_USERNAME').toString(),
            password: env.get('NOTIFIER_PASSWORD').toString(),
            port: env.get('NOTIFIER_PORT').toNumber(),
            tls: env.get('NOTIFIER_TLS').toBoolean(),
            templateDir: env.get('NOTIFIER_TEMPLATE_DIR').toString(),
            ...option
        }

        this.transport = nodemailer.createTransport({
            service: this.option.service,
            host: this.option.host,
            port: this.option.port,
            secure: this.option.tls,
            authMethod: this.option.authMethod,
            auth: {
                user: this.option.username,
                pass: this.option.password,
            }
        })
    }

    async send(recepients: string[], option?: SendOption): Promise<void> {
        let template = ''
        if (option?.template) {
            template = fs.readFileSync(path.join(this.option.templateDir!, `${option.template}`), 'utf8');
        }

        await this.transport.sendMail({
            from: option?.from || this.option.sender,
            to: recepients,
            bcc: option?.bcc,
            cc: option?.cc,
            subject: option?.subject,
            text: option?.message,
            html: option?.template ? mustache.render(template, option.payload) : undefined
        })
    }
}