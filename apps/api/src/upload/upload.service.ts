import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  
  // This method receives the file from the controller and formats the response
  processFile(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Construct the URL the frontend will use to view the file
    // Example: http://localhost:3001/uploads/16987654321-avatar.jpg
    const fileUrl = `http://localhost:3001/uploads/${file.filename}`;

    return {
      originalName: file.originalname,
      filename: file.filename,
      url: fileUrl,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}