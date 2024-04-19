import express from "express";
import dotenv from "dotenv";
import { Application } from "@/app";
import { parseFlags } from "./lib/parser";
import { env } from "./lib/env";
import { RTC } from "./plugin/rtc";
import { KyselyDatabase, Redis } from "./db";

const flags = parseFlags(process.argv)
dotenv.config({ path: flags.env });

const app = express();
const vw = new Application(app, { 
    port: flags.port ? Number(flags.port) : env.get('PORT').toNumber(3000),
    stores: [
        new KyselyDatabase(),
        new Redis()
    ]
})

vw.use(new RTC())

vw.start()
vw.shutdown()