import { Request, Response } from "express";
import dotenv from "dotenv";
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

dotenv.config();

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

export default class FileUploadController {

    static async uploadFile(base64File, fileName = `File_${Date.now()}`): Promise<any> {

        if (base64File.includes("https://res.cloudinary.com")) {
            return base64File
        }

        const base64String = base64File.split(",")[1];
        const extension = base64File.split(',')[0].split('/')[1].split(';')[0];

        try {

            const buffer = Buffer.from(base64String, "base64");
            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: `${fileName}.${extension}`,
                        resource_type: "auto",
                        folder: "IMS"
                    },
                    (error, result) => {
                        if (error) {
                            reject({ error: error.message });
                            return
                        }
                        resolve(result);
                    }
                );
                // i want the file link to be returned
                uploadStream.end(buffer);
            });

            return result.secure_url
        } catch (error) {
            throw { error: (error as Error).message };
        }
    }

    static upload = async (req: Request, res: Response): Promise<void> => {
        try {
            const { base64File } = req.body;
            const response = await this.uploadFile(base64File);
            res.status(200).json(response);
        } catch (error) {
            console.error("Error uploading image:", error);
        }
    }

}