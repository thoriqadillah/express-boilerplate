import { Collection, MongoDatabase } from "@/db/mongoose";
import { PipelineStage, Schema } from "mongoose";
import { Template } from "./template.schema";

const db = MongoDatabase.instance()
const Model = db.model('Example', new Schema({
    foo: String
}))

export class Example extends Model {
    static template(selects?: string[]): PipelineStage[] {
        return Collection.hasMany(Template, { selects })
    }
}

