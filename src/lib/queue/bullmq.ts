import { JobOption, MessageQueueCloser, MessageQueueInitter, MessageQueueOption, WorkFn } from ".";
import { Queue, Job, Worker } from 'bullmq'
import { env } from "../env";
import { MessageQueue } from "./mq";
import { Log } from "../logger";

export class BullMQ extends MessageQueue implements MessageQueueInitter, MessageQueueCloser {

  private queue: Queue
  private worker?: Worker

  constructor(name: string, option?: MessageQueueOption) {
    super(name, option)

    this.option = {
      concurrency: env.get('QUEUE_CONCURRENCY').toNumber(),
      redis: {
        host: env.get('REDIS_HOST').toString('127.0.0.1'),
        password: env.get('REDIS_PASSWORD').toString(),
        port: env.get('REDIS_PORT').toNumber(6379),
        username: env.get('REDIS_USERNAME').toString()
      },
      ...option
    }

    this.queue = new Queue(this.name, { 
      connection: { ...this.option.redis }
    })

    Log.info(`${name} queue opened...`)
  }

  async init(): Promise<void> {
    await this.worker!.startStalledCheckTimer()
  }

  async close(): Promise<void> {
    await this.queue.close()
    await this.worker!.close()

    Log.info(`${this.name} queue closed. Wait for another 30s to check for stalled jobs...`)
  }

  async push<T>(data: T, option?: JobOption): Promise<void> {
    await this.queue.add(this.name, data, {
      priority: option?.priority,
      removeOnComplete: true,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 500
      },
      repeat: !option?.repeat ? undefined : { ...option?.repeat }
    })
  }

  async work<T = any>(callback: WorkFn<T>): Promise<void> {
    this.worker = new Worker(this.name, async (job: Job<T, any, string>) => {
      callback(job.data)
    }, {
      connection: { ...this.option.redis },
      concurrency: this.option.concurrency,
    })
  }
}