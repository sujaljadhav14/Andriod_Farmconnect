import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import { Colors } from '../../constants/colors';
import adminService from '../../services/adminService';
import { LoadingSpinner } from '../../components/common';

const ADMIN_COLOR = '#512DA8';

const AdminKYCScreen = () => {
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kycRecords, setKycRecords] = useState([]);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadKYC = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const result = await adminService.getAllKYC();
      console.log('✅ KYC records loaded:', result);
      setKycRecords(result.data || []);
    } catch (err) {
      console.error('❌ Failed to load KYC records:', err);
      setError(err.message || 'Failed to load KYC records');
      setKycRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadKYC();
    }
  }, [isFocused, loadKYC]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadKYC(false);
  }, [loadKYC]);

  const handleApprove = async (kycId) => {
    Alert.alert(
      'Approve KYC',
      'Are you sure you want to approve this KYC application?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminService.approveKYC(kycId);
              Alert.alert('Success', 'KYC approved successfully');
              setSelectedKYC(null);
              setModalVisible(false);
              loadKYC(false);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to approve KYC');
            } finally {
              setActionLoading(false);
            }
          },
          style: 'default',
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.rejectKYC(selectedKYC.id || selectedKYC._id, rejectReason);
      Alert.alert('Success', 'KYC rejected successfully');
      setRejectReason('');
      setSelectedKYC(null);
      setModalVisible(false);
      loadKYC(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return '#FF9800';
      case 'approved':
        return '#4CAF50';
      case 'verified':
        return '#2196F3';
      case 'rejected':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const renderKYCItem = ({ item }) => (
    <TouchableOpacity
      style={styles.kycCard}
      onPress={() => {
        setSelectedKYC(item);
        setRejectReason('');
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: ADMIN_COLOR },
            ]}
          >
            <Text style={styles.avatarText}>
              {item.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
            <Text style={styles.userPhone}>{item.phone || 'No phone'}</Text>
            <Text style={styles.userRole}>{item.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.kycStatus) },
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {getStatusLabel(item.kycStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Submitted: {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
        </Text>
        <MaterialIcons name="chevron-right" size={20} color={ADMIN_COLOR} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="assignment-ind" size={64} color="#CCC" />
      <Text style={styles.emptyText}>No KYC records found</Text>
      <Text style={styles.emptySubtext}>
        KYC applications will appear here
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="Loading KYC records..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <Text style={styles.headerSubtitle}>
          {kycRecords.length} application(s)
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error" size={20} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={kycRecords}
        renderItem={renderKYCItem}
        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ADMIN_COLOR]}
          />
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedKYC(null);
          setRejectReason('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>KYC Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSelectedKYC(null);
                  setRejectReason('');
                }}
              >
                <MaterialIcons name="close" size={24} color={ADMIN_COLOR} />
              </TouchableOpacity>
            </View>

            {selectedKYC && (
              <>
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedKYC.name || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {selectedKYC.phone || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role:</Text>
                    <Text style={styles.detailValue}>
                      {selectedKYC.role?.toUpperCase() || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        {
                          backgroundColor: getStatusColor(
                            selectedKYC.kycStatus
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {getStatusLabel(selectedKYC.kycStatus)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Submitted:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(
                        selectedKYC.updatedAt || selectedKYC.createdAt
                      ).toLocaleString()}
                    </Text>
                  </View>

                  {selectedKYC.kycDetails && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>KYC Information:</Text>
                      <Text style={styles.detailValue}>
                        {JSON.stringify(selectedKYC.kycDetails, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedKYC.kycStatus?.toLowerCase() === 'submitted' && (
                  <>
                    <View style={styles.rejectReasonContainer}>
                      <Text style={styles.rejectReasonLabel}>
                        Rejection Reason (if rejecting):
                      </Text>
                      <TextInput
                        style={styles.rejectReasonInput}
                        placeholder="Enter reason for rejection..."
                        placeholderTextColor="#999"
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        multiline
                        numberOfLines={3}
                        editable={!actionLoading}
                      />
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.rejectButton,
                          actionLoading && styles.buttonDisabled,
                        ]}
                        onPress={handleReject}
                        disabled={actionLoading}
                      >
                        <MaterialIcons
                          name="close"
                          size={18}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.approveButton,
                          actionLoading && styles.buttonDisabled,
                        ]}
                        onPress={() => handleApprove(selectedKYC.id || selectedKYC._id)}
                        disabled={actionLoading}
                      >
                        <MaterialIcons
                          name="check"
                          size={18}
                          color="#fff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.buttonText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {selectedKYC.kycStatus?.toLowerCase() !== 'submitted' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.closeButton]}
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedKYC(null);
                        setRejectReason('');
                      }}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: ADMIN_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorBanner: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  kycCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: ADMIN_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_COLOR,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  detailSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rejectReasonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rejectReasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  rejectReasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  closeButton: {
    backgroundColor: ADMIN_COLOR,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default AdminKYCScreen;
