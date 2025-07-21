"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const uploadController_1 = require("../controllers/uploadController");
const uploadController_2 = __importDefault(require("../controllers/uploadController"));
const router = express_1.default.Router();
// Upload file (form upload)
router.post('/', auth_1.verifyApiKey, uploadController_1.upload.single('file'), uploadController_1.uploadFile);
// Upload file (base64 upload) - legacy support
router.post('/base64', auth_1.verifyApiKey, uploadController_2.default.upload);
// Get file
router.get('/:type/:filename', uploadController_1.getFile);
// List files by type
router.get('/:type', auth_1.verifyApiKey, uploadController_1.listFiles);
// Delete file
router.delete('/:type/:filename', auth_1.verifyApiKey, uploadController_1.deleteFile);
exports.default = router;
