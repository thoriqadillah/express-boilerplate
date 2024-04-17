import { JobOption, MessageQueueCloser, MessageQueueInitter, MessageQueueOption, WorkFn } from "."

export abstract class MessageQueue {

    protected option: MessageQueueOption
    constructor(protected name: string, option?: MessageQueueOption) {
        this.option = {
            ...option
        }
    }

    initable(): this is MessageQueueInitter {
        return 'init' in this
    }

    closable(): this is MessageQueueCloser {
        return 'close' in this
    }

    abstract push<T = any>(data: T, option?: JobOption): void;
    abstract work<T = any>(callback: WorkFn<T>): void;
}