import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer'; // 👈 IMPORT THIS
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Controller('upload')
export class UploadController {
  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      // 👇 ADD THIS: Tells Multer to keep the file in memory as a buffer
      storage: memoryStorage(), 
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file is empty');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'tvc_school_uploads',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            return reject(error || new Error('Upload failed'));
          }
          
          resolve({ 
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format
          });
        }
      );
      
      // Send the in-memory buffer to Cloudinary
      uploadStream.end(file.buffer);
    });
  }
}