import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import * as fs from 'fs';

@Injectable()
export class AwsS3Service {
  private s3: AWS.S3;
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    AWS.config.update({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });

    this.s3 = new AWS.S3();
    
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is not defined');
    }
    this.bucketName = bucketName;
  }

  /**
   * Upload a file from local filesystem to S3
   * @param filePath - Local file path
   * @param fileName - S3 key/filename (e.g., 'uploads/profile.jpg')
   * @param acl - Access control (default: 'public-read')
   * @returns Promise with upload result
   */
  async uploadFile(
    filePath: string,
    fileName: string,
    acl: string = 'public-read',
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      const fileContent = fs.readFileSync(filePath);
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileContent,
        ACL: acl,
      };

      const result = await this.s3.upload(params).promise();
      this.logger.log(`File uploaded successfully at: ${result.Location}`);
      return result;
    } catch (error) {
      this.logger.error(`Upload Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upload a file buffer to S3 (useful for multer uploads)
   * @param buffer - File buffer
   * @param fileName - S3 key/filename
   * @param mimetype - File mimetype
   * @param acl - Access control (default: 'public-read')
   * @returns Promise with upload result
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimetype: string,
    acl: string = 'public-read',
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: mimetype,
        ACL: acl,
      };

      const result = await this.s3.upload(params).promise();
      this.logger.log(`Buffer uploaded successfully at: ${result.Location}`);
      return result;
    } catch (error) {
      this.logger.error(`Upload Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param fileName - S3 key/filename to delete
   * @returns Promise with delete result
   */
  async deleteFile(fileName: string): Promise<AWS.S3.DeleteObjectOutput> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: fileName,
      };

      const result = await this.s3.deleteObject(params).promise();
      this.logger.log(`File deleted successfully: ${fileName}`);
      return result;
    } catch (error) {
      this.logger.error(`Delete Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a file from S3
   * @param fileName - S3 key/filename to retrieve
   * @returns Promise with file data
   */
  async getFile(fileName: string): Promise<AWS.S3.GetObjectOutput> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: fileName,
      };

      const result = await this.s3.getObject(params).promise();
      this.logger.log(`File retrieved successfully: ${fileName}`);
      return result;
    } catch (error) {
      this.logger.error(`Get File Error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   * @param fileName - S3 key/filename
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns Signed URL
   */
  getSignedUrl(fileName: string, expiresIn: number = 3600): string {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  /**
   * List all buckets (for testing)
   * @returns Promise with bucket list
   */
  async listBuckets(): Promise<AWS.S3.ListBucketsOutput> {
    try {
      const result = await this.s3.listBuckets().promise();
      this.logger.log('Buckets retrieved successfully');
      return result;
    } catch (error) {
      this.logger.error(`List Buckets Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}