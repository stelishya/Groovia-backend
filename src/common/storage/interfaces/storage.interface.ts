import { ManagedUpload } from 'aws-sdk/clients/s3';
import { S3 } from 'aws-sdk';

export const IStorageServiceToken = Symbol('IStorageService');

export interface IStorageService {
  uploadFile(
    filePath: string,
    fileName: string,
  ): Promise<ManagedUpload.SendData>;
  uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<ManagedUpload.SendData>;
  deleteFile(key: string): Promise<S3.DeleteObjectOutput>;
  getFile(key: string): Promise<S3.GetObjectOutput>;
  getSignedUrl(key: string): Promise<string>;
  listBuckets(): Promise<S3.ListBucketsOutput>;
}
