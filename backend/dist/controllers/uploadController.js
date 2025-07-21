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
exports.listFiles = exports.deleteFile = exports.getFile = exports.uploadFile = exports.upload = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
dotenv_1.default.config();
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
cloudinary_1.v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});
// Configure multer for memory storage (since we'll upload to Cloudinary)
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const { type } = req.body;
    if (type === 'image') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed for image uploads'), false);
        }
    }
    else if (type === 'video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only video files are allowed for video uploads'), false);
        }
    }
    else if (type === 'document') {
        // Allow common document types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('File type not supported for document uploads'), false);
        }
    }
    else {
        cb(null, true); // Allow all files if type not specified
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});
// Upload file to Cloudinary from base64
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
                        folder: "WhatsAPI"
                    }, (error, result) => {
                        if (error) {
                            reject({ error: error.message });
                            return;
                        }
                        resolve(result);
                    });
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
        res.status(200).json({ url: response, success: true });
    }
    catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: 'File upload failed' });
    }
});
exports.default = FileUploadController;
// Upload file endpoint (for form uploads)
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { type = 'document' } = req.body;
        const userId = req.user.id;
        // Convert buffer to base64 for Cloudinary upload
        const base64String = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const base64File = `data:${mimeType};base64,${base64String}`;
        // Generate unique filename
        const fileName = `${type}_${(0, uuid_1.v4)()}_${req.file.originalname.split('.')[0]}`;
        // Upload to Cloudinary
        const cloudinaryUrl = yield FileUploadController.uploadFile(base64File, fileName);
        const fileInfo = {
            id: (0, uuid_1.v4)(),
            originalName: req.file.originalname,
            filename: fileName,
            mimetype: req.file.mimetype,
            size: req.file.size,
            type,
            url: cloudinaryUrl,
            uploadedBy: userId,
            uploadedAt: new Date()
        };
        res.json({
            success: true,
            file: {
                id: fileInfo.id,
                name: fileInfo.originalName,
                type: fileInfo.type,
                size: fileInfo.size,
                url: fileInfo.url,
                mimetype: fileInfo.mimetype
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});
exports.uploadFile = uploadFile;
// Get file (redirect to Cloudinary URL)
const getFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, filename } = req.params;
        // For Cloudinary, we would need to store file mappings in database
        // For now, return an error suggesting direct URL usage
        res.status(400).json({
            error: 'Direct file access not supported. Use the file URL returned from upload.'
        });
    }
    catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
});
exports.getFile = getFile;
// Delete file from Cloudinary
const deleteFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, filename } = req.params;
        // Extract public_id from filename for Cloudinary deletion
        const publicId = `WhatsAPI/${filename}`;
        yield cloudinary_1.v2.uploader.destroy(publicId);
        res.json({ success: true, message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});
exports.deleteFile = deleteFile;
// List files (would require database storage of file metadata)
const listFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        // For Cloudinary, we would need to use their admin API or store metadata in database
        // For now, return empty array
        res.json({ files: [] });
    }
    catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});
exports.listFiles = listFiles;
