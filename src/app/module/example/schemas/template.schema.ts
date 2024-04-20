import { MongoDatabase } from "@/db/connection/mongoose";
import { Schema } from "mongoose";

const db = MongoDatabase.instance()
export const Template = db.model('Template', new Schema({
    foo: String
}))