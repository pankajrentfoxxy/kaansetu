import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import {
  useGetEmployerProfileQuery,
  useGetRequirementsQuery,
  useGetCaseAlertsQuery,
  useGetApplicationsQuery,
  useGetShortlistQuery,
  useGetHiresQuery,
} from '../../store/api/employerApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Colors, Spacing, Typography } from '../../theme';
import { SecureStore } from '../../utils/storage';
import { logout } from '../../store/authSlice';
import { baseApi } from '../../store/api/baseApi';

const JOB_ICONS: Record<string, string> = {
  driver: '🚗', security_guard: '🛡️', cook: '🍳', housekeeper: '🏠',
  delivery: '📦', electrician: '🔧', plumber: '🔩', peon: '📋', sweeper: '🧹', helper: '👤',
};

function formatSalary(n: number) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

function getInitials(name: string) {
  return (name || 'KS').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDate(dateStr: string) {
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}

type Tab = 'requirements' | 'applications' | 'shortlisted' | 'hires';

export function EmployerDashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { data: employer, isLoading: empLoading, refetch: refetchEmp } = useGetEmployerProfileQuery();
  const { data: requirements = [], isLoading: reqLoading, refetch: refetchReq } = useGetRequirementsQuery();
  const { data: alerts = [] } = useGetCaseAlertsQuery();
  const { data: applications = [], refetch: refetchApps } = useGetApplicationsQuery();
  const { data: shortlisted = [], refetch: refetchShortlist } = useGetShortlistQuery();
  const { data: hires = [], refetch: refetchHires } = useGetHiresQuery();
  const [activeTab, setActiveTab] = useState<Tab>('requirements');

  const unreadAlerts = alerts.filter((a: any) => !a.employer_action).length;
  const activeReqs = requirements.filter((r: any) => r.status === 'ACTIVE');
  const totalMatches = requirements.reduce((sum: number, r: any) => sum + (r._count?.matches ?? 0), 0);
  const verifications: any[] = employer?.verifications ?? [];
  const isVerified = verifications.some((v: any) => v.status === 'VERIFIED');

  const handleLogout = () => Alert.alert('लॉगआउट करें?', 'Logout from KaamSetu', [
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

  const doRefresh = () => { refetchEmp(); refetchReq(); refetchApps(); refetchShortlist(); refetchHires(); };

  if (empLoading) return <LoadingSpinner />;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'requirements', label: '📋 Posts', count: requirements.length },
    { key: 'applications', label: '📨 Applied', count: applications.length },
    { key: 'shortlisted', label: '⭐ Shortlist', count: shortlisted.length },
    { key: 'hires', label: '✅ Hired', count: hires.length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={doRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.companyAvatar}>
              <Text style={styles.companyAvatarText}>{getInitials(employer?.company_name ?? 'Co')}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.companyName} numberOfLines={1}>{employer?.company_name || 'Your Company'}</Text>
              <Text style={styles.companyType}>{employer?.entity_type?.replace(/_/g, ' ') ?? 'Business'}</Text>
              <Text style={styles.companyCity}>📍 {employer?.city ?? 'Add city'}</Text>
            </View>
            <View style={styles.headerRight}>
              {unreadAlerts > 0 && (
                <TouchableOpacity style={styles.alertBtn} onPress={() => navigation.navigate('CaseAlert')}>
                  <Text style={styles.alertBtnText}>🔔 {unreadAlerts}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.logoutIcon}>⎋</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isVerified ? (
            <TouchableOpacity style={styles.verifyBanner} onPress={() => navigation.navigate('EmployerVerification')}>
              <Text style={styles.verifyBannerText}>⚠️ Business verification pending — Tap to verify</Text>
              <Text style={styles.verifyBannerArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✅ Business Verified</Text>
            </View>
          )}
        </View>

        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EBF5FF' }]}>
            <Text style={styles.statIcon}>📋</Text>
            <Text style={[styles.statNum, { color: Colors.primary }]}>{activeReqs.length}</Text>
            <Text style={styles.statLabel}>Active Posts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={styles.statIcon}>📨</Text>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{applications.length}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FFF4' }]}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={[styles.statNum, { color: '#16A34A' }]}>{hires.length}</Text>
            <Text style={styles.statLabel}>Hired</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnPrimary]} onPress={() => navigation.navigate('PostRequirement')}>
            <Text style={styles.quickBtnIcon}>➕</Text>
            <Text style={styles.quickBtnText}>Post Requirement</Text>
            <Text style={styles.quickBtnSub}>नई ज़रूरत पोस्ट करें</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnSecondary]} onPress={() => navigation.navigate('EmployerVerification')}>
            <Text style={styles.quickBtnIcon}>🔐</Text>
            <Text style={[styles.quickBtnText, { color: Colors.primary }]}>Verification</Text>
            <Text style={[styles.quickBtnSub, { color: Colors.textSecondary }]}>सत्यापन करें</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}{t.count ? ` (${t.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Requirements Tab ── */}
        {activeTab === 'requirements' && (
          <>
            {reqLoading ? <LoadingSpinner /> : requirements.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No requirements posted</Text>
                <Text style={styles.emptyText}>Post your first requirement to find verified workers</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PostRequirement')}>
                  <Text style={styles.emptyBtnText}>+ Post Requirement</Text>
                </TouchableOpacity>
              </View>
            ) : (
              requirements.map((req: any) => (
                <TouchableOpacity
                  key={req.id}
                  style={styles.reqCard}
                  onPress={() => navigation.navigate('MatchedProfiles', { requirementId: req.id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.reqCardLeft}>
                    <View style={styles.reqIconCircle}>
                      <Text style={styles.reqIconText}>{JOB_ICONS[req.job_type] ?? '💼'}</Text>
                    </View>
                    <View style={styles.reqInfo}>
                      <Text style={styles.reqTitle}>{req.job_type?.replace(/_/g, ' ')?.toUpperCase()}</Text>
                      <Text style={styles.reqLocation}>📍 {req.city ?? 'Pan India'}</Text>
                      <Text style={styles.reqSalary}>{formatSalary(req.salary_min ?? 0)} – {formatSalary(req.salary_max ?? 0)}/mo</Text>
                    </View>
                  </View>
                  <View style={styles.reqRight}>
                    <View style={[styles.reqStatus, req.status === 'ACTIVE' ? styles.reqStatusActive : styles.reqStatusInactive]}>
                      <Text style={[styles.reqStatusText, req.status === 'ACTIVE' ? { color: '#166534' } : { color: Colors.textSecondary }]}>{req.status}</Text>
                    </View>
                    <Text style={styles.reqMatches}>{req._count?.matches ?? 0} matches</Text>
                    <Text style={styles.reqArrow}>→</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* ── Applications Tab ── */}
        {activeTab === 'applications' && (
          <>
            {applications.length === 0 ? (
              <EmptyState icon="📭" message="No applications yet" subMessage="Workers who apply for your jobs will appear here." />
            ) : (
              applications.map((app: any) => {
                const worker = app.worker ?? {};
                const data = app.data ?? {};
                return (
                  <View key={app.id} style={styles.workerCard}>
                    <View style={styles.workerCardLeft}>
                      <View style={styles.workerAvatar}>
                        <Text style={styles.workerAvatarText}>{getInitials(worker.full_name ?? '?')}</Text>
                      </View>
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{worker.full_name ?? 'Worker'}</Text>
                        <Text style={styles.workerLocation}>📍 {worker.location?.city ?? 'N/A'}</Text>
                        {(worker.skills?.length ?? 0) > 0 && (
                          <Text style={styles.workerSkill}>
                            {JOB_ICONS[worker.skills[0]?.skill_type] ?? '💼'} {worker.skills[0]?.skill_type?.replace(/_/g, ' ')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.workerCardRight}>
                      <View style={styles.appliedBadge}><Text style={styles.appliedBadgeText}>📨 Applied</Text></View>
                      {app.created_at && <Text style={styles.appliedDate}>{formatDate(app.created_at)}</Text>}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── Shortlisted Tab ── */}
        {activeTab === 'shortlisted' && (
          <>
            {shortlisted.length === 0 ? (
              <EmptyState icon="⭐" message="No shortlisted workers" subMessage="Shortlist workers from matched profiles to see them here." />
            ) : (
              shortlisted.map((sl: any) => {
                const worker = sl.worker ?? {};
                return (
                  <TouchableOpacity
                    key={sl.id}
                    style={styles.workerCard}
                    onPress={() => navigation.navigate('HireConfirmed', {
                      workerId: worker.id,
                      workerName: worker.full_name,
                      requirementId: sl.requirement_id,
                    })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.workerCardLeft}>
                      <View style={styles.workerAvatar}>
                        <Text style={styles.workerAvatarText}>{getInitials(worker.full_name ?? '?')}</Text>
                      </View>
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{worker.full_name ?? 'Worker'}</Text>
                        <Text style={styles.workerLocation}>📍 {worker.location?.city ?? 'N/A'}</Text>
                        {(worker.skills?.length ?? 0) > 0 && (
                          <Text style={styles.workerSkill}>
                            {JOB_ICONS[worker.skills[0]?.skill_type] ?? '💼'} {worker.skills[0]?.skill_type?.replace(/_/g, ' ')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.workerCardRight}>
                      <View style={styles.shortlistBadge}><Text style={styles.shortlistBadgeText}>⭐ Shortlisted</Text></View>
                      <Text style={styles.hireNowText}>Hire Now →</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* ── Hires Tab ── */}
        {activeTab === 'hires' && (
          <>
            {hires.length === 0 ? (
              <EmptyState icon="✅" message="No hires yet" subMessage="Workers you hire will appear here." />
            ) : (
              hires.map((hire: any) => {
                const worker = hire.worker ?? {};
                const statusColors: Record<string, string> = {
                  OFFER_SENT: '#FEF3C7', EMPLOYER_SIGNED: '#DBEAFE', ACTIVE: '#DCFCE7', TERMINATED: '#FEE2E2',
                };
                const statusLabels: Record<string, string> = {
                  OFFER_SENT: '📤 Offer Sent', EMPLOYER_SIGNED: '✍️ Signed', ACTIVE: '✅ Active', TERMINATED: '❌ Ended',
                };
                const isOfferSent = hire.status === 'OFFER_SENT';
                return (
                  <View key={hire.id} style={styles.hireCard}>
                    <View style={styles.workerCardLeft}>
                      <View style={styles.workerAvatar}>
                        <Text style={styles.workerAvatarText}>{getInitials(worker.full_name ?? '?')}</Text>
                      </View>
                      <View style={styles.workerInfo}>
                        <Text style={styles.workerName}>{worker.full_name ?? 'Worker'}</Text>
                        <Text style={styles.workerLocation}>📍 {worker.location?.city ?? 'N/A'}</Text>
                        {hire.offer_salary && (
                          <Text style={styles.hireSalary}>₹{Number(hire.offer_salary).toLocaleString('en-IN')}/month</Text>
                        )}
                        {hire.start_date && (
                          <Text style={styles.hireStartDate}>📅 Joining: {formatDate(hire.start_date)}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.workerCardRight}>
                      <View style={[styles.hireStatusBadge, { backgroundColor: statusColors[hire.status] ?? '#F1F5F9' }]}>
                        <Text style={styles.hireStatusText}>{statusLabels[hire.status] ?? hire.status}</Text>
                      </View>
                      {isOfferSent && (
                        <TouchableOpacity
                          style={styles.esignBtn}
                          onPress={() => navigation.navigate('HireConfirmed', {
                            workerId: worker.id,
                            workerName: worker.full_name,
                            requirementId: hire.requirement_id,
                            _hireId: hire.id, // pre-fill to skip to e-sign step
                          })}
                        >
                          <Text style={styles.esignBtnText}>✍️ E-Sign</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── Case Alerts ── */}
        {unreadAlerts > 0 && (
          <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('CaseAlert')}>
            <Text style={styles.alertCardIcon}>⚠️</Text>
            <View style={styles.alertCardInfo}>
              <Text style={styles.alertCardTitle}>{unreadAlerts} Case Alert{unreadAlerts > 1 ? 's' : ''}</Text>
              <Text style={styles.alertCardSub}>Worker flagged — action required</Text>
            </View>
            <Text style={styles.alertCardArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  scroll: { padding: 16, paddingBottom: 32 },

  // Hero
  heroCard: { backgroundColor: '#1A56A0', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#1A56A0', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  companyAvatar: { width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  companyAvatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroInfo: { flex: 1 },
  companyName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  companyType: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textTransform: 'capitalize', marginTop: 1 },
  companyCity: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  alertBtn: { backgroundColor: '#EF4444', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  alertBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutIcon: { color: '#fff', fontSize: 18 },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  verifyBannerText: { flex: 1, color: '#FDE68A', fontSize: 13, fontWeight: '600' },
  verifyBannerArrow: { color: '#FDE68A', fontSize: 18, fontWeight: '700' },
  verifiedBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  verifiedBadgeText: { color: '#A7F3D0', fontSize: 13, fontWeight: '700' },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginTop: 2, textAlign: 'center' },

  // Quick Actions
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickBtn: { flex: 1, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  quickBtnPrimary: { backgroundColor: Colors.primary },
  quickBtnSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primaryLight },
  quickBtnIcon: { fontSize: 22, marginBottom: 6 },
  quickBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  quickBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  // Tabs
  tabsScroll: { marginBottom: 14 },
  tabsRow: { gap: 8, paddingRight: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E2E8F0' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  // Empty
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, marginBottom: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Requirement Card
  reqCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E8EEF4', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  reqCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  reqIconCircle: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  reqIconText: { fontSize: 24 },
  reqInfo: { flex: 1 },
  reqTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.3 },
  reqLocation: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  reqSalary: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  reqRight: { alignItems: 'flex-end', gap: 4 },
  reqStatus: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  reqStatusActive: { backgroundColor: '#DCFCE7' },
  reqStatusInactive: { backgroundColor: '#F1F5F9' },
  reqStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  reqMatches: { fontSize: 12, color: Colors.textSecondary },
  reqArrow: { fontSize: 16, color: Colors.primary, fontWeight: '700' },

  // Worker Cards (applications / shortlist)
  workerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E8EEF4', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  workerCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  workerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  workerAvatarText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  workerLocation: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  workerSkill: { fontSize: 12, color: Colors.primary, marginTop: 2, fontWeight: '600', textTransform: 'capitalize' },
  workerCardRight: { alignItems: 'flex-end', gap: 6 },
  appliedBadge: { backgroundColor: '#DBEAFE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  appliedBadgeText: { fontSize: 11, fontWeight: '700', color: '#1E40AF' },
  appliedDate: { fontSize: 11, color: Colors.textTertiary },
  shortlistBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  shortlistBadgeText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  hireNowText: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 2 },

  // Hire Cards
  hireCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#E8EEF4', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  hireSalary: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  hireStartDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  hireStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  hireStatusText: { fontSize: 11, fontWeight: '700' },
  esignBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6 },
  esignBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Alert
  alertCard: { backgroundColor: '#FFF7ED', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#FCD34D' },
  alertCardIcon: { fontSize: 28 },
  alertCardInfo: { flex: 1 },
  alertCardTitle: { fontSize: 15, fontWeight: '700', color: '#92400E' },
  alertCardSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
  alertCardArrow: { fontSize: 18, color: '#D97706', fontWeight: '700' },
});
