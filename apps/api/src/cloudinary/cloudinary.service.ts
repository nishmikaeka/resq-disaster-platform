import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
    });
  }

  async upload(file: Express.Multer.File): Promise<cloudinary.UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'resq/incidents',
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (
          error: cloudinary.CloudinaryError | undefined,
          result: cloudinary.UploadResult | undefined,
        ) => {
          if (error) {
            return reject(
              new Error(error.message || 'Cloudinary upload failed'),
            );
          }
          if (!result) {
            return reject(
              new Error('Upload failed: no result from Cloudinary'),
            );
          }
          resolve(result);
        },
      );

      uploadStream.write(file.buffer);
      uploadStream.end();
    });
  }
}
