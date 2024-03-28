import { EventEmitter } from "events";
import { BrokerOption, Broker } from ".";

// singleton event
const event = new EventEmitter()

export class EventBroker implements Broker {

    constructor(private option?: BrokerOption) {}

    publish(topic: string, payload?: any): void {
        event.emit(topic, payload)
    }

    subscribe(topic: string, callback: (payload?: any) => void): void {
        event.on(topic, callback)
    }
}