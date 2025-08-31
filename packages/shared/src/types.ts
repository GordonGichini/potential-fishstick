import { Decimal } from 'decimal.js';

export interface CreateSessionRequest {
  amount: number;
  currency: string;
  description?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentSession {
  id: string;
  amount: Decimal;
  amountSbtc: Decimal;
  currency: string;
  status: 'pending' | 'completed' | 'expired';
  checkoutUrl: string;
  expiresAt: Date;
}

export interface TransactionEvent {
  id: string;
  type: 'payment.pending' | 'payment.confirmed' | 'payment.failed';
  data: {
    transactionId: string;
    merchantId: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: Record<string, any>;
  };
  createdAt: Date;
}