import { BrokerOption, Broker, Payload } from ".";
import { SNS } from '@aws-sdk/client-sns'
import { env } from "../env";
import { EventBroker } from "./event";

export class SNSBroker implements Broker {

    private sns
    private option: BrokerOption

    constructor(option?: BrokerOption) {
        this.option = {
            accessKey: env.get('SNS_ACCESS_KEY').toString(),
            secretKey: env.get('SNS_SECRET_KEY').toString(),
            region: 'ap-southeast-1',
            awsArn: 'arn:aws:sns:ap-southeast-1:654654317316',
            ...option
        }

        this.sns = new SNS({ 
            region: this.option.region,
            credentials: {
                accessKeyId: this.option.accessKey!,
                secretAccessKey: this.option.secretKey!
            }
        })
    }

    async publish(topic: string, payload?: Payload): Promise<void> {
        await this.sns.publish({
            TopicArn: `${this.option.awsArn}:${topic}`,
            Message: JSON.stringify(payload),
        })
    }

    async subscribe(topic: string, callback: (payload?: any) => void): Promise<void> {
        // empty 
    }
}