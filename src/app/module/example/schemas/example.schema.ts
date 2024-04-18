import { Collection, MongoDatabase } from "@/db/mongoose";
import { PipelineStage, Schema } from "mongoose";
import { Template } from "./template.schema";

const db = MongoDatabase.instance()
export const Example = db.model('Example', new Schema(
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