import { Express } from "express";
import { App, AppOption } from "@/app";
import { Server } from 'socket.io'
import { Plugin, PluginCloser } from ".";


declare global {
    namespace Express {
        interface Application {
            rtc: Server
        }
    }
}

class RtcPlugin implements Plugin, PluginCloser {

    private io?: Server
    constructor(
        private instance: App<Express>, 
        private _?: AppOption<Express>
    ) {}

    install(): void {
        this.io = new Server(this.instance.server)
        this.instance.app.rtc = this.io
    }

    close(): void {
        this.io!.close()
    }
}

export default (app: App<Express>, option?: AppOption<Express>) => new RtcPlugin(app, option)