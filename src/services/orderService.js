/**
 * Order Service
 * Handles all order-related API calls
 * NO DEMO DATA - All data from real backend
 */

import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class OrderService {
  /**
   * Convert backend snake_case status to UI friendly label
   */
  formatStatus(status) {
    if (!status) return 'Pending';

    const normalized = status.toString().toLowerCase();
    const statusMap = {
      confirmed: 'Accepted',
      payment_pending: 'Awaiting Payment',
      payment_received: 'Payment Received',
      ready_for_pickup: 'Ready for Pickup',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
    };

    if (statusMap[normalized]) {
      return statusMap[normalized];
    }

    return normalized
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Convert backend payment values to UI labels
   */
  formatPaymentStatus(paymentStatus) {
    if (!paymentStatus) return 'Pending';

    const normalized = paymentStatus.toString().toLowerCase();
    const statusMap = {
      pending: 'Pending',
      partial: 'Partially Paid',
      paid: 'Full Paid',
      refunded: 'Refunded',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
    };

    return statusMap[normalized] || this.formatStatus(normalized);
  }

  /**
   * Create a new order
   */
  async createOrder(orderData) {
    const response = await apiService.post(API_ENDPOINTS.ORDERS.CREATE, orderData);
    return response;
  }

  /**
   * Get farmer's orders
   */
  async getFarmerOrders() {
    const response = await apiService.get(API_ENDPOINTS.ORDERS.FARMER_ORDERS);
    return response;
  }

  /**
   * Get trader's orders
   */
  async getTraderOrders() {
    const response = await apiService.get(API_ENDPOINTS.ORDERS.TRADER_ORDERS);
    return response;
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderId) {
    const response = await apiService.get(API_ENDPOINTS.ORDERS.DETAILS(orderId));
    return response;
  }

  /**
   * Accept an order (farmer)
   */
  async acceptOrder(orderId) {
    const response = await apiService.put(API_ENDPOINTS.ORDERS.ACCEPT(orderId));
    return response;
  }

  /**
   * Reject an order (farmer)
   */
  async rejectOrder(orderId, reason) {
    const response = await apiService.put(API_ENDPOINTS.ORDERS.REJECT(orderId), {
      rejectionReason: reason,
    });
    return response;
  }

  /**
   * Mark order as ready for pickup (farmer)
   */
  async markReady(orderId) {
    const response = await apiService.put(API_ENDPOINTS.ORDERS.READY(orderId));
    return response;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, reason) {
    const response = await apiService.put(API_ENDPOINTS.ORDERS.CANCEL(orderId), {
      reason: reason,
    });
    return response;
  }

  /**
   * Normalize order data for display
   */
  normalizeOrder(order) {
    const rawStatus = order.status || 'pending';
    const rawPaymentStatus = order.paymentStatus || 'pending';
    const paymentDetails = order.paymentDetails || {};
    const deliveryDetails = order.deliveryDetails || {};
    const transportDriver = order.transportDetails?.driverId || order.transportId;

    return {
      id: order._id || order.id,
      orderNumber: order.orderNumber || `ORD-${(order._id || order.id).slice(-6).toUpperCase()}`,

      // Crop info
      cropId: order.cropId?._id || order.cropId,
      crop: order.cropId ? {
        id: order.cropId._id || order.cropId.id,
        cropName: order.cropId.cropName || order.cropId.name,
        category: order.cropId.category,
        unit: order.cropId.unit || 'kg',
        pricePerUnit: order.cropId.pricePerUnit,
        cropImage: order.cropId.cropImage,
      } : null,

      // Farmer info
      farmerId: order.farmerId?._id || order.farmerId,
      farmer: order.farmerId ? {
        id: order.farmerId._id || order.farmerId.id,
        name: order.farmerId.name,
        phone: order.farmerId.phone,
      } : null,

      // Trader info
      traderId: order.traderId?._id || order.traderId,
      trader: order.traderId ? {
        id: order.traderId._id || order.traderId.id,
        name: order.traderId.name,
        phone: order.traderId.phone,
      } : null,

      // Transport info (if assigned)
      transportId: transportDriver?._id || transportDriver,
      transport: transportDriver ? {
        id: transportDriver._id || transportDriver.id,
        name: transportDriver.name,
        phone: transportDriver.phone,
      } : null,

      // Order details
      quantity: order.quantity || 0,
      unit: order.unit || 'kg',
      pricePerUnit: order.pricePerUnit || 0,
      totalAmount: order.totalAmount || 0,
      platformFee: order.platformFee || 0,
      bookingAmount: order.bookingAmount || 0,

      // Status and dates
      status: this.formatStatus(rawStatus),
      statusRaw: rawStatus,
      paymentStatus: this.formatPaymentStatus(rawPaymentStatus),
      paymentStatusRaw: rawPaymentStatus,
      paymentMethod: paymentDetails.method || order.paymentMethod || 'On Delivery',
      paymentReference: paymentDetails.transactionId || '',
      paidAmount: Number(paymentDetails.paidAmount || 0),
      paidAt: paymentDetails.paidAt,

      // Agreement
      farmerAgreed: order.farmerAgreed || false,
      traderAgreed: order.traderAgreed || false,
      agreementId: order.agreementId?._id || order.agreementId || '',
      agreementStatus: order.agreementStatus || 'none',
      agreementGeneratedAt: order.agreementGeneratedAt,

      // Delivery info
      deliveryAddress: deliveryDetails.address || order.deliveryAddress || '',
      deliveryCity: deliveryDetails.city || '',
      deliveryState: deliveryDetails.state || '',
      deliveryPincode: deliveryDetails.pincode || '',
      deliveryDate: deliveryDetails.scheduledDate || order.deliveryDate,
      actualDeliveryDate: deliveryDetails.actualDate || order.actualDeliveryDate,
      pickupDate: order.transportDetails?.pickupTime || order.pickupDate,

      // Rejection/cancellation
      rejectionReason: order.rejectionReason || '',
      cancellationReason: order.cancellationReason || '',

      // Timestamps
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Normalize array of orders
   */
  normalizeOrders(orders) {
    if (!Array.isArray(orders)) return [];
    return orders.map(order => this.normalizeOrder(order));
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status) {
    switch (status) {
      case 'Pending':
        return '#FFA000'; // Orange
      case 'Farmer Agreed':
      case 'Both Agreed':
        return '#1565C0'; // Blue
      case 'Accepted':
        return '#2E7D32'; // Green
      case 'Payment Received':
        return '#2E7D32'; // Green
      case 'Ready for Pickup':
        return '#7B1FA2'; // Purple
      case 'Transport Assigned':
      case 'In Transit':
        return '#0097A7'; // Cyan
      case 'Delivered':
      case 'Completed':
        return '#388E3C'; // Dark Green
      case 'Rejected':
      case 'Cancelled':
        return '#D32F2F'; // Red
      case 'Awaiting Payment':
        return '#F57C00'; // Deep Orange
      default:
        return '#757575'; // Gray
    }
  }

  /**
   * Get status icon for UI
   */
  getStatusIcon(status) {
    switch (status) {
      case 'Pending':
        return 'hourglass-empty';
      case 'Farmer Agreed':
      case 'Both Agreed':
        return 'handshake';
      case 'Accepted':
        return 'check-circle';
      case 'Payment Received':
        return 'payments';
      case 'Ready for Pickup':
        return 'inventory';
      case 'Transport Assigned':
        return 'local-shipping';
      case 'In Transit':
        return 'directions-car';
      case 'Delivered':
        return 'where-to-vote';
      case 'Completed':
        return 'verified';
      case 'Rejected':
      case 'Cancelled':
        return 'cancel';
      case 'Awaiting Payment':
        return 'payment';
      default:
        return 'help-outline';
    }
  }
}

export default new OrderService();
