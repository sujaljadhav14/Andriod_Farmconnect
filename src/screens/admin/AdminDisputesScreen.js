import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import adminService from '../../services/adminService';
import { LoadingSpinner } from '../../components/common';
import { formatDate } from '../../utils/formatters';

const ADMIN_COLOR = '#512DA8';
const STATUS_FILTERS = ['all', 'open', 'in_review', 'resolved', 'rejected', 'closed'];

const statusTone = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'resolved') return { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' };
  if (value === 'in_review') return { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0' };
  if (value === 'open') return { bg: '#FFF8E1', border: '#FFE082', text: '#E65100' };
  if (value === 'rejected') return { bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828' };
  return { bg: '#F3E5F5', border: '#D1C4E9', text: ADMIN_COLOR };
};

const AdminDisputesScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [disputes, setDisputes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const loadDisputes = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await adminService.getDisputes({
        status: statusFilter,
        search: searchText,
        limit: 100,
      });
      setDisputes(response?.data || []);
    } catch (loadError) {
      console.error('Admin disputes load error:', loadError);
      setError(loadError.message || 'Failed to load disputes');
      setDisputes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchText]);

  useEffect(() => {
    if (isFocused) {
      loadDisputes();
    }
  }, [isFocused, loadDisputes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDisputes(false);
  }, [loadDisputes]);

  const updateStatus = async (dispute, status, note) => {
    try {
      await adminService.updateDisputeStatus(dispute._id || dispute.id, {
        status,
        resolutionNote: note,
        action: `Updated by admin to ${status}`,
      });
      await loadDisputes(false);
    } catch (updateError) {
      Alert.alert('Dispute Management', updateError.message || 'Failed to update dispute status');
    }
  };

  const openStatusActions = (dispute) => {
    Alert.alert(
      'Update Dispute',
      'Select next status',
      [
        { text: 'In Review', onPress: () => updateStatus(dispute, 'in_review', 'Under active admin investigation') },
        { text: 'Resolve', onPress: () => updateStatus(dispute, 'resolved', 'Issue resolved by moderation') },
        { text: 'Reject', onPress: () => updateStatus(dispute, 'rejected', 'Insufficient evidence for escalation') },
        { text: 'Close', onPress: () => updateStatus(dispute, 'closed', 'Case closed after final review') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading disputes..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Dispute Management</Text>
        <Text style={styles.headerText}>Track escalations, review evidence, and resolve platform disputes.</Text>
      </View>

      <View style={styles.filterCard}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search dispute title or content"
          placeholderTextColor={Colors.textSecondary}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((status) => {
            const selected = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={styles.applyBtn} onPress={() => loadDisputes(false)}>
          <MaterialIcons name="filter-alt" size={16} color="#FFFFFF" />
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {disputes.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="report-gmailerrorred" size={32} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No disputes found</Text>
          <Text style={styles.emptyText}>Try changing filters or refreshing.</Text>
        </View>
      ) : (
        disputes.map((dispute) => {
          const tone = statusTone(dispute.status);
          return (
            <View key={dispute._id || dispute.id} style={styles.disputeCard}>
              <View style={styles.disputeHeader}>
                <Text style={styles.disputeTitle}>{dispute.title || 'Dispute'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                  <Text style={[styles.statusBadgeText, { color: tone.text }]}>{(dispute.status || 'open').replace('_', ' ')}</Text>
                </View>
              </View>

              <Text style={styles.disputeDescription}>{dispute.description || '-'}</Text>

              <View style={styles.metaRow}><Text style={styles.metaLabel}>Category</Text><Text style={styles.metaValue}>{dispute.category || 'other'}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Priority</Text><Text style={styles.metaValue}>{dispute.priority || 'medium'}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Raised By</Text><Text style={styles.metaValue}>{dispute.raisedBy?.name || '-'}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Against</Text><Text style={styles.metaValue}>{dispute.againstUser?.name || '-'}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Created</Text><Text style={styles.metaValue}>{formatDate(dispute.createdAt, 'short')}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Evidence</Text><Text style={styles.metaValue}>{Array.isArray(dispute.evidence) ? dispute.evidence.length : 0}</Text></View>

              {!!dispute.resolution?.note && (
                <Text style={styles.resolutionText}>Resolution: {dispute.resolution.note}</Text>
              )}

              <TouchableOpacity style={styles.actionBtn} onPress={() => openStatusActions(dispute)}>
                <MaterialIcons name="gavel" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Update Status</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  headerCard: {
    backgroundColor: ADMIN_COLOR,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EDE7F6',
    lineHeight: 18,
  },
  filterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.text,
    fontSize: 13,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  filterRow: {
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#F8F8F8',
  },
  chipActive: {
    borderColor: ADMIN_COLOR,
    backgroundColor: '#EDE7F6',
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: ADMIN_COLOR,
  },
  applyBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_COLOR,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  applyBtnText: {
    marginLeft: 5,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  disputeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disputeTitle: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  disputeDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '700',
  },
  resolutionText: {
    marginTop: 6,
    fontSize: 11,
    color: Colors.text,
    fontStyle: 'italic',
  },
  actionBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_COLOR,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnText: {
    marginLeft: 5,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.error,
    flex: 1,
  },
});

export default AdminDisputesScreen;
