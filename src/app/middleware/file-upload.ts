import { MB, filetype } from "@/lib/filetype";
import multer from "multer";
import mime from 'mime-db'

export const imageupload = multer({
    dest: './src/lib/storage/uploads',
    fileFilter: (req, file, callback) => {
        const exts = mime[file.mimetype].extensions
        if (exts) {
            const type = filetype(exts[0])
            if (type === 'image') callback(null, true)
        }

        callback(new Error('Image is not valid'))
    },
    limits: {
        fileSize: MB
    },
})

export const fileupload = multer({
    dest: './lib/storage/uploads',
    limits: {
        fileSize: 50 * MB
    },
})