"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvUpload = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Configure multer for file uploads
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (_req, file, cb) => {
            cb(null, file.originalname);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (_req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mp3|wav|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    }
});
// Configure multer for CSV uploads
exports.csvUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (_req, file, cb) => {
            cb(null, `csv_${Date.now()}_${file.originalname}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for CSV
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || path_1.default.extname(file.originalname).toLowerCase() === '.csv') {
            return cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});
