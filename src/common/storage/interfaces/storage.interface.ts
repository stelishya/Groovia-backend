import { ManagedUpload } from 'aws-sdk/clients/s3';

export const IStorageServiceToken = Symbol('IStorageService');

export interface IStorageService {
    uploadFile(filePath: string, fileName: string): Promise<ManagedUpload.SendData>;
    uploadBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<ManagedUpload.SendData>;
    deleteFile(key: string): Promise<any>;
    getFile(key: string): Promise<any>;
    getSignedUrl(key: string): Promise<string>;
    listBuckets(): Promise<any>;
}