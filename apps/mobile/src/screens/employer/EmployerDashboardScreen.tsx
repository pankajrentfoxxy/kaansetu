import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Icon } from '../../components/common/Icon';
import { JobIcon } from '../../components/common/JobIcon';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Colors, Radius, Shadows, Spacing, Typography, jobLabel } from '../../theme';
import { SecureStore } from '../../utils/storage';
import { logout } from '../../store/authSlice';
import { baseApi } from '../../store/api/baseApi';

function formatSalary(n: number) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
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
  const verifications: any[] = employer?.verifications ?? [];
  const isVerified = verifications.some((v: any) => v.status === 'VERIFIED');

  const handleLogout = () => Alert.alert('Logout?', 'Logout from KaamDhaam', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout', style: 'destructive', onPress: async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        dispatch(baseApi.util.resetApiState());
        dispatch(logout());
      },
    },
  ]);

  const doRefresh = () => { refetchEmp(); refetchReq(); refetchApps(); refetchShortlist(); refetchHires(); };

  if (empLoading) return <LoadingSpinner />;

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'requirements', label: 'Posts', icon: 'list', count: requirements.length },
    { key: 'applications', label: 'Applied', icon: 'mail', count: applications.length },
    { key: 'shortlisted', label: 'Shortlist', icon: 'star', count: shortlisted.length },
    { key: 'hires', label: 'Hired', icon: 'checkmark-circle', count: hires.length },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={doRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Avatar name={employer?.company_name ?? 'Co'} size={52} color="rgba(255,255,255,0.2)" />
            <View style={styles.heroInfo}>
              <Text style={styles.companyName} numberOfLines={1}>{employer?.company_name || 'Your Company'}</Text>
              <View style={styles.heroLocRow}>
                <Icon name="location-sharp" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.companyCity}>{employer?.city ?? 'Add city'}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {unreadAlerts > 0 && (
                <TouchableOpacity style={styles.alertBtn} onPress={() => navigation.navigate('CaseAlert')}>
                  <Icon name="notifications" size={15} color="#fff" />
                  <Text style={styles.alertBtnText}>{unreadAlerts}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleLogout} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="log-out-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {!isVerified ? (
            <TouchableOpacity style={styles.verifyBanner} onPress={() => navigation.navigate('EmployerVerification')} activeOpacity={0.85}>
              <Icon name="shield-half" size={18} color="#FDE68A" />
              <Text style={styles.verifyBannerText}>Business verification pending — tap to verify</Text>
              <Icon name="chevron-forward" size={18} color="#FDE68A" />
            </TouchableOpacity>
          ) : (
            <View style={styles.verifiedBadge}>
              <Icon name="checkmark-circle" size={16} color="#A7F3D0" />
              <Text style={styles.verifiedBadgeText}>Business Verified</Text>
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <StatCard icon="list" tint={Colors.primary} bg={Colors.primaryLight} value={activeReqs.length} label="Active Posts" />
          <StatCard icon="mail" tint={Colors.warningDark} bg={Colors.warningLight} value={applications.length} label="Applications" />
          <StatCard icon="checkmark-circle" tint={Colors.successDark} bg={Colors.successLight} value={hires.length} label="Hired" />
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickBtn, styles.quickPrimary]} onPress={() => navigation.navigate('PostRequirement')} activeOpacity={0.9}>
            <View style={styles.quickIconLight}><Icon name="add" size={22} color="#fff" /></View>
            <Text style={styles.quickText}>Post Requirement</Text>
            <Text style={styles.quickSub}>Find verified workers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, styles.quickSecondary]} onPress={() => navigation.navigate('EmployerVerification')} activeOpacity={0.9}>
            <View style={styles.quickIconDark}><Icon name="shield-checkmark" size={22} color={Colors.primary} /></View>
            <Text style={[styles.quickText, { color: Colors.primary }]}>Verification</Text>
            <Text style={[styles.quickSub, { color: Colors.textSecondary }]}>Verify your business</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tabs ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
          {tabs.map((tb) => {
            const active = activeTab === tb.key;
            return (
              <TouchableOpacity key={tb.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveTab(tb.key)} activeOpacity={0.85}>
                <Icon name={active ? tb.icon : `${tb.icon}-outline`} size={16} color={active ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tb.label}{tb.count ? ` ${tb.count}` : ''}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Requirements ── */}
        {activeTab === 'requirements' && (
          reqLoading ? <LoadingSpinner inline /> : requirements.length === 0 ? (
            <EmptyState icon="list-outline" message="No requirements posted" subMessage="Post your first requirement to find verified workers" actionLabel="Post Requirement" onAction={() => navigation.navigate('PostRequirement')} />
          ) : (
            requirements.map((req: any) => (
              <TouchableOpacity key={req.id} style={styles.rowCard} onPress={() => navigation.navigate('MatchedProfiles', { requirementId: req.id })} activeOpacity={0.85}>
                <JobIcon jobType={req.job_type} size={48} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{jobLabel(req.job_type, 'en')}</Text>
                  <View style={styles.rowMetaRow}>
                    <Icon name="location-outline" size={13} color={Colors.textTertiary} />
                    <Text style={styles.rowMeta}>{req.city ?? 'Pan India'}</Text>
                  </View>
                  <Text style={styles.rowSalary}>{formatSalary(req.salary_min ?? 0)} – {formatSalary(req.salary_max ?? 0)}/mo</Text>
                </View>
                <View style={styles.rowRight}>
                  <StatusBadge status={req.status === 'ACTIVE' ? 'active' : 'pending'} customLabel={req.status === 'ACTIVE' ? 'Active' : req.status} />
                  <Text style={styles.matchCount}>{req._count?.matches ?? 0} matches</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        )}

        {/* ── Applications ── */}
        {activeTab === 'applications' && (
          applications.length === 0 ? (
            <EmptyState icon="mail-outline" message="No applications yet" subMessage="Workers who apply for your jobs will appear here." />
          ) : (
            applications.map((app: any) => {
              const worker = app.worker ?? {};
              const reqId = app.data?.requirement_id ?? app.requirement_id;
              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.rowCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('WorkerDetail', { worker, requirementId: reqId })}
                >
                  <Avatar name={worker.full_name ?? '?'} size={46} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{worker.full_name ?? 'Worker'}</Text>
                    <View style={styles.rowMetaRow}>
                      <Icon name="location-outline" size={13} color={Colors.textTertiary} />
                      <Text style={styles.rowMeta}>{worker.location?.city ?? 'N/A'}</Text>
                    </View>
                    {(worker.skills?.length ?? 0) > 0 && (
                      <Text style={styles.rowSkill}>{jobLabel(worker.skills[0]?.skill_type, 'en')}</Text>
                    )}
                  </View>
                  <View style={styles.rowRight}>
                    <StatusBadge status="in_progress" customLabel="Applied" />
                    <View style={styles.hireNow}>
                      <Text style={styles.hireNowText}>View</Text>
                      <Icon name="chevron-forward" size={13} color={Colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )
        )}

        {/* ── Shortlisted ── */}
        {activeTab === 'shortlisted' && (
          shortlisted.length === 0 ? (
            <EmptyState icon="star-outline" message="No shortlisted workers" subMessage="Shortlist workers from matched profiles to see them here." />
          ) : (
            shortlisted.map((sl: any) => {
              const worker = sl.worker ?? {};
              return (
                <TouchableOpacity key={sl.id} style={styles.rowCard} activeOpacity={0.85}
                  onPress={() => navigation.navigate('HireConfirmed', { workerId: worker.id, workerName: worker.full_name, requirementId: sl.requirement_id })}>
                  <Avatar name={worker.full_name ?? '?'} size={46} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{worker.full_name ?? 'Worker'}</Text>
                    <View style={styles.rowMetaRow}>
                      <Icon name="location-outline" size={13} color={Colors.textTertiary} />
                      <Text style={styles.rowMeta}>{worker.location?.city ?? 'N/A'}</Text>
                    </View>
                    {(worker.skills?.length ?? 0) > 0 && (
                      <Text style={styles.rowSkill}>{jobLabel(worker.skills[0]?.skill_type, 'en')}</Text>
                    )}
                  </View>
                  <View style={styles.rowRight}>
                    <StatusBadge status="pending" customLabel="Shortlisted" />
                    <View style={styles.hireNow}>
                      <Text style={styles.hireNowText}>Hire Now</Text>
                      <Icon name="arrow-forward" size={13} color={Colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )
        )}

        {/* ── Hires ── */}
        {activeTab === 'hires' && (
          hires.length === 0 ? (
            <EmptyState icon="checkmark-circle-outline" message="No hires yet" subMessage="Workers you hire will appear here." />
          ) : (
            hires.map((hire: any) => {
              const worker = hire.worker ?? {};
              const statusMap: Record<string, { s: any; l: string }> = {
                OFFER_SENT: { s: 'pending', l: 'Offer Sent' },
                EMPLOYER_SIGNED: { s: 'in_progress', l: 'Signed' },
                ACTIVE: { s: 'active', l: 'Active' },
                TERMINATED: { s: 'rejected', l: 'Ended' },
              };
              const sm = statusMap[hire.status] ?? { s: 'in_progress', l: hire.status };
              const isOfferSent = hire.status === 'OFFER_SENT';
              return (
                <View key={hire.id} style={[styles.rowCard, { alignItems: 'flex-start' }]}>
                  <Avatar name={worker.full_name ?? '?'} size={46} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{worker.full_name ?? 'Worker'}</Text>
                    {hire.offer_salary && <Text style={styles.rowSalary}>₹{Number(hire.offer_salary).toLocaleString('en-IN')}/mo</Text>}
                    {hire.start_date && (
                      <View style={styles.rowMetaRow}>
                        <Icon name="calendar-outline" size={13} color={Colors.textTertiary} />
                        <Text style={styles.rowMeta}>Joining {formatDate(hire.start_date)}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.rowRight}>
                    <StatusBadge status={sm.s} customLabel={sm.l} />
                    {isOfferSent && (
                      <TouchableOpacity style={styles.esignBtn}
                        onPress={() => navigation.navigate('HireConfirmed', { workerId: worker.id, workerName: worker.full_name, requirementId: hire.requirement_id, _hireId: hire.id, offerSalary: hire.offer_salary, startDate: hire.start_date })}>
                        <Icon name="create-outline" size={14} color="#fff" />
                        <Text style={styles.esignBtnText}>E-Sign</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )
        )}

        {/* ── Case alerts ── */}
        {unreadAlerts > 0 && (
          <TouchableOpacity style={styles.caseAlert} onPress={() => navigation.navigate('CaseAlert')} activeOpacity={0.9}>
            <View style={styles.caseAlertIcon}><Icon name="warning" size={20} color={Colors.warningDark} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.caseAlertTitle}>{unreadAlerts} Case Alert{unreadAlerts > 1 ? 's' : ''}</Text>
              <Text style={styles.caseAlertSub}>Worker flagged — action required</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={Colors.warningDark} />
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, tint, bg, value, label }: { icon: string; tint: string; bg: string; value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Icon name={icon} size={20} color={tint} />
      </View>
      <Text style={[styles.statNum, { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  hero: { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.primary },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  heroInfo: { flex: 1, marginLeft: Spacing.md },
  companyName: { color: '#fff', ...Typography.h3, fontWeight: '700' },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  companyCity: { color: 'rgba(255,255,255,0.85)', ...Typography.caption },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.danger, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  alertBtnText: { color: '#fff', ...Typography.tiny, fontWeight: '700' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 11 },
  verifyBannerText: { flex: 1, color: '#FDE68A', ...Typography.captionStrong },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start' },
  verifiedBadgeText: { color: '#A7F3D0', ...Typography.captionStrong },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
  statIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNum: { ...Typography.h1, fontWeight: '800' },
  statLabel: { ...Typography.tiny, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },

  quickActions: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  quickBtn: { flex: 1, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm },
  quickPrimary: { backgroundColor: Colors.primary },
  quickSecondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  quickIconLight: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  quickIconDark: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  quickText: { ...Typography.bodyStrong, color: '#fff', marginBottom: 2 },
  quickSub: { ...Typography.caption, color: 'rgba(255,255,255,0.75)' },

  tabsScroll: { marginBottom: Spacing.md, overflow: 'visible' },
  tabsRow: { gap: 8, paddingRight: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.captionStrong, color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  rowCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  rowInfo: { flex: 1, marginLeft: Spacing.md },
  rowTitle: { ...Typography.bodyStrong, color: Colors.textPrimary },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  rowMeta: { ...Typography.caption, color: Colors.textSecondary },
  rowSalary: { ...Typography.captionStrong, color: Colors.primary, marginTop: 3 },
  rowSkill: { ...Typography.caption, color: Colors.primary, marginTop: 2, fontWeight: '600', textTransform: 'capitalize' },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  matchCount: { ...Typography.caption, color: Colors.textTertiary },
  hireNow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hireNowText: { ...Typography.captionStrong, color: Colors.primary },
  esignBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 7 },
  esignBtnText: { color: '#fff', ...Typography.tiny, fontWeight: '700' },

  caseAlert: { backgroundColor: Colors.warningLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F2D49B' },
  caseAlertIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F7E2B7', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  caseAlertTitle: { ...Typography.bodyStrong, color: Colors.warningText },
  caseAlertSub: { ...Typography.caption, color: Colors.warningDark, marginTop: 2 },
});
