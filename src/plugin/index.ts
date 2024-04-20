import { App, AppOption } from "@/app";

export interface Plugin<T> {
    install(app: App<T>, option?: AppOption<T>): void
}