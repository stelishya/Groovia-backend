import { IStorageService } from '../interfaces/storage.interface';

export class StorageUtils {
  /**
   * processing a file path or URL to get a signed URL
   * @param storageService The storage service instance
   * @param pathOrUrl The S3 key or full URL
   * @returns The signed URL
   */
  static async getSignedUrl(
    storageService: IStorageService,
    pathOrUrl: string,
  ): Promise<string> {
    if (!pathOrUrl) return pathOrUrl;

    // processing a file path or URL to get a signed URL
    if (pathOrUrl.startsWith('data:')) {
      return pathOrUrl;
    }

    try {
      if (pathOrUrl.startsWith('http')) {
        const url = new URL(pathOrUrl);
        // Remove leading slash and decode to get the literal S3 key
        const key = decodeURIComponent(url.pathname.substring(1));
        console.log(`[StorageUtils] Signing URL: ${pathOrUrl} -> Key: ${key}`);
        return await storageService.getSignedUrl(key);
      } else {
        console.log(`[StorageUtils] Signing Key: ${pathOrUrl}`);
        return await storageService.getSignedUrl(pathOrUrl);
      }
    } catch (error) {
      console.error(`Error signing URL for ${pathOrUrl}:`, error);
      return pathOrUrl; // Return original if failure, or empty string
    }
  }
}
