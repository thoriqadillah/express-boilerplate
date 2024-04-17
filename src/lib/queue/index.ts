import { BullMQ } from "./bullmq";
import { MessageQueue } from "./mq";

export type WorkFn<T = any> = (payload: T) => void

export interface JobOption {
  priority?: number
  repeat?: {
    /**
     * A repeat pattern
     */
    pattern?: string;
    /**
     * Number of times the job should repeat at max.
     */
    limit?: number

    /**
     * Repeat after this amount of milliseconds
     * (`pattern` setting cannot be used together with this setting.)
     */
    every?: number
  }
  
}

export interface MessageQueueInitter {
    init(): Promise<void>
}

export interface MessageQueueCloser {
    close(): Promise<void>
}

export interface MessageQueueOption {
  concurrency?: number
  redis?: {
    host: string
    username: string
    password: string
    port: number
  }
}

export type QueueFactory = (name: string, option?: MessageQueueOption) => MessageQueue

const impls = {
  bull: (name: string, option?: MessageQueueOption) => new BullMQ(name, option)
}

const instances: Record<string, MessageQueue> = {}

export type MessageQueueName = keyof typeof impls
export const queue = {
  create(factory: MessageQueueName, topic: string, option?: MessageQueueOption): MessageQueue {
    if (!instances[topic]) {
      instances[topic] = impls[factory](topic, option)
    }

    return instances[topic]
  }
}
