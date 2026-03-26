/**
 * Proposal Service
 * Handles all proposal-related API calls
 * NO DEMO DATA - All data from real backend
 */

import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class ProposalService {
  /**
   * Create a new proposal for a crop
   */
  async createProposal(cropId, proposalData) {
    const response = await apiService.post(API_ENDPOINTS.PROPOSALS.CREATE, {
      cropId,
      ...proposalData,
    });
    return response;
  }

  /**
   * Get all proposals made by trader
   */
  async getTraderProposals() {
    const response = await apiService.get(API_ENDPOINTS.PROPOSALS.TRADER);
    return response;
  }

  /**
   * Get all proposals received by farmer
   */
  async getFarmerProposals() {
    const response = await apiService.get(API_ENDPOINTS.PROPOSALS.FARMER);
    return response;
  }

  /**
   * Get proposals for a specific crop
   */
  async getProposalsForCrop(cropId) {
    const response = await apiService.get(API_ENDPOINTS.PROPOSALS.FOR_CROP(cropId));
    return response;
  }

  /**
   * Get proposal statistics
   */
  async getProposalStats() {
    const response = await apiService.get(API_ENDPOINTS.PROPOSALS.STATS);
    return response;
  }

  /**
   * Accept a proposal (farmer only)
   */
  async acceptProposal(proposalId) {
    const response = await apiService.patch(API_ENDPOINTS.PROPOSALS.ACCEPT(proposalId));
    return response;
  }

  /**
   * Reject a proposal (farmer only)
   */
  async rejectProposal(proposalId, reason) {
    const response = await apiService.patch(API_ENDPOINTS.PROPOSALS.REJECT(proposalId), {
      rejectionReason: reason,
    });
    return response;
  }

  /**
   * Withdraw a proposal (trader only)
   */
  async withdrawProposal(proposalId) {
    const response = await apiService.patch(API_ENDPOINTS.PROPOSALS.WITHDRAW(proposalId));
    return response;
  }

  /**
   * Normalize proposal data for display
   */
  normalizeProposal(proposal) {
    return {
      id: proposal._id || proposal.id,
      cropId: proposal.cropId?._id || proposal.cropId,
      crop: proposal.cropId ? {
        id: proposal.cropId._id || proposal.cropId.id,
        cropName: proposal.cropId.cropName || proposal.cropId.name,
        category: proposal.cropId.category,
        unit: proposal.cropId.unit || 'kg',
        pricePerUnit: proposal.cropId.pricePerUnit,
        cropImage: proposal.cropId.cropImage,
      } : null,
      traderId: proposal.traderId?._id || proposal.traderId,
      trader: proposal.traderId ? {
        id: proposal.traderId._id || proposal.traderId.id,
        name: proposal.traderId.name,
        phone: proposal.traderId.phone,
      } : null,
      farmerId: proposal.farmerId?._id || proposal.farmerId,
      farmer: proposal.farmerId ? {
        id: proposal.farmerId._id || proposal.farmerId.id,
        name: proposal.farmerId.name,
        phone: proposal.farmerId.phone,
      } : null,
      proposedQuantity: proposal.proposedQuantity || proposal.quantity || 0,
      proposedPrice: proposal.proposedPrice || proposal.pricePerUnit || 0,
      totalAmount: proposal.totalAmount || (proposal.proposedQuantity * proposal.proposedPrice) || 0,
      message: proposal.message || '',
      status: proposal.status || 'Pending',
      rejectionReason: proposal.rejectionReason || '',
      paymentTerms: proposal.paymentTerms || 'On Delivery',
      deliveryDate: proposal.deliveryDate || proposal.expectedDeliveryDate,
      deliveryAddress: proposal.deliveryAddress || '',
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
    };
  }

  /**
   * Normalize array of proposals
   */
  normalizeProposals(proposals) {
    if (!Array.isArray(proposals)) return [];
    return proposals.map(proposal => this.normalizeProposal(proposal));
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFA000'; // Orange
      case 'accepted':
        return '#4CAF50'; // Green
      case 'rejected':
        return '#F44336'; // Red
      case 'withdrawn':
        return '#9E9E9E'; // Gray
      default:
        return '#757575';
    }
  }
}

export default new ProposalService();
