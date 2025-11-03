export class ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        [key: string]: any;
    };

    constructor(success: boolean, data?: T, error?: { message: string; [key: string]: any; }) {
        this.success = success;
        if (data) {
            this.data = data;
        }
        if (error) {
            this.error = error;
        }
    }

    static success<T>(data: T): ApiResponse<T> {
        return new ApiResponse(true, data);
    }

    static error(message: string, errorDetails?: { [key: string]: any; }): ApiResponse<any> {
        return new ApiResponse(false, undefined, { message, ...errorDetails });
    }
}
