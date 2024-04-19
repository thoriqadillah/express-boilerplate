import { App, AppOption } from "@/app";

export interface PluginCloser {
    close(): void
}

export type Pluggable<T> = (app: App<T>, option?: AppOption<T>) => Plugin

export interface Plugin {
    install(): void
}