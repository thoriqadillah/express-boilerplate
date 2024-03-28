import type { Express } from "express";
import { Service } from "@/app";
import { ExampleService } from "@/app/module/example/example.api";
import { AccountService } from "./account/account.api";
import { env } from "@/lib/env";
import { NotifierService } from "../services/notifier";
import { FileService } from "./file/file.api";

export type ExpressService = (app: Express) => Service
export const services: ExpressService[] = [
    app => new ExampleService(app),
    app => new AccountService(app),
    app => new FileService(app),
    app => new NotifierService(app)
]