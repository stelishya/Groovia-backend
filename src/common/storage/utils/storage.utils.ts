import { IStorageService } from "../interfaces/storage.interface";

export class StorageUtils {
    /**
     * processing a file path or URL to get a signed URL
     * @param storageService The storage service instance
     * @param pathOrUrl The S3 key or full URL
     * @returns The signed URL
     */
    static async getSignedUrl(storageService: IStorageService, pathOrUrl: string): Promise<string> {
        if (!pathOrUrl) return pathOrUrl;

        try {
            if (pathOrUrl.startsWith('http')) {
                const url = new URL(pathOrUrl);
                // Remove leading slash if present, though substring(1) usually does it for pathname /key
                const key = url.pathname.substring(1);
                return await storageService.getSignedUrl(key);
            } else {
                return await storageService.getSignedUrl(pathOrUrl);
            }
        } catch (error) {
            console.error(`Error signing URL for ${pathOrUrl}:`, error);
            return pathOrUrl; // Return original if failure, or empty string
        }
    }
}
