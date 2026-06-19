import { IStorageService } from "../interfaces/storage.interface";
import * as AWS from 'aws-sdk';

export class StorageUtils {
    /**
     * processing a file path or URL to get a signed URL
     * @param storageService The storage service instance
     * @param pathOrUrl The S3 key or full URL
     * @returns The signed URL
     */
    static async getSignedUrl(storageService: IStorageService, pathOrUrl: string): Promise<string> {
        if (!pathOrUrl) return pathOrUrl;

        // processing a file path or URL to get a signed URL
        if (pathOrUrl.startsWith('data:')) {
            return pathOrUrl;
        }

        try {
            if (pathOrUrl.startsWith('http')) {
                // If it's already a Cloudinary URL, just return it as it's already public
                if (pathOrUrl.includes('res.cloudinary.com')) {
                    return pathOrUrl;
                }
                
                // If it's a private S3 URL, generate a fresh AWS signature
                if (pathOrUrl.includes('amazonaws.com')) {
                    const url = new URL(pathOrUrl);
                    // Remove leading slash and decode to get the literal S3 key
                    const key = decodeURIComponent(url.pathname.substring(1));
                    
                    const s3 = new AWS.S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });
                    
                    const bucketName = process.env.AWS_S3_BUCKET_NAME;
                    
                    if (bucketName) {
                        return await s3.getSignedUrlPromise('getObject', {
                            Bucket: bucketName,
                            Key: key,
                            Expires: 3600
                        });
                    }
                }
                
                // For any other HTTP URL, return it unchanged
                return pathOrUrl; 
            } else {
                // It's a raw key
                console.log(`[StorageUtils] Signing Key: ${pathOrUrl}`);
                return await storageService.getSignedUrl(pathOrUrl);
            }
        } catch (error) {
            console.error(`Error signing URL for ${pathOrUrl}:`, error);
            return pathOrUrl; // Return original if failure, or empty string
        }
    }
}
