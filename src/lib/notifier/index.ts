import { EmailNotifier } from "./email"
import { SESNotifier } from "./ses"

export interface SendEmail {
    recipient: string
    subject: string
    template: string
    [k: string]: any
}

export interface NotifierOption {
    authMethod?: string
    host?: string
    service?: string
    username?: string
    password?: string
    port?: number
    sender?: string 
    tls?: boolean
    templateDir?: string
    sesKey?: string
    sesSecretKey?: string
    region?: string
    // TODO: more option
}

export interface SendOption {
    from?: string
    template?: string
    subject?: string
    cc?: string[]
    bcc?: string[]
    message?: string
    payload?: any
    // TODO: more option
}

export interface Notifier {
    send(recepients: string[], option?: SendOption): Promise<void>
}

export type NotifierFactory = (option?: NotifierOption) => Notifier
const impls = {
    ses: (option?: NotifierOption) => new SESNotifier(option),
    email: (option?: NotifierOption) => new EmailNotifier(option),
}

export type NotifierName = keyof typeof impls
export const notifier = {
    create(name: NotifierName, option?: NotifierOption): Notifier {
        if (!impls[name]) throw new Error(`No implementation of notifier for ${name}`)
        return impls[name](option)
    }
}

export const availableNotifier = Object.keys(impls)