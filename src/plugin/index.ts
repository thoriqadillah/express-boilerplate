import { App, AppOption } from "@/app";

export type Pluggable<T> = (app: App<T>, option?: AppOption<T>) => Plugin

export interface Plugin {
    install(): void
}