export const IMailServiceToken = Symbol('IMailService');

export interface IMailService {
    sendOtpEmail(to: string, data: { otp: string }): Promise<void>;
    sendPasswordResetEmail(to: string, data: { username: string, resetUrl: string }): Promise<void>;
}