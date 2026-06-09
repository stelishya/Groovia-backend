import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { IStorageService } from '../interfaces/storage.interface';
import { ManagedUpload } from 'aws-sdk/clients/s3';

@Injectable()
export class CloudinaryService implements IStorageService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(filePath: string, fileName: string): Promise<any> {
    // Determine folder and public_id from fileName (e.g., 'workshops/123.jpg')
    const lastSlashIndex = fileName.lastIndexOf('/');
    let folder = '';
    let public_id = fileName;

    if (lastSlashIndex !== -1) {
      folder = fileName.substring(0, lastSlashIndex);
      public_id = fileName.substring(lastSlashIndex + 1);
    }

    // Remove file extension from public_id as Cloudinary adds it automatically based on format
    const lastDotIndex = public_id.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      public_id = public_id.substring(0, lastDotIndex);
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        public_id: public_id,
      });

      this.logger.log(`File uploaded successfully to Cloudinary at: ${result.secure_url}`);
      
      // Return in a format similar to S3 so the rest of the app doesn't break
      return {
        Location: result.secure_url,
        Key: result.public_id,
        Bucket: folder,
        ETag: result.etag,
      } as unknown as ManagedUpload.SendData;
    } catch (error:unknown) {
      if(error instanceof Error){
        this.logger.error(`Cloudinary Upload Error: ${error.message}`, error.stack);
      }else{
        this.logger.error(`Cloudinary Upload Error: ${String(error)}`);
      }
      throw error;
    }
  }

  async uploadBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<any> {
    const lastSlashIndex = fileName.lastIndexOf('/');
    let folder = '';
    let public_id = fileName;

    if (lastSlashIndex !== -1) {
      folder = fileName.substring(0, lastSlashIndex);
      public_id = fileName.substring(lastSlashIndex + 1);
    }

    const lastDotIndex = public_id.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      public_id = public_id.substring(0, lastDotIndex);
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: public_id,
          resource_type: 'auto', // Automatically determine if image, video, etc.
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary Buffer Upload Error: ${error.message}`);
            return reject(error);
          }
          if (!result) {
            const noResultError = new Error("No response received from Cloudinary");
            this.logger.error(noResultError.message);
            return reject(noResultError);
          }
          
          this.logger.log(`Buffer uploaded successfully to Cloudinary at: ${result.secure_url}`);
          
          // Map Cloudinary response to S3 ManagedUpload.SendData shape
          resolve({
            Location: result.secure_url,
            Key: result.public_id,
            Bucket: folder,
            ETag: result.etag,
          } as unknown as ManagedUpload.SendData);
        },
      );

      // Write the buffer to the stream
      uploadStream.end(buffer);
    });
  }

  async deleteFile(key: string): Promise<any> {
    try {
      // Cloudinary key is the public_id, which includes the folder path without extension
      // If the key has an extension, we should remove it for deletion
      const lastDotIndex = key.lastIndexOf('.');
      const public_id = lastDotIndex !== -1 ? key.substring(0, lastDotIndex) : key;

      const result = await cloudinary.uploader.destroy(public_id);
      this.logger.log(`File deleted successfully from Cloudinary: ${public_id}`);
      return result;
    } catch (error:unknown) {
      if(error instanceof Error){
        this.logger.error(`Cloudinary Delete Error: ${error.message}`, error.stack);
      }else{
        this.logger.error(`Cloudinary Delete Error: ${String(error)}`);
      }
      throw error;
    }
  }

  async getFile(key: string): Promise<any> {
    // Cloudinary usually delivers via URL, so getFile might just return the URL
    // For direct binary access, you'd have to fetch the URL, but returning the URL is often enough.
    const url = cloudinary.url(key);
    return { Body: url };
  }

  async getSignedUrl(key: string): Promise<string> {
    // Cloudinary URLs are public by default unless you configure strict delivery.
    // If you need signed URLs for private assets in Cloudinary, you use cloudinary.utils.sign_request.
    // Assuming public assets for now, we just return the URL.
    return cloudinary.url(key, { secure: true });
  }

  async listBuckets(): Promise<any> {
    // Cloudinary doesn't have buckets, but we can return root folders
    try {
      const result = await cloudinary.api.root_folders();
      return result;
    } catch (error:unknown) {
      if(error instanceof Error){
        this.logger.error(`Cloudinary List Folders Error: ${error.message}`, error.stack);
      }else{
        this.logger.error(`Cloudinary List Folders Error: ${String(error)}`);
      }
      throw error;
    }
  }
}