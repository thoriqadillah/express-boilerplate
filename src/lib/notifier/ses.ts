import { Notifier, NotifierOption, SendOption } from ".";
import { env } from "../env";
import { Content, SES } from '@aws-sdk/client-ses'
import mustache from 'mustache'
import fs from 'fs'
import path from "path";

export class SESNotifier implements Notifier {

    private option: NotifierOption
    private ses

    constructor(option?: NotifierOption) {
        this.option = {
            sender: env.get('NOTIFIER_SENDER').toString(),
            templateDir: env.get('NOTIFIER_TEMPLATE_DIR').toString(),
            sesKey: env.get('SMTP_AWS_ACCESS_KEY_ID').toString(),
            sesSecretKey: env.get('SMTP_AWS_SECRET_ACCESS_KEY').toString(),
            region: 'ap-southeast-1',
            ...option
        }

        // @ts-ignore
        this.ses = new SES({
            region: this.option.region,
            credentials: {
                accessKeyId: this.option.sesKey,
                secretAccessKey: this.option.sesSecretKey
            }
        })    
    }

    async send(recepients: string[], option?: SendOption): Promise<void> {
        let template = ''
        if (option?.template) {
            template = fs.readFileSync(path.join(this.option.templateDir!, `${option.template}`), 'utf8');
        }

        let html: Content | undefined = undefined
        if (option?.template) html = {
            Data: mustache.render(template, option.payload)
        }

        let subject: Content | undefined = undefined
        if (option?.subject) subject = {
            Data: option.subject
        }

        let message: Content | undefined = undefined
        if (option?.message) message = {
            Data: option.message
        }

        await this.ses.sendEmail({
            Destination: {
                ToAddresses: recepients,
                CcAddresses: option?.cc,
                BccAddresses: option?.bcc,  
            },
            Source: this.option.sender,
            Message: {
                Subject: subject,
                Body: {
                    Html: html,
                    Text: message,
                }
            }
        })
    }
}