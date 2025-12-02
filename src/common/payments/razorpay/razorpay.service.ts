import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
    private razorpayInstance: Razorpay;

    constructor(private configService: ConfigService) {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_SECRET_KEY');

        console.log('🔑 Razorpay Key ID:', keyId ? `${keyId.substring(0, 10)}...` : 'NOT FOUND');
        console.log('🔐 Razorpay Key Secret:', keySecret ? 'EXISTS' : 'NOT FOUND');

        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials are missing. Please check your .env file.');
        }

        this.razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }

    async createOrder(amount: number, currency: string = 'INR', receipt: string) {
        const options = {
            amount: amount * 100, // amount in smallest currency unit
            currency,
            receipt,
        };
        try {
            const order = await this.razorpayInstance.orders.create(options);
            console.log("order created in razorpay.service.ts", order)
            return order;
        } catch (error) {
            throw error;
        }
    }

    verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean {
        const keySecret = this.configService.get<string>('RAZORPAY_SECRET_KEY');
        if (!keySecret) {
            throw new Error('Razorpay key secret is not defined');
        }
        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');

        return generatedSignature === razorpaySignature;
    }
}
