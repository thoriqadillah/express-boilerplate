import { v4 } from "uuid";
import { File, Storage, StorageOption, UploadOption } from ".";
import { env } from "../env";
import { S3 } from '@aws-sdk/client-s3'
import path from "path";
import { Readable } from "stream";

export class S3Storage implements Storage {

    private s3
    private region = 'ap-southeast-1'
    private BASE_URL = env.get('BASE_URL').toString()
    option: StorageOption
    
    constructor(option?: StorageOption) {
        this.option = {
            key: env.get('S3_KEY_ID').toString(),
            secret: env.get('S3_SECRET_KEY').toString(),
            bucket: env.get('S3_BUCKET').toString('visu-caas-staging'),
            ...option
        }

        // @ts-ignore
        this.s3 = new S3({
            region: this.region,
            credentials: {
                accessKeyId: this.option.key,
                secretAccessKey: this.option.secret,
            }
        })
    }

    async upload(data: Readable, option?: UploadOption): Promise<string> {
        let name = ''
        name = option?.replaceFile || `${v4()}${option?.ext}`
        name = encodeURIComponent(name)

        await this.s3.putObject({
            Body: data,
            Bucket: this.option.bucket,
            Key: name,
            ContentDisposition: "inline",
            ContentType: option?.mime,
        })

        return `${this.BASE_URL}/api/v1/file/${name}`
    }

    async serve(pathlike: string): Promise<File | undefined> {
        try {
            const file = await this.s3.getObject({
                Bucket: this.option.bucket,
                Key: pathlike,
            })
    
            if (file.Body) {
                const buffer = await file.Body.transformToByteArray()
                const reader = new Readable()
                reader._read = () => {
                    reader.push(buffer)
                    reader.push(null)
                }

                return {
                    data: reader,
                    mime: file.ContentType,
                    disposition: file.ContentDisposition,
                    name: path.basename(pathlike)
                }
            }
            
        } catch (error) {
            return Promise.reject(`${error}`)
        }
    }

    async remove(pathlike: string): Promise<void> {
        await this.s3.deleteObject({
            Bucket: this.option.bucket,
            Key: pathlike
        })
    }

}