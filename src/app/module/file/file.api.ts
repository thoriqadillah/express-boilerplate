import { Service } from "@/app";
import { env } from "@/lib/env";
import { StorageName, storage } from "@/lib/storage";
import express, { Express, Request, Response } from "express";
import { Readable } from 'stream'

export class FileService implements Service {

    private STORAGE_DRIVER = env.get('STORAGE_DRIVER').toString() as StorageName
    private storage = storage.create(this.STORAGE_DRIVER)

    constructor(private app: Express) {}

    serve = async (req: Request, res: Response) => {
        const { id } = req.params
        
        const file = await this.storage.serve(id)
        if (!file) return res.status(204).send()

        if (file.contentType) res.setHeader('Content-Type', file.contentType)
        if (file.disposition) res.setHeader('Content-Disposition', `${file.disposition}; filename="${file.name}"`)
        
        file.data.pipe(res)
        res.on('close', () => file.data.destroy())
    }

    createRoutes(): void {
        const v1 = express.Router()
        v1.get('/file/:id', this.serve)

        this.app.use('/api/v1', v1)
    }
}