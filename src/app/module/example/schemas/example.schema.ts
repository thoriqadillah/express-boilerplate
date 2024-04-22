import { Collection, Document, MongoDatabase } from "@/db/connection/mongoose";
import { PipelineStage, Schema } from "mongoose";
import { Template } from "./template.schema";

const db = MongoDatabase.instance()
export const ExampleModel = db.model('Example', new Schema(
    {
        foo: String
    }, 
    {
        statics: {
            template: (): PipelineStage[] => {
                return Collection.hasMany(Template)
            }
        }
    }
))

export type Example = Document<typeof ExampleModel.schema.obj>