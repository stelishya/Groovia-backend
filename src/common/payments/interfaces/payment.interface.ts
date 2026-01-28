import { RazorpayOrder } from '../dto/payment.dto';

export const IPaymentServiceToken = Symbol('IPaymentService');

export interface IPaymentService {
  createOrder(
    amount: number,
    currency: string,
    receipt: string,
  ): Promise<RazorpayOrder>;
  verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<boolean>;
}
