import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class TransactionService {
  formatStatus(status) {
    const normalized = (status || '').toLowerCase();
    const map = {
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded',
    };
    return map[normalized] || 'Pending';
  }

  normalizeTransaction(transaction) {
    if (!transaction) return null;

    return {
      id: transaction._id || transaction.id,
      referenceNumber: transaction.referenceNumber || '',
      orderId: transaction.orderId?._id || transaction.orderId || '',
      orderNumber: transaction.orderId?.orderNumber || '',
      payer: transaction.payerId || null,
      payee: transaction.payeeId || null,
      amount: Number(transaction.amount || 0),
      currency: transaction.currency || 'INR',
      type: transaction.type || 'full_payment',
      statusRaw: transaction.status || 'pending',
      status: this.formatStatus(transaction.status),
      paymentMethod: transaction.paymentMethod || 'upi',
      gateway: transaction.gateway || 'dummy',
      notes: transaction.notes || '',
      completedAt: transaction.completedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  normalizeTransactions(transactions) {
    if (!Array.isArray(transactions)) return [];
    return transactions.map((transaction) => this.normalizeTransaction(transaction)).filter(Boolean);
  }

  async createTransaction(payload) {
    const response = await apiService.post(API_ENDPOINTS.TRANSACTIONS.CREATE, payload);
    return {
      transaction: this.normalizeTransaction(response?.data?.transaction || response.transaction),
      order: response?.data?.order || null,
      agreement: response?.data?.agreement || null,
      raw: response,
    };
  }

  async createDummyPayment(orderId, amount, paymentMethod = 'upi', extra = {}) {
    return this.createTransaction({
      orderId,
      amount,
      paymentMethod,
      status: 'completed',
      gateway: 'dummy',
      ...extra,
    });
  }

  async getMyTransactions(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.TRANSACTIONS.MY_TRANSACTIONS}?${queryString}`
      : API_ENDPOINTS.TRANSACTIONS.MY_TRANSACTIONS;

    const response = await apiService.get(endpoint);
    return {
      transactions: this.normalizeTransactions(response?.data || response?.transactions || []),
      pagination: response?.pagination || null,
      raw: response,
    };
  }

  async getTransactionStats() {
    const response = await apiService.get(API_ENDPOINTS.TRANSACTIONS.STATS);
    return response?.data || response;
  }

  async getTransactionDetails(transactionId) {
    const response = await apiService.get(API_ENDPOINTS.TRANSACTIONS.DETAILS(transactionId));
    return this.normalizeTransaction(response?.data || response?.transaction || response);
  }

  async getTransactionByReference(referenceNumber) {
    const response = await apiService.get(API_ENDPOINTS.TRANSACTIONS.BY_REFERENCE(referenceNumber));
    return this.normalizeTransaction(response?.data || response?.transaction || response);
  }
}

export default new TransactionService();
