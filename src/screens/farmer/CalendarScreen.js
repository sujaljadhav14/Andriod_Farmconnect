import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { TASK_CATEGORIES } from '../../config/constants';
import taskService from '../../services/taskService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';

const STATUS_FILTERS = ['all', 'pending', 'completed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const CalendarScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(TASK_CATEGORIES[0]?.value || 'Sowing');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(new Date());

  const loadTasks = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await taskService.getMyTasks({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setTasks(response || []);
    } catch (loadError) {
      console.error('Load tasks error:', loadError);
      setError(loadError.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isFocused) {
      loadTasks();
    }
  }, [isFocused, loadTasks]);

  useEffect(() => {
    if (!loading) {
      loadTasks(false);
    }
  }, [statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks(false);
  }, [loadTasks]);

  const summary = useMemo(() => {
    const pending = tasks.filter((task) => task.status === 'pending').length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    return {
      total: tasks.length,
      pending,
      completed,
    };
  }, [tasks]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory(TASK_CATEGORIES[0]?.value || 'Sowing');
    setPriority('medium');
    setDueDate(new Date());
  };

  const createTask = async () => {
    if (!title.trim()) {
      Alert.alert('Calendar', 'Please enter task title.');
      return;
    }

    setSaving(true);
    try {
      const createdTask = await taskService.createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate: dueDate.toISOString(),
      });

      setTasks((prev) => [createdTask, ...prev]);
      resetForm();
      Alert.alert('Calendar', 'Task added successfully.');
    } catch (createError) {
      console.error('Create task error:', createError);
      Alert.alert('Calendar', createError.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskStatus = async (task) => {
    try {
      const updatedTask = await taskService.toggleTaskStatus(task);
      setTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));
    } catch (updateError) {
      console.error('Toggle task status error:', updateError);
      Alert.alert('Calendar', updateError.message || 'Failed to update task');
    }
  };

  const deleteTask = async (task) => {
    Alert.alert(
      'Delete Task',
      `Delete \"${task.title}\"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(task.id);
              setTasks((prev) => prev.filter((item) => item.id !== task.id));
            } catch (deleteError) {
              console.error('Delete task error:', deleteError);
              Alert.alert('Calendar', deleteError.message || 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading farm calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{summary.total}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: '#E65100' }]}>{summary.pending}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>{summary.completed}</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Add Farm Task</Text>

        <Input
          label="Task Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Example: Drip irrigation - west plot"
          icon="assignment"
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Add notes or checklist"
          icon="notes"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipsWrap}>
          {TASK_CATEGORIES.map((option) => {
            const selected = category === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setCategory(option.value)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipsWrap}>
          {PRIORITY_OPTIONS.map((value) => {
            const selected = priority === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setPriority(value)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{value.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <MaterialIcons name="event" size={18} color={Colors.primary} />
          <Text style={styles.dateButtonText}>Due Date: {formatDate(dueDate, 'long')}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDueDate(selectedDate);
              }
            }}
          />
        )}

        <Button
          title="Add Task"
          icon="add-task"
          loading={saving}
          onPress={createTask}
          fullWidth
        />
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.cardTitle}>My Tasks</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {STATUS_FILTERS.map((filter) => {
          const selected = statusFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => setStatusFilter(filter)}
            >
              <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                {filter === 'all' ? 'All Tasks' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="calendar-month" size={30} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No tasks found</Text>
          <Text style={styles.emptyText}>Add your first farm task to start planning.</Text>
        </View>
      ) : (
        tasks.map((task) => {
          const isDone = task.status === 'completed';
          return (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{task.title}</Text>
                <View style={[styles.statusBadge, isDone ? styles.statusDone : styles.statusPending]}>
                  <Text style={[styles.statusBadgeText, isDone ? styles.statusDoneText : styles.statusPendingText]}>
                    {isDone ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>

              {!!task.description && <Text style={styles.taskDescription}>{task.description}</Text>}

              <View style={styles.taskMetaRow}>
                <Text style={styles.taskMetaText}>Category: {task.category}</Text>
                <Text style={styles.taskMetaText}>Priority: {task.priority.toUpperCase()}</Text>
              </View>

              <Text style={styles.taskDueText}>Due: {task.dueDate ? formatDate(task.dueDate, 'datetime') : 'N/A'}</Text>

              <View style={styles.taskActions}>
                <TouchableOpacity style={styles.taskActionBtn} onPress={() => toggleTaskStatus(task)}>
                  <MaterialIcons
                    name={isDone ? 'restart-alt' : 'check-circle'}
                    size={18}
                    color={isDone ? '#E65100' : '#2E7D32'}
                  />
                  <Text style={styles.taskActionText}>{isDone ? 'Mark Pending' : 'Mark Done'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.taskActionBtn} onPress={() => deleteTask(task)}>
                  <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                  <Text style={[styles.taskActionText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F8F8',
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  dateButtonText: {
    marginLeft: 8,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  feedHeader: {
    marginTop: 2,
  },
  filterRow: {
    marginBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primary,
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
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
    marginRight: 8,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPending: {
    borderColor: '#FFE082',
    backgroundColor: '#FFF8E1',
  },
  statusDone: {
    borderColor: '#A5D6A7',
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPendingText: {
    color: '#E65100',
  },
  statusDoneText: {
    color: '#2E7D32',
  },
  taskDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taskMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  taskDueText: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 10,
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  taskActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  taskActionText: {
    marginLeft: 5,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    marginLeft: 8,
    color: Colors.error,
    fontSize: 12,
    flex: 1,
  },
});

export default CalendarScreen;