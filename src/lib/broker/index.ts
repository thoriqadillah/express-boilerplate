import { NotifierName } from "../notifier"
import { EventBroker } from "./event"
import { SNSBroker } from "./sns"

export interface BrokerOption {
    id?: string 
    subscription?: string
    accessKey?: string
    secretKey?: string
    region?: string
    awsArn?: string
}

export enum Priority {
    VERY_HIGH,
    HIGH,
    MEDIUM,
    LOW
}

export interface Payload<T = any> {
    priority?: Priority
    notifiers?: NotifierName[]
    event?: string
    data?: T
}

export interface Broker {
    publish<T = any>(topic: string, payload?: Payload<T>): void
    subscribe<T = any>(topic: string, callback: (payload?: Payload<T>) => void): void
}

export type BrokerFactory = (option?: BrokerOption) => Broker
const impls = {
    event: (option?: BrokerOption) => new EventBroker(option),
    // pubsub: (option?: BrokerOption) => new PubsubBroker(option),
    sns: (option?: BrokerOption) => new SNSBroker(option)
}

export type BrokerName = keyof typeof impls
export const broker = {
    create(name: BrokerName, option?: BrokerOption): Broker {
        if (!impls[name]) throw new Error(`Broker ${name} is not implemented`)
        const factory = impls[name]

        return factory(option)
    }
}