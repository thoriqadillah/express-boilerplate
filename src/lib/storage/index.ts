import { Readable } from "stream"
import { S3Storage } from "./s3"

export interface UploadOption {
    /**
     * @field extension with .
     */
    ext?: string
    /**
     * @field if specified, then it will replace the file that has the name
     */
    replaceFile?: string
    mime?: string
}

export interface File {
    mime?: string
    disposition?: string
    name?: string
    data: Readable
}

export interface Storage {
    upload(data: Readable, option?: UploadOption): Promise<string>
    serve(pathlike: string): Promise<File | undefined>
    remove(pathlike: string): Promise<void>
}

export interface StorageOption {
    key?: string
    secret?: string,
    bucket?: string
}

export type StorageFactory = (option?: StorageOption) => Storage
const impls = {
    s3: (option?: StorageOption) => new S3Storage(option)
}

// for singleton
const instances: Record<string, Storage> = {}

export type StorageName = keyof typeof impls
export const storage = {
    create(name: StorageName, option?: StorageOption): Storage {
        if (instances[name]) return instances[name]

        if (!impls[name]) throw new Error(`Storage ${name} is not implemented`)
        const factory = impls[name]
        
        const storage = factory(option)
        instances[name] = storage

        return storage
    }
}