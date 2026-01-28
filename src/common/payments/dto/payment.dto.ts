export interface RazorpayOrder {
  amount: number;
  amount_due: number;
  amount_paid: number;
  attempts: number;
  created_at: number;
  currency: string | undefined;
  entity: string;
  id: string;
  notes: unknown[];
  offer_id: unknown;
  receipt: string;
  status: string;
}
// order in workshop service {
//   amount: 80000,
//   amount_due: 80000,
//   amount_paid: 0,
//   attempts: 0,
//   created_at: 1769156777,
//   currency: 'INR',
//   entity: 'order',
//   id: 'order_S7FmOWKdLzUMQT',
//   notes: [],
//   offer_id: null,
//   receipt: 'ws_921a9a_1769156777897',
//   status: 'created'
// }
