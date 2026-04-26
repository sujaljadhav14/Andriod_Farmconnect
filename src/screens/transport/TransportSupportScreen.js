import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import transportService from '../../services/transportService';
import { formatDate } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';

const HELPLINE = '+918655568655';
const SUPPORT_EMAIL = 'transport.support@sudeshm.com';

const FAQS = [
  {
    id: 'faq-1',
    question: 'How do I start a delivery?',
    answer: 'Open Available Orders, accept an order, and manage progress from My Deliveries.',
  },
  {
    id: 'faq-2',
    question: 'When do earnings update?',
    answer: 'Earnings update once delivery is marked delivered or completed.',
  },
  {
    id: 'faq-3',
    question: 'What if my vehicle breaks down?',
    answer: 'Call support immediately so we can notify stakeholders and guide next actions.',
  },
];

const SUBJECT_KEYS = [
  'deliveryIssue',
  'paymentInquiry',
  'appTechnicalIssue',
  'other',
];

const TransportSupportScreen = () => {
  const { t } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState('faq-1');
  const [subject, setSubject] = useState(SUBJECT_KEYS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [tickets, setTickets] = useState([]);

  const messageLength = useMemo(() => message.trim().length, [message]);
  const subjectLabel = t(`transporter.support.${subject}`);

  const loadTickets = useCallback(async () => {
    try {
      const response = await transportService.getSupportTickets({ page: 1, limit: 10 });
      const normalized = transportService.normalizeSupportTickets(response?.data || []);
      setTickets(normalized);
    } catch (error) {
      console.warn('Failed to load support tickets:', error.message);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const callSupport = async () => {
    try {
      await Linking.openURL(`tel:${HELPLINE}`);
    } catch (error) {
      Alert.alert(t('messages.error'), t('messages.tryAgain'));
    }
  };

  const emailSupport = async () => {
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    } catch (error) {
      Alert.alert(t('messages.error'), t('messages.tryAgain'));
    }
  };

  const submitTicket = async () => {
    if (messageLength < 10) {
      Alert.alert(t('common.confirm'), t('transporter.support.minimumCharacters'));
      return;
    }

    try {
      setSubmitting(true);
      const response = await transportService.createSupportTicket({ subject: subjectLabel, message: message.trim() });
      const createdTicket = transportService.normalizeSupportTickets([response?.data || response])[0];

      if (createdTicket) {
        setTickets((prev) => [createdTicket, ...prev]);
      }

      Alert.alert(t('transporter.support.ticketSubmittedTitle'), `${subjectLabel}\n\n${t('transporter.support.ticketSubmittedMessage')}`);
      setMessage('');
    } catch (error) {
      Alert.alert(t('messages.error'), error.message || t('transporter.support.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.contactCard}>
        <Text style={styles.cardTitle}>{t('transporter.support.contactCardTitle')}</Text>
        <Text style={styles.cardSubtitle}>{t('transporter.support.contactCardSubtitle')}</Text>

        <TouchableOpacity style={styles.contactRow} onPress={callSupport}>
          <MaterialIcons name="phone" size={20} color="#1565C0" />
          <View style={styles.contactBody}>
            <Text style={styles.contactLabel}>{t('transporter.support.helpline')}</Text>
            <Text style={styles.contactValue}>{HELPLINE}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={emailSupport}>
          <MaterialIcons name="email" size={20} color="#1565C0" />
          <View style={styles.contactBody}>
            <Text style={styles.contactLabel}>{t('transporter.support.emailSupport')}</Text>
            <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('transporter.support.contactSupport')}</Text>

        <Text style={styles.label}>{t('transporter.support.subjects')}</Text>
        <View style={styles.subjectChips}>
          {SUBJECT_KEYS.map((option) => {
            const selected = option === subject;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setSubject(option)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{t(`transporter.support.${option}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>{t('transporter.support.messageLabel')}</Text>
        <TextInput
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          placeholder={t('transporter.support.messagePlaceholder')}
          placeholderTextColor={Colors.textSecondary}
        />

        <View style={styles.formFooter}>
          <Text style={styles.charCount}>{t('transporter.support.characters', { count: messageLength })}</Text>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={submitTicket}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? t('transporter.support.submitting') : t('transporter.support.submitTicket')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('transporter.support.myTickets')}</Text>
        {loadingTickets ? (
          <View style={styles.ticketLoadingRow}>
            <ActivityIndicator size="small" color="#1565C0" />
            <Text style={styles.ticketLoadingText}>{t('common.loading')}</Text>
          </View>
        ) : tickets.length === 0 ? (
          <Text style={styles.ticketEmpty}>{t('transporter.support.noTickets')}</Text>
        ) : (
          tickets.slice(0, 5).map((ticket) => (
            <View key={ticket.id || `${ticket.subject}-${ticket.createdAt}`} style={styles.ticketItem}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <View style={[styles.ticketStatusBadge, ticket.status === 'closed' && styles.ticketStatusClosed]}>
                  <Text style={styles.ticketStatusText}>
                    {ticket.status === 'closed' ? t('transporter.support.ticketClosed') : t('transporter.support.ticketOpen')}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketMessage}>{ticket.message}</Text>
              <Text style={styles.ticketDate}>{formatDate(ticket.createdAt, 'datetime')}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('transporter.support.faqTitle')}</Text>
        {FAQS.map((faq) => {
          const expanded = expandedFaq === faq.id;
          return (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestionRow}
                onPress={() => setExpandedFaq(expanded ? '' : faq.id)}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <MaterialIcons
                  name={expanded ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {expanded ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  contactCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#90CAF9',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, color: Colors.text, fontWeight: '700' },
  cardSubtitle: { marginTop: 4, color: Colors.textSecondary, fontSize: 12 },
  contactRow: {
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactBody: { flex: 1, marginLeft: 10 },
  contactLabel: { color: Colors.textSecondary, fontSize: 12 },
  contactValue: { marginTop: 2, color: Colors.text, fontSize: 13, fontWeight: '600' },
  label: { marginTop: 12, marginBottom: 8, color: Colors.text, fontWeight: '600', fontSize: 13 },
  subjectChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F8F8',
  },
  chipActive: { borderColor: '#1565C0', backgroundColor: '#1565C015' },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#1565C0' },
  messageInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 110,
    textAlignVertical: 'top',
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  formFooter: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { color: Colors.textSecondary, fontSize: 12 },
  submitBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  ticketLoadingRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  ticketLoadingText: { marginLeft: 8, color: Colors.textSecondary, fontSize: 12 },
  ticketEmpty: { marginTop: 10, color: Colors.textSecondary, fontSize: 13 },
  ticketItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketSubject: { flex: 1, color: Colors.text, fontSize: 13, fontWeight: '700', marginRight: 8 },
  ticketStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#E8F5E9',
  },
  ticketStatusClosed: {
    backgroundColor: '#ECEFF1',
  },
  ticketStatusText: { color: '#2E7D32', fontSize: 11, fontWeight: '700' },
  ticketMessage: { marginTop: 6, color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  ticketDate: { marginTop: 6, color: Colors.textSecondary, fontSize: 11 },
  faqItem: { borderTopWidth: 1, borderTopColor: Colors.border, paddingVertical: 10 },
  faqQuestionRow: { flexDirection: 'row', alignItems: 'center' },
  faqQuestion: { flex: 1, color: Colors.text, fontWeight: '600', fontSize: 13 },
  faqAnswer: { marginTop: 8, color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
});

export default TransportSupportScreen;
