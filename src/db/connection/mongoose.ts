import { env } from "@/lib/env";
import { Connection, ConnectionOption } from ".";
import mongoose, { Model } from "mongoose";
import { Log } from "@/lib/logger";
import { PipelineStage } from "mongoose";
import { Document as MongooseDocument, Types } from "mongoose";

export class MongoDatabase implements Connection {

    private static db: Record<string, typeof mongoose> = {}
    private option: ConnectionOption
    
    constructor(private key: string = 'default', option?: ConnectionOption) {
        this.option = {
            database: env.get('DB_NAME').toString('postgres'),
            host: env.get('DB_HOST').toString('localhost'),
            user: env.get('DB_USERNAME').toString('postgres'),
            password: env.get('DB_PASSWORD').toString(''),
            port: env.get('DB_PORT').toNumber(5432),
            ...option
        }
    }

    static instance(key: string = 'default'): typeof mongoose {
        return MongoDatabase.db[key]
    }

    async open(): Promise<void> {
        if (MongoDatabase.db[this.key]) return

        const mongo = await mongoose.connect(`mongodb://${this.option.user!}:${this.option.password!}@${this.option.host!}:${this.option.port!}/${this.option.database}`)
        MongoDatabase.db[this.key] = mongo
        Log.info(`Mongo database ${this.key} opened...`)
    }

    async close(): Promise<void> {
        if (!MongoDatabase.db[this.key]) return

        await MongoDatabase.db[this.key].disconnect()
        Log.info(`Mongo database ${this.key} closed...`)
    }
}

/**
 * Create a type for mongodb document based on model
 */
export type Document<M> = (MongooseDocument<unknown, {}, M> & M & { _id: Types.ObjectId })


export interface RelationOption {
    local?: string
    foreign?: string
    selects?: string[]
}

type Pipeline = Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>

export class Collection {

    private static createProjection(selects?: string[]): Record<string, number> {
        const projection: Record<string, number> = {}
        if (!selects) return projection

        for (const select of selects) {
            projection[select] = 1
        }

        return projection
    }

    static hasMany(model: typeof Model, option?: RelationOption): Pipeline[] {
        return [
            { 
                $lookup: {
                    from: model.collection.name,
                    foreignField: option?.foreign ?? '_id',
                    localField: option?.local ?? model.modelName.toLowerCase() + 'Id',
                    as: model.collection.name,
                    pipeline: [
                        { $project: Collection.createProjection(option?.selects) }
                    ]
                }
            }
        ]
    }

    static hasManyWith(model: typeof Model, pipeline: () => Pipeline[], option?: RelationOption): Pipeline[] {
        return [
            { 
                $lookup: {
                    from: model.collection.name,
                    foreignField: option?.foreign ?? '_id',
                    localField: option?.local ?? model.modelName.toLowerCase() + 'Id',
                    as: model.collection.name,
                    pipeline: [
                        { $project: Collection.createProjection(option?.selects) },
                        ...pipeline(),
                    ]
                }
            }
        ]
    }

    static hasOne(model: typeof Model, option?: RelationOption): Pipeline[] {
        return [
            {
                $lookup: {
                    from: model.collection.name,
                    foreignField: option?.foreign ?? '_id',
                    localField: option?.local ?? model.modelName.toLowerCase() + 'Id',
                    as: model.modelName.toLowerCase(),
                    pipeline: [
                        { $project: Collection.createProjection(option?.selects) }
                    ]
                }
            },
            { $unwind: { path: `$${model.modelName.toLowerCase()}`, preserveNullAndEmptyArrays: true } }
        ]
    }

    static hasOneWith(model: typeof Model, pipeline: () => Pipeline[], option?: RelationOption): Pipeline[] {
        return [
            {
                $lookup: {
                    from: model.collection.name,
                    foreignField: option?.foreign ?? '_id',
                    localField: option?.local ?? model.modelName.toLowerCase() + 'Id',
                    as: model.modelName.toLowerCase(),
                    pipeline: [
                        { $project: Collection.createProjection(option?.selects) },
                        ...pipeline()
                    ]
                }
            },
            { $unwind: { path: `$${model.modelName.toLowerCase()}`, preserveNullAndEmptyArrays: true } }
        ]
    }
}