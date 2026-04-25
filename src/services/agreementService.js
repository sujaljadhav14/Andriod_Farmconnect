import apiService from './apiService';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import storageService from './storageService';

class AgreementService {
    formatStatus(status) {
        const normalized = (status || '').toLowerCase();
        const map = {
            pending_farmer: 'Pending Farmer Signature',
            pending_trader: 'Pending Trader Signature',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return map[normalized] || 'Pending';
    }

    normalizeAgreement(agreement) {
        if (!agreement) return null;

        return {
            id: agreement._id || agreement.id,
            orderId: agreement.orderId?._id || agreement.orderId,
            orderNumber: agreement.orderId?.orderNumber || '',
            farmer: agreement.farmerId || null,
            trader: agreement.traderId || null,
            documentNumber: agreement.documentNumber || '',
            title: agreement.title || 'FarmConnect Produce Trade Agreement',
            documentBody: agreement.documentBody || '',
            terms: agreement.terms || {},
            statusRaw: agreement.status || 'pending_farmer',
            status: this.formatStatus(agreement.status),
            farmerSignature: agreement.farmerSignature || { signed: false },
            traderSignature: agreement.traderSignature || { signed: false },
            generatedAfterTransaction: agreement.generatedAfterTransaction || null,
            completedAt: agreement.completedAt,
            cancelledAt: agreement.cancelledAt,
            cancellationReason: agreement.cancellationReason || '',
            createdAt: agreement.createdAt,
            updatedAt: agreement.updatedAt,
        };
    }

    async getAgreement(orderId, options = {}) {
        const { allowMissing = false } = options;

        try {
            const response = await apiService.get(API_ENDPOINTS.AGREEMENTS.GET(orderId));
            return this.normalizeAgreement(response?.data || response?.agreement || response);
        } catch (error) {
            if (allowMissing && /not found|not generated/i.test(error.message || '')) {
                return null;
            }
            throw error;
        }
    }

    async getAgreements(filters = {}) {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        const queryString = params.toString();
        const endpoint = queryString
            ? `${API_ENDPOINTS.AGREEMENTS.LIST}?${queryString}`
            : API_ENDPOINTS.AGREEMENTS.LIST;

        const response = await apiService.get(endpoint);
        return {
            agreements: (response?.data || []).map((agreement) => this.normalizeAgreement(agreement)).filter(Boolean),
            pagination: response?.pagination || null,
            raw: response,
        };
    }

    async getAgreementStats() {
        const response = await apiService.get(API_ENDPOINTS.AGREEMENTS.STATS);
        return response?.data || response;
    }

    async exportAgreement(orderId) {
        const token = await storageService.getToken();
        const endpoint = API_ENDPOINTS.AGREEMENTS.EXPORT(orderId);
        const url = `${API_BASE_URL}${endpoint}?format=pdf`;
        const fileName = `agreement-${String(orderId).slice(-6)}.pdf`;

        return {
            fileName,
            mimeType: 'application/pdf',
            downloadUrl: url,
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                Accept: 'application/pdf',
            },
        };
    }

    async signAsFarmer(orderId, payload = {}) {
        const response = await apiService.post(API_ENDPOINTS.AGREEMENTS.FARMER_SIGN(orderId), {
            acceptedTerms: true,
            ...payload,
        });
        return this.normalizeAgreement(response?.data || response?.agreement || response);
    }

    async signAsTrader(orderId, payload = {}) {
        const response = await apiService.post(API_ENDPOINTS.AGREEMENTS.TRADER_SIGN(orderId), {
            acceptedTerms: true,
            ...payload,
        });
        return this.normalizeAgreement(response?.data || response?.agreement || response);
    }

    async cancelAgreement(orderId, reason) {
        const response = await apiService.post(API_ENDPOINTS.AGREEMENTS.CANCEL(orderId), {
            reason: reason || 'Agreement cancelled by user',
        });
        return this.normalizeAgreement(response?.data || response?.agreement || response);
    }
}

export default new AgreementService();
