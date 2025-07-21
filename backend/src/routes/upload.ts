import express from 'express';
import { verifyApiKey } from '../middleware/auth';
import { upload, uploadFile, getFile, deleteFile, listFiles } from '../controllers/uploadController';
import FileUploadController from '../controllers/uploadController';

const router = express.Router();

// Upload file (form upload)
router.post('/', verifyApiKey, upload.single('file'), uploadFile);

// Upload file (base64 upload) - legacy support
router.post('/base64', verifyApiKey, FileUploadController.upload);

// Get file
router.get('/:type/:filename', getFile);

// List files by type
router.get('/:type', verifyApiKey, listFiles);

// Delete file
router.delete('/:type/:filename', verifyApiKey, deleteFile);

export default router; 