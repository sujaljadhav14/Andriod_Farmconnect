import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import storageService from '../../services/storageService';
import transportService from '../../services/transportService';

const STORAGE_KEY = 'transport:schedule:v1';

const DEFAULT_SCHEDULE = {
  monday: { start: '09:00', end: '18:00', active: true },
  tuesday: { start: '09:00', end: '18:00', active: true },
  wednesday: { start: '09:00', end: '18:00', active: true },
  thursday: { start: '09:00', end: '18:00', active: true },
  friday: { start: '09:00', end: '18:00', active: true },
  saturday: { start: '10:00', end: '15:00', active: true },
  sunday: { start: '', end: '', active: false },
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || ''));

const labelDay = (day) => `${day.charAt(0).toUpperCase()}${day.slice(1)}`;

const ScheduleManagementScreen = () => {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await transportService.getSchedule();
        const payload = response?.data || response || {};

        if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
          const merged = { ...DEFAULT_SCHEDULE, ...payload };
          setSchedule(merged);
          await storageService.setItem(STORAGE_KEY, merged);
          return;
        }
      } catch (apiError) {
        try {
          const stored = await storageService.getItem(STORAGE_KEY);
          if (stored && typeof stored === 'object') {
            setSchedule({ ...DEFAULT_SCHEDULE, ...stored });
          }
        } catch (storageError) {
          console.error('Failed to load local schedule fallback:', storageError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  const activeDays = useMemo(
    () => DAYS.filter((day) => schedule[day]?.active).length,
    [schedule]
  );

  const updateSlot = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const toggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        active: !prev[day].active,
      },
    }));
  };

  const saveSchedule = async () => {
    for (const day of DAYS) {
      const slot = schedule[day];
      if (!slot?.active) continue;

      if (!isValidTime(slot.start) || !isValidTime(slot.end)) {
        Alert.alert('Validation', `Use HH:MM format for ${labelDay(day)} time slots.`);
        return;
      }
    }

    try {
      setSaving(true);
      await transportService.updateSchedule(schedule);
      await storageService.setItem(STORAGE_KEY, schedule);
      Alert.alert('Saved', 'Schedule updated successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryCard}>
        <MaterialIcons name="event-available" size={22} color="#1565C0" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.summaryTitle}>Weekly Availability</Text>
          <Text style={styles.summarySub}>{activeDays} day(s) active this week</Text>
        </View>
      </View>

      {DAYS.map((day) => {
        const slot = schedule[day] || DEFAULT_SCHEDULE[day];
        return (
          <View key={day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{labelDay(day)}</Text>
              <Switch
                value={!!slot.active}
                onValueChange={() => toggleDay(day)}
                thumbColor={slot.active ? '#2E7D32' : '#f4f3f4'}
                trackColor={{ false: '#D5D5D5', true: '#A5D6A7' }}
              />
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>Start</Text>
                <TextInput
                  value={slot.start}
                  onChangeText={(value) => updateSlot(day, 'start', value)}
                  editable={!!slot.active}
                  placeholder="09:00"
                  style={[styles.timeInput, !slot.active && styles.timeInputDisabled]}
                />
              </View>

              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>End</Text>
                <TextInput
                  value={slot.end}
                  onChangeText={(value) => updateSlot(day, 'end', value)}
                  editable={!!slot.active}
                  placeholder="18:00"
                  style={[styles.timeInput, !slot.active && styles.timeInputDisabled]}
                />
              </View>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={saveSchedule} disabled={saving}>
        <MaterialIcons name="save" size={16} color={Colors.white} />
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Schedule'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 10, fontSize: 13, color: Colors.textSecondary },
  summaryCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#1565C0' },
  summarySub: { marginTop: 3, fontSize: 12, color: '#2C5E8A' },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  timeRow: { marginTop: 10, flexDirection: 'row', gap: 10 },
  timeCol: { flex: 1 },
  timeLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  timeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  timeInputDisabled: {
    opacity: 0.6,
    backgroundColor: '#EFEFEF',
  },
  saveBtn: {
    marginTop: 6,
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, marginLeft: 6, fontWeight: '700', fontSize: 14 },
});

export default ScheduleManagementScreen;
