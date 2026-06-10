import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetWorkerProfileQuery,
  useGetJobsQuery,
  useToggleWorkMutation,
  useGetWorkerOffersQuery,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useGetNotificationsQuery,
} from '../../store/api/workerApi';
import { RootState } from '../../store';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon';
import { JobIcon } from '../../components/common/JobIcon';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { Colors, Radius, Shadows, Spacing, Typography, getJobMeta, jobLabel } from '../../theme';
import { SecureStore } from '../../utils/storage';
import { logout } from '../../store/authSlice';
import { baseApi } from '../../store/api/baseApi';

const APPLIED_KEY = '@kaamsetu_applied_jobs';

function formatSalary(n: number) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'KD';
}

function formatDate(dateStr: string) {
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}

export function WorkerDashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const lang = useSelector((s: RootState) => s.auth.language);
  const { data: worker, isLoading: profileLoading, refetch } = useGetWorkerProfileQuery();
  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useGetJobsQuery();
  const { data: offers = [], refetch: refetchOffers } = useGetWorkerOffersQuery();
  const { data: notifications = [], refetch: refetchNotifs } = useGetNotificationsQuery();
  const [toggleWork, { isLoading: toggling }] = useToggleWorkMutation();
  const [acceptOffer] = useAcceptOfferMutation();
  const [rejectOffer] = useRejectOfferMutation();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'jobs' | 'offers'>('jobs');
  const [notifVisible, setNotifVisible] = useState(false);

  const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';

  useEffect(() => {
    AsyncStorage.getItem(APPLIED_KEY).then((val) => {
      if (val) { try { setApplied(new Set(JSON.parse(val))); } catch {} }
    });
  }, []);

  const handleApply = async (matchId: string) => {
    if (!worker?.is_open_to_work) {
      Alert.alert('उपलब्ध नहीं', 'आवेदन करने से पहले अपनी उपलब्धता चालू करें।');
      return;
    }
    setApplying(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const res = await fetch(`${BASE_URL}/api/v1/worker/jobs/${matchId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error ?? 'Apply failed');
      }
      const newSet = new Set(applied).add(matchId);
      setApplied(newSet);
      await AsyncStorage.setItem(APPLIED_KEY, JSON.stringify([...newSet]));
      setSelectedJob(null);
      Alert.alert('आवेदन हो गया!', 'आपका आवेदन नियोक्ता को भेज दिया गया है।');
    } catch (e: any) {
      Alert.alert('त्रुटि', e?.message ?? 'आवेदन नहीं हो सका। फिर कोशिश करें।');
    } finally {
      setApplying(false);
    }
  };

  const handleAcceptOffer = (hireId: string) => {
    Alert.alert('ऑफर स्वीकारें', 'क्या आप यह जॉब ऑफर स्वीकार करते हैं?', [
      { text: 'रद्द करें', style: 'cancel' },
      {
        text: 'स्वीकारें', onPress: async () => {
          try {
            await acceptOffer(hireId).unwrap();
            refetchOffers();
            Alert.alert('बधाई हो!', 'ऑफर स्वीकार हो गया। नियोक्ता को सूचित कर दिया जाएगा।');
          } catch (e: any) { Alert.alert('त्रुटि', e?.data?.error ?? 'ऑफर स्वीकार नहीं हो सका।'); }
        },
      },
    ]);
  };

  const handleRejectOffer = (hireId: string) => {
    Alert.alert('ऑफर अस्वीकारें', 'क्या आप यह ऑफर अस्वीकार करना चाहते हैं?', [
      { text: 'रद्द करें', style: 'cancel' },
      {
        text: 'अस्वीकारें', style: 'destructive', onPress: async () => {
          try {
            await rejectOffer(hireId).unwrap();
            refetchOffers();
          } catch (e: any) { Alert.alert('त्रुटि', e?.data?.error ?? 'ऑफर अस्वीकार नहीं हो सका।'); }
        },
      },
    ]);
  };

  if (profileLoading) return <LoadingSpinner />;
  if (worker?.kyc_status === 'BLOCKED') { navigation.replace('ProfileBlocked'); return null; }

  const verifications = worker?.verifications ?? [];
  const hasVerified = (type: string) => verifications.some((v: any) => v.check_type === type && v.status === 'VERIFIED');
  const kycDone = worker?.kyc_status === 'FULLY_VERIFIED';
  const isOpen = worker?.is_open_to_work ?? true;
  const checks = [!!worker?.full_name, !!worker?.location?.city, (worker?.skills?.length ?? 0) > 0,
    hasVerified('SELFIE'), hasVerified('AADHAAR'), hasVerified('PAN'), kycDone];
  const profilePct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const pendingOffers = offers.filter((o: any) => o.status === 'OFFER_SENT' || o.status === 'EMPLOYER_SIGNED');
  const primarySkill = worker?.skills?.[0]?.skill_type;

  const handleLogout = () => Alert.alert('लॉगआउट करें?', 'क्या आप लॉगआउट करना चाहते हैं?', [
    { text: 'रद्द करें', style: 'cancel' },
    {
      text: 'हाँ, निकलें', style: 'destructive', onPress: async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        dispatch(baseApi.util.resetApiState());
        dispatch(logout());
      },
    },
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => { refetch(); refetchJobs(); refetchOffers(); refetchNotifs(); }} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(worker?.full_name ?? '')}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>{worker?.full_name || 'अपना नाम जोड़ें'}</Text>
              <View style={styles.heroLocRow}>
                <Icon name="location-sharp" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroLocation} numberOfLines={1}>{worker?.location?.city ?? 'स्थान सेट करें'}</Text>
                {primarySkill && (
                  <View style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{jobLabel(primarySkill, lang)}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => setNotifVisible(true)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="notifications-outline" size={22} color="#fff" />
              {notifications.length > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { marginLeft: 8 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>प्रोफ़ाइल {profilePct}% पूरी</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PersonalDetails')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.progressEdit}>पूरी करें</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${profilePct}%` }]} />
          </View>

          <TouchableOpacity
            style={[styles.availRow, isOpen ? styles.availOpen : styles.availClosed]}
            onPress={() => toggleWork()}
            disabled={toggling}
            activeOpacity={0.85}
          >
            <View style={[styles.availDot, { backgroundColor: isOpen ? Colors.success : 'rgba(255,255,255,0.5)' }]} />
            <Text style={styles.availText}>{isOpen ? 'काम के लिए उपलब्ध हूँ' : 'अभी उपलब्ध नहीं'}</Text>
            <ToggleSwitch value={isOpen} onToggle={() => toggleWork()} onColor={Colors.success} />
          </TouchableOpacity>
        </View>

        {/* ── KYC Banner ── */}
        {!kycDone && (
          <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('KycVerification')} activeOpacity={0.9}>
            <View style={styles.kycIconWrap}>
              <Icon name="shield-half" size={22} color={Colors.warningDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kycTitle}>पहचान जाँच बाकी है</Text>
              <Text style={styles.kycSub}>पूरा करें और सभी जॉब अनलॉक करें</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={Colors.warningDark} />
          </TouchableOpacity>
        )}

        {/* ── Verified strip ── */}
        {kycDone && (
          <View style={styles.verifiedCard}>
            <View style={styles.verifiedHead}>
              <Icon name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.verifiedTitle}>पूरी तरह सत्यापित प्रोफ़ाइल</Text>
            </View>
            <View style={styles.verifiedRow}>
              {[
                { type: 'SELFIE', label: 'सेल्फी' },
                { type: 'AADHAAR', label: 'आधार' },
                { type: 'PAN', label: 'पैन' },
                { type: 'BGC', label: 'पुलिस जाँच' },
              ].map((b) => (
                <View key={b.type} style={styles.verifiedChip}>
                  <Icon name="checkmark" size={13} color={Colors.successText} />
                  <Text style={styles.verifiedChipText}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Pending offers alert ── */}
        {pendingOffers.length > 0 && (
          <TouchableOpacity style={styles.offerAlert} onPress={() => setActiveTab('offers')} activeOpacity={0.9}>
            <View style={styles.offerAlertIcon}>
              <Icon name="mail-unread" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.offerAlertTitle}>{pendingOffers.length} नया जॉब ऑफर</Text>
              <Text style={styles.offerAlertSub}>देखें और स्वीकार करें</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'jobs' && styles.tabActive]} onPress={() => setActiveTab('jobs')} activeOpacity={0.8}>
            <Icon name="briefcase" size={18} color={activeTab === 'jobs' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.tabText, activeTab === 'jobs' && styles.tabTextActive]}>काम</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'offers' && styles.tabActive]} onPress={() => setActiveTab('offers')} activeOpacity={0.8}>
            <Icon name="mail-open" size={18} color={activeTab === 'offers' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.tabText, activeTab === 'offers' && styles.tabTextActive]}>
              ऑफर{pendingOffers.length > 0 ? ` (${pendingOffers.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Jobs ── */}
        {activeTab === 'jobs' && (
          <>
            <Text style={styles.sectionTitle}>आपके लिए काम</Text>
            {!kycDone ? (
              <View style={styles.lockedCard}>
                <View style={styles.lockedIconWrap}><Icon name="lock-closed" size={28} color={Colors.textTertiary} /></View>
                <Text style={styles.lockedTitle}>काम लॉक हैं</Text>
                <Text style={styles.lockedSub}>जॉब देखने के लिए पहचान जाँच पूरी करें</Text>
                <TouchableOpacity style={styles.lockedBtn} onPress={() => navigation.navigate('KycVerification')} activeOpacity={0.9}>
                  <Text style={styles.lockedBtnText}>जाँच शुरू करें</Text>
                  <Icon name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : jobsLoading ? (
              <LoadingSpinner inline />
            ) : jobs.length === 0 ? (
              <EmptyState icon="briefcase-outline" message="अभी कोई काम नहीं" subMessage="नए काम आते ही हम आपको सूचित करेंगे।" />
            ) : (
              jobs.map((match: any) => {
                const req = match.requirement ?? {};
                const isApplied = applied.has(match.id);
                return (
                  <TouchableOpacity
                    key={match.id}
                    style={[styles.jobCard, isApplied && styles.jobCardApplied]}
                    onPress={() => isOpen ? setSelectedJob(match) : Alert.alert('उपलब्ध नहीं', 'आवेदन करने के लिए उपलब्धता चालू करें।')}
                    activeOpacity={0.9}
                  >
                    <View style={styles.jobTop}>
                      <JobIcon jobType={req.job_type} size={52} />
                      <View style={styles.jobInfo}>
                        <Text style={styles.jobTitle}>{jobLabel(req.job_type, lang)}</Text>
                        <Text style={styles.jobCompany} numberOfLines={1}>{req.employer?.company_name ?? 'कंपनी'}</Text>
                      </View>
                      <View style={styles.jobSalaryBox}>
                        <Text style={styles.jobSalary}>{formatSalary(req.salary_min ?? 0)}–{formatSalary(req.salary_max ?? 0)}</Text>
                        <Text style={styles.jobSalaryPer}>हर महीना</Text>
                      </View>
                    </View>
                    <View style={styles.jobTags}>
                      {req.city && (
                        <View style={styles.tag}>
                          <Icon name="location-outline" size={13} color={Colors.textSecondary} />
                          <Text style={styles.tagText}>{req.city}</Text>
                        </View>
                      )}
                      {match.distance_km != null && (
                        <View style={styles.tag}>
                          <Icon name="walk-outline" size={13} color={Colors.textSecondary} />
                          <Text style={styles.tagText}>{Number(match.distance_km).toFixed(1)} किमी</Text>
                        </View>
                      )}
                      {isApplied && (
                        <View style={styles.tagApplied}>
                          <Icon name="checkmark-circle" size={13} color={Colors.successText} />
                          <Text style={styles.tagAppliedText}>आवेदन किया</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* ── Offers ── */}
        {activeTab === 'offers' && (
          <>
            <Text style={styles.sectionTitle}>मेरे जॉब ऑफर</Text>
            {offers.length === 0 ? (
              <EmptyState icon="mail-outline" message="अभी कोई ऑफर नहीं" subMessage="नियोक्ता के ऑफर यहाँ दिखेंगे।" />
            ) : (
              offers.map((offer: any) => {
                const emp = offer.employer ?? {};
                const req = offer.requirement ?? {};
                const isPending = offer.status === 'OFFER_SENT' || offer.status === 'EMPLOYER_SIGNED';
                const isActive = offer.status === 'ACTIVE';
                return (
                  <View key={offer.id} style={styles.offerCard}>
                    <View style={styles.offerHeader}>
                      <JobIcon jobType={req.job_type} size={46} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.offerRole}>{jobLabel(req.job_type, lang)}</Text>
                        <Text style={styles.offerCompany} numberOfLines={1}>{emp.company_name ?? 'कंपनी'}</Text>
                      </View>
                      <View style={[styles.offerBadge, isPending ? styles.badgePending : isActive ? styles.badgeActive : styles.badgeRejected]}>
                        <Text style={[styles.offerBadgeText, { color: isPending ? Colors.warningText : isActive ? Colors.successText : Colors.dangerText }]}>
                          {isPending ? 'इंतज़ार' : isActive ? 'सक्रिय' : 'अस्वीकृत'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.offerBody}>
                      <DetailRow icon="cash-outline" label="वेतन" value={`₹${Number(offer.offer_salary ?? 0).toLocaleString('en-IN')}/माह`} />
                      {offer.start_date && <DetailRow icon="calendar-outline" label="शुरू तारीख" value={formatDate(offer.start_date)} />}
                      {emp.city && <DetailRow icon="location-outline" label="स्थान" value={emp.city} />}
                    </View>

                    {isPending && (
                      <View style={styles.offerActions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOffer(offer.id)} activeOpacity={0.9}>
                          <Icon name="checkmark" size={18} color="#fff" />
                          <Text style={styles.acceptText}>स्वीकारें</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectOffer(offer.id)} activeOpacity={0.9}>
                          <Text style={styles.rejectText}>अस्वीकारें</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {isActive && (
                      <View style={styles.hiredBanner}>
                        <Icon name="happy-outline" size={18} color={Colors.successText} />
                        <Text style={styles.hiredText}>आप हायर हो गए! {offer.start_date ? `${formatDate(offer.start_date)} से` : ''}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* ── Notifications modal ── */}
      <Modal visible={notifVisible} transparent animationType="slide" onRequestClose={() => setNotifVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '75%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.notifHeader}>
              <Text style={styles.modalTitle}>सूचनाएँ</Text>
              <TouchableOpacity onPress={() => setNotifVisible(false)} style={styles.closeBtn}>
                <Icon name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <View style={{ paddingVertical: Spacing.huge }}>
                <EmptyState icon="notifications-off-outline" message="अभी कोई सूचना नहीं" subMessage="नई सूचनाएँ यहाँ दिखेंगी।" />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((n: any) => (
                  <View key={n.id} style={styles.notifRow}>
                    <View style={styles.notifIcon}>
                      <Icon name={n.type === 'WORKER_SHORTLISTED' ? 'star' : n.type === 'OFFER_LETTER_READY' ? 'mail-open' : 'notifications'} size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifBody}>{n.body}</Text>
                      <Text style={styles.notifTime}>{formatDate(n.created_at)}</Text>
                    </View>
                  </View>
                ))}
                <View style={{ height: Spacing.lg }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Job detail modal ── */}
      <Modal visible={!!selectedJob} transparent animationType="slide" onRequestClose={() => setSelectedJob(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedJob && (() => {
              const req = selectedJob.requirement ?? {};
              const isApplied = applied.has(selectedJob.id);
              return (
                <>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalHeader}>
                    <JobIcon jobType={req.job_type} size={52} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.modalTitle}>{jobLabel(req.job_type, lang)}</Text>
                      <Text style={styles.modalCompany} numberOfLines={1}>{req.employer?.company_name ?? 'कंपनी'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedJob(null)} style={styles.closeBtn}>
                      <Icon name="close" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalBody}>
                    <DetailRow icon="cash-outline" label="वेतन" value={`${formatSalary(req.salary_min ?? 0)} – ${formatSalary(req.salary_max ?? 0)}/माह`} />
                    {req.city && <DetailRow icon="location-outline" label="स्थान" value={`${req.city}${req.state ? `, ${req.state}` : ''}`} />}
                    {selectedJob.distance_km != null && <DetailRow icon="walk-outline" label="दूरी" value={`${Number(selectedJob.distance_km).toFixed(1)} किमी`} />}
                    {req.experience_required != null && <DetailRow icon="briefcase-outline" label="अनुभव" value={`${req.experience_required} साल`} />}
                    {req.is_live_in_required && <DetailRow icon="home-outline" label="रहना" value="साथ रहना ज़रूरी" />}
                    {req.description ? <Text style={styles.modalDesc}>{req.description}</Text> : null}
                  </View>

                  {!isOpen ? (
                    <View style={styles.modalNote}>
                      <Icon name="alert-circle" size={18} color={Colors.dangerText} />
                      <Text style={styles.modalNoteText}>आवेदन के लिए उपलब्धता चालू करें</Text>
                    </View>
                  ) : isApplied ? (
                    <View style={[styles.modalNote, styles.modalNoteOk]}>
                      <Icon name="checkmark-circle" size={18} color={Colors.successText} />
                      <Text style={[styles.modalNoteText, { color: Colors.successText }]}>आपने आवेदन कर दिया है</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.applyBtn, applying && { opacity: 0.7 }]}
                      onPress={() => handleApply(selectedJob.id)}
                      disabled={applying}
                      activeOpacity={0.9}
                    >
                      {applying ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Text style={styles.applyBtnText}>आवेदन करें</Text>
                          <Icon name="arrow-forward" size={20} color="#fff" />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Icon name={icon} size={18} color={Colors.textTertiary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  hero: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.primary },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  heroInfo: { flex: 1, marginLeft: Spacing.md },
  heroName: { color: '#fff', ...Typography.h3, fontWeight: '700' },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 },
  heroLocation: { color: 'rgba(255,255,255,0.85)', ...Typography.caption, maxWidth: 110 },
  skillPill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6 },
  skillPillText: { color: '#fff', ...Typography.tiny, fontWeight: '600' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.accent, borderWidth: 1.5, borderColor: Colors.primary },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { color: 'rgba(255,255,255,0.9)', ...Typography.caption },
  progressEdit: { color: '#fff', ...Typography.captionStrong },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: Spacing.lg },
  progressFill: { height: 8, backgroundColor: Colors.accent, borderRadius: 4 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  availOpen: { backgroundColor: 'rgba(255,255,255,0.15)' },
  availClosed: { backgroundColor: 'rgba(0,0,0,0.18)' },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  availText: { color: '#fff', ...Typography.bodyStrong, flex: 1 },

  kycBanner: { backgroundColor: Colors.warningLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F2D49B' },
  kycIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F7E2B7', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  kycTitle: { ...Typography.bodyStrong, color: Colors.warningText },
  kycSub: { ...Typography.caption, color: Colors.warningDark, marginTop: 2, opacity: 0.9 },

  verifiedCard: { backgroundColor: Colors.successLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: '#B8E6D5' },
  verifiedHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  verifiedTitle: { ...Typography.bodyStrong, color: Colors.successText },
  verifiedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  verifiedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D6F0E5', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  verifiedChipText: { ...Typography.tiny, fontWeight: '700', color: Colors.successText },

  offerAlert: { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#BCD9F4' },
  offerAlertIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#D3E6F9', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  offerAlertTitle: { ...Typography.bodyStrong, color: Colors.primaryText },
  offerAlertSub: { ...Typography.caption, color: Colors.primary, marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.lg },
  tab: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  tabText: { ...Typography.bodyStrong, color: Colors.textTertiary },
  tabTextActive: { color: Colors.primary },

  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.xs },

  lockedCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  lockedIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  lockedTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  lockedSub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  lockedBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13, paddingHorizontal: 24 },
  lockedBtnText: { color: '#fff', ...Typography.bodyStrong },

  jobCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  jobCardApplied: { borderColor: Colors.success, borderWidth: 1.5 },
  jobTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  jobInfo: { flex: 1, marginLeft: Spacing.md },
  jobTitle: { ...Typography.h3, color: Colors.textPrimary },
  jobCompany: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  jobSalaryBox: { alignItems: 'flex-end' },
  jobSalary: { ...Typography.h3, color: Colors.primary, fontWeight: '700' },
  jobSalaryPer: { ...Typography.tiny, color: Colors.textTertiary },
  jobTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  tagApplied: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successLight, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  tagAppliedText: { ...Typography.caption, color: Colors.successText, fontWeight: '700' },

  offerCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm, overflow: 'hidden' },
  offerHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  offerRole: { ...Typography.bodyStrong, color: Colors.textPrimary },
  offerCompany: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  offerBadge: { borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  badgePending: { backgroundColor: Colors.warningLight },
  badgeActive: { backgroundColor: Colors.successLight },
  badgeRejected: { backgroundColor: Colors.dangerLight },
  offerBadgeText: { ...Typography.tiny, fontWeight: '700' },
  offerBody: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  offerActions: { flexDirection: 'row', gap: 10, padding: Spacing.lg, paddingTop: Spacing.md },
  acceptBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: Colors.success, borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: '#fff', ...Typography.bodyStrong },
  rejectBtn: { flex: 0.6, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: Colors.dangerText, ...Typography.bodyStrong },
  hiredBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.successLight, padding: Spacing.md, margin: Spacing.lg, marginTop: 0, borderRadius: Radius.md },
  hiredText: { color: Colors.successText, ...Typography.captionStrong },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { ...Typography.body, color: Colors.textSecondary },
  detailValue: { ...Typography.bodyStrong, color: Colors.textPrimary, flex: 1, textAlign: 'right' },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: Spacing.xxxl, paddingHorizontal: Spacing.xl },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderStrong, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { ...Typography.h2, color: Colors.textPrimary },
  modalCompany: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  notifIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { ...Typography.bodyStrong, color: Colors.textPrimary },
  notifBody: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  notifTime: { ...Typography.tiny, color: Colors.textTertiary, marginTop: 4 },
  modalBody: { paddingVertical: Spacing.md },
  modalDesc: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  modalNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, paddingVertical: 15, marginTop: Spacing.md },
  modalNoteOk: { backgroundColor: Colors.successLight },
  modalNoteText: { ...Typography.bodyStrong, color: Colors.dangerText },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 16, marginTop: Spacing.md, ...Shadows.accent },
  applyBtnText: { color: '#fff', ...Typography.button, fontSize: 17 },
});
