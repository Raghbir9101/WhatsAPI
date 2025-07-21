import { Request, Response } from "express";
import dotenv from "dotenv";
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import multer, { Multer } from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include multer file
type MulterRequest = Request & {
  file?: Multer.File;
  user: {
    id: string;
    _id: string;
    [key: string]: any;
  };
}

dotenv.config();

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (since we'll upload to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const { type } = req.body;
  
  if (type === 'image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for image uploads'), false);
    }
  } else if (type === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video uploads'), false);
    }
  } else if (type === 'document') {
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
    } else {
      cb(new Error('File type not supported for document uploads'), false);
    }
  } else {
    cb(null, true); // Allow all files if type not specified
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Upload file to Cloudinary from base64
export default class FileUploadController {

    static async uploadFile(base64File: string, fileName = `File_${Date.now()}`): Promise<string> {

        if (base64File.includes("https://res.cloudinary.com")) {
            return base64File;
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
                        folder: "WhatsAPI"
                    },
                    (error, result) => {
                        if (error) {
                            reject({ error: error.message });
                            return;
                        }
                        resolve(result as UploadApiResponse);
                    }
                );
                uploadStream.end(buffer);
            });

            return result.secure_url;

        } catch (error) {
            throw { error: (error as Error).message };
        }
    }

    static upload = async (req: Request, res: Response): Promise<void> => {
        try {
            const { base64File } = req.body;
            const response = await this.uploadFile(base64File);
            res.status(200).json({ url: response, success: true });
        } catch (error) {
            console.error("Error uploading file:", error);
            res.status(500).json({ error: 'File upload failed' });
        }
    }
}

// Upload file endpoint (for form uploads)
export const uploadFile = async (req: MulterRequest, res: Response) => {
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
    const fileName = `${type}_${uuidv4()}_${req.file.originalname.split('.')[0]}`;

    // Upload to Cloudinary
    const cloudinaryUrl = await FileUploadController.uploadFile(base64File, fileName);

    const fileInfo = {
      id: uuidv4(),
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

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

// Get file (redirect to Cloudinary URL)
export const getFile = async (req: Request, res: Response) => {
  try {
    const { type, filename } = req.params;
    
    // For Cloudinary, we would need to store file mappings in database
    // For now, return an error suggesting direct URL usage
    res.status(400).json({ 
      error: 'Direct file access not supported. Use the file URL returned from upload.' 
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
};

// Delete file from Cloudinary
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { type, filename } = req.params;
    
    // Extract public_id from filename for Cloudinary deletion
    const publicId = `WhatsAPI/${filename}`;
    
    await cloudinary.uploader.destroy(publicId);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

// List files (would require database storage of file metadata)
export const listFiles = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    // For Cloudinary, we would need to use their admin API or store metadata in database
    // For now, return empty array
    res.json({ files: [] });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
};