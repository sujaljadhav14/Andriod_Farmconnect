import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import adminService from '../../services/adminService';
import { LoadingSpinner } from '../../components/common';
import { formatDate } from '../../utils/formatters';

const ADMIN_COLOR = '#512DA8';
const ROLE_FILTERS = ['all', 'farmer', 'trader', 'transport', 'admin'];
const STATUS_FILTERS = ['all', 'active', 'suspended', 'banned'];

const statusTone = (status) => {
  const value = String(status || 'active').toLowerCase();
  if (value === 'active') {
    return { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' };
  }
  if (value === 'suspended') {
    return { bg: '#FFF3E0', border: '#FFCC80', text: '#E65100' };
  }
  return { bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828' };
};

const AdminUserManagementScreen = ({ navigation }) => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadUsers = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await adminService.getUsers({
        search: searchText,
        role: roleFilter,
        status: statusFilter,
        limit: 100,
      });
      setUsers(response?.data || []);
    } catch (usersError) {
      console.error('Admin users load error:', usersError);
      setError(usersError.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchText, roleFilter, statusFilter]);

  useEffect(() => {
    if (isFocused) {
      loadUsers();
    }
  }, [isFocused, loadUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers(false);
  }, [loadUsers]);

  const usersSummary = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.accountStatus === 'active').length,
      suspended: users.filter((user) => user.accountStatus === 'suspended').length,
      banned: users.filter((user) => user.accountStatus === 'banned').length,
    };
  }, [users]);

  const handleUserAction = async (user, action) => {
    try {
      if (action === 'activate') {
        await adminService.activateUser(user.id, 'Re-activated by admin review');
      }
      if (action === 'suspend') {
        await adminService.suspendUser(user.id, 'Temporarily suspended for policy review');
      }
      if (action === 'ban') {
        await adminService.banUser(user.id, 'Banned due to policy violation');
      }
      await loadUsers(false);
    } catch (actionError) {
      Alert.alert('Admin Users', actionError.message || 'Failed to update user status');
    }
  };

  const openActions = (user) => {
    const options = [];

    if (user.accountStatus === 'active') {
      options.push(
        { text: 'Suspend', onPress: () => handleUserAction(user, 'suspend') },
        { text: 'Ban', onPress: () => handleUserAction(user, 'ban'), style: 'destructive' }
      );
    } else {
      options.push({ text: 'Activate', onPress: () => handleUserAction(user, 'activate') });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('User Moderation', `Choose action for ${user.name}`, options);
  };

  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerText}>Review users, monitor KYC, and moderate account access.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.summaryValue}>{usersSummary.total}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Active</Text><Text style={styles.summaryValue}>{usersSummary.active}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Suspended</Text><Text style={styles.summaryValue}>{usersSummary.suspended}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Banned</Text><Text style={styles.summaryValue}>{usersSummary.banned}</Text></View>
      </View>

      <View style={styles.filterCard}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search by name or phone"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.filterLabel}>Role</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {ROLE_FILTERS.map((role) => {
            const selected = roleFilter === role;
            return (
              <TouchableOpacity
                key={role}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setRoleFilter(role)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.filterLabel}>Account Status</Text>
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
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={styles.applyBtn} onPress={() => loadUsers(false)}>
          <MaterialIcons name="filter-alt" size={16} color="#FFFFFF" />
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="person-search" size={32} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptyText}>Try clearing filters or refreshing.</Text>
        </View>
      ) : (
        users.map((user) => {
          const tone = statusTone(user.accountStatus);
          return (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userIdentity}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userMeta}>{user.phone} • {user.role}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                  <Text style={[styles.statusBadgeText, { color: tone.text }]}>{user.accountStatus || 'active'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>KYC</Text>
                <Text style={styles.infoValue}>{user.kycStatus || 'pending'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>{formatDate(user.createdAt, 'short')}</Text>
              </View>

              {!!user.accountStatusReason && user.accountStatus !== 'active' && (
                <Text style={styles.reasonText}>Reason: {user.accountStatusReason}</Text>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => navigation.navigate('AdminUserDetail', { userId: user.id, userName: user.name })}
                >
                  <MaterialIcons name="visibility" size={16} color={ADMIN_COLOR} />
                  <Text style={styles.secondaryActionText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryAction} onPress={() => openActions(user)}>
                  <MaterialIcons name="gavel" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Moderate</Text>
                </TouchableOpacity>
              </View>
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EDE7F6',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
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
  filterLabel: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 6,
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
  },
  chipTextActive: {
    color: ADMIN_COLOR,
  },
  applyBtn: {
    marginTop: 2,
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
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userIdentity: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  userMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '700',
  },
  reasonText: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.error,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  secondaryActionText: {
    marginLeft: 5,
    fontSize: 12,
    color: ADMIN_COLOR,
    fontWeight: '700',
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_COLOR,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  primaryActionText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#FFFFFF',
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

export default AdminUserManagementScreen;
