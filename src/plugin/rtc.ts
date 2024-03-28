import { App, AppOption, Plugin } from "@/app";
import { Server } from 'socket.io'


declare global {
    namespace Express {
        interface Application {
            rtc: Server
        }
    }
}

export class RTC implements Plugin {
    install(instance: App, _: AppOption): void {
        const io = new Server(instance.server)
        instance.app.rtc = io
    }
}