"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
dotenv_1.default.config();
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
cloudinary_1.v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});
class FileUploadController {
    static uploadFile(base64File_1) {
        return __awaiter(this, arguments, void 0, function* (base64File, fileName = `File_${Date.now()}`) {
            if (base64File.includes("https://res.cloudinary.com")) {
                return base64File;
            }
            const base64String = base64File.split(",")[1];
            const extension = base64File.split(',')[0].split('/')[1].split(';')[0];
            try {
                const buffer = Buffer.from(base64String, "base64");
                const result = yield new Promise((resolve, reject) => {
                    const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                        public_id: `${fileName}.${extension}`,
                        resource_type: "auto",
                        folder: "IMS"
                    }, (error, result) => {
                        if (error) {
                            reject({ error: error.message });
                            return;
                        }
                        resolve(result);
                    });
                    // i want the file link to be returned
                    uploadStream.end(buffer);
                });
                return result.secure_url;
            }
            catch (error) {
                throw { error: error.message };
            }
        });
    }
}
_a = FileUploadController;
FileUploadController.upload = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { base64File } = req.body;
        const response = yield _a.uploadFile(base64File);
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Error uploading image:", error);
    }
});
exports.default = FileUploadController;
