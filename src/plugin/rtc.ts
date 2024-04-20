import { Express } from "express";
import { App, AppOption } from "@/app";
import { Server } from 'socket.io'
import { Plugin } from ".";
import { Closable } from "@/lib/graceful";


declare global {
    namespace Express {
        interface Application {
            rtc: Server
        }
    }
}

export class RTC implements Plugin<Express>, Closable {

    private io?: Server

    install(instance: App<Express>, _?: AppOption<Express>): void {
        this.io = new Server(instance.server)
        instance.app.rtc = this.io
    }

    close(): void {
        this.io!.close()
    }
}