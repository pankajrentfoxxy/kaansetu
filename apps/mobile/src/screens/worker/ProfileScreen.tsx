import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  useGetWorkerProfileQuery, useGetReferralQuery, useApplyReferralMutation, useRedeemPointsMutation,
} from '../../store/api/workerApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';
import { Avatar } from '../../components/common/Avatar';
import { Colors, Radius, Shadows, Spacing, Typography, jobLabel } from '../../theme';
import { SecureStore } from '../../utils/storage';
import { logout, setLanguage } from '../../store/authSlice';
import { baseApi } from '../../store/api/baseApi';
import { useT } from '../../utils/i18n';

const LANGS = [{ value: 'hi', label: 'हिन्दी' }, { value: 'en', label: 'English' }];

function isActive(until?: string | null) {
  return until ? new Date(until).getTime() > Date.now() : false;
}

export function ProfileScreen({ navigation }: any) {
  const tr = useT();
  const dispatch = useDispatch();
  const lang = useSelector((s: RootState) => s.auth.language);
  const { data: worker, isLoading } = useGetWorkerProfileQuery();
  const { data: referral, refetch: refetchReferral } = useGetReferralQuery();
  const [applyReferral, { isLoading: applying }] = useApplyReferralMutation();
  const [redeemPoints, { isLoading: redeeming }] = useRedeemPointsMutation();
  const [codeInput, setCodeInput] = useState('');

  if (isLoading) return <LoadingSpinner />;

  const verified = worker?.kyc_status === 'FULLY_VERIFIED';
  const points = referral?.points ?? worker?.points ?? 0;
  const rewards = referral?.rewards ?? { boost: { cost: 200 }, pan_india: { cost: 150 } };

  const handleLogout = () => Alert.alert(tr('logout'), tr('logoutConfirm'), [
    { text: tr('cancel'), style: 'cancel' },
    {
      text: tr('logout'), style: 'destructive', onPress: async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        dispatch(baseApi.util.resetApiState());
        dispatch(logout());
      },
    },
  ]);

  const changeLanguage = async (value: string) => {
    await AsyncStorage.setItem('language', value);
    dispatch(setLanguage(value));
  };

  const shareCode = async () => {
    const code = referral?.code;
    if (!code) return;
    const msg = lang === 'en'
      ? `Join Kaamdhaam and find verified jobs! Use my referral code ${code} to sign up. https://kaamdhaam.com`
      : `Kaamdhaam पर जुड़ें और भरोसेमंद काम पाएँ! मेरा रेफरल कोड ${code} इस्तेमाल करें। https://kaamdhaam.com`;
    try { await Share.share({ message: msg }); } catch {}
  };

  const handleApplyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await applyReferral({ code }).unwrap();
      setCodeInput('');
      refetchReferral();
      Alert.alert('✓', res?.message ?? 'Referral applied');
    } catch (e: any) {
      Alert.alert(tr('error'), e?.data?.error ?? 'Could not apply code');
    }
  };

  const handleRedeem = (reward: 'boost' | 'pan_india', cost: number) => {
    if (points < cost) { Alert.alert(tr('notEnoughPoints'), `${cost} ${tr('points')}`); return; }
    Alert.alert(
      tr('redeem'),
      `${cost} ${tr('points')}?`,
      [
        { text: tr('cancel'), style: 'cancel' },
        {
          text: tr('redeem'), onPress: async () => {
            try { await redeemPoints({ reward }).unwrap(); refetchReferral(); Alert.alert('✓', tr('active7')); }
            catch (e: any) { Alert.alert(tr('error'), e?.data?.error ?? 'Failed'); }
          },
        },
      ],
    );
  };

  const sections = [
    { icon: 'person-outline', label: tr('personalDetails'), screen: 'PersonalDetails' },
    { icon: 'construct-outline', label: tr('occupationSkills'), screen: 'OccupationSkills' },
    { icon: 'briefcase-outline', label: tr('workHistory'), screen: 'WorkHistory' },
    { icon: 'location-outline', label: tr('locationPrefs'), screen: 'LocationPreferences' },
    { icon: 'shield-checkmark-outline', label: tr('verification'), screen: 'KycVerification' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>{tr('myProfile')}</Text>

        {/* Identity card */}
        <View style={styles.identityCard}>
          <Avatar name={worker?.full_name ?? 'You'} size={64} />
          <View style={{ flex: 1, marginLeft: Spacing.lg }}>
            <Text style={styles.name} numberOfLines={1}>{worker?.full_name || tr('addYourName')}</Text>
            <View style={styles.metaRow}>
              <Icon name="call-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{worker?.user?.mobile ?? worker?.location?.city ?? ''}</Text>
            </View>
            <View style={[styles.verifyPill, verified ? styles.verifyOk : styles.verifyPending]}>
              <Icon name={verified ? 'checkmark-circle' : 'time-outline'} size={13} color={verified ? Colors.successText : Colors.warningText} />
              <Text style={[styles.verifyPillText, { color: verified ? Colors.successText : Colors.warningText }]}>
                {verified ? tr('verified') : tr('notVerified')}
              </Text>
            </View>
          </View>
        </View>

        {/* Refer & Earn */}
        <View style={styles.referCard}>
          <View style={styles.referTop}>
            <View style={styles.referIcon}><Icon name="gift" size={22} color={Colors.accentText} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.referTitle}>{tr('referEarn')}</Text>
              <Text style={styles.referSub}>{tr('referEarnSub')}</Text>
            </View>
            <View style={styles.pointsBox}>
              <Text style={styles.pointsNum}>{points}</Text>
              <Text style={styles.pointsLabel}>{tr('points')}</Text>
            </View>
          </View>

          {referral?.code && (
            <View style={styles.codeRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{referral.code}</Text>
                {referral.referrals_count > 0 && (
                  <Text style={styles.referCount}>{referral.referrals_count} {tr('referralsJoined')}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={shareCode} activeOpacity={0.85}>
                <Icon name="share-social" size={16} color="#fff" />
                <Text style={styles.shareBtnText}>{tr('shareCode')}</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.howItWorks}>{tr('howItWorks')}</Text>

          {/* Apply someone's code (only if not already referred) */}
          {referral && !referral.already_referred && (
            <View style={styles.applyRow}>
              <TextInput
                style={styles.codeInput}
                value={codeInput}
                onChangeText={(v) => setCodeInput(v.toUpperCase())}
                placeholder={tr('enterReferralCode')}
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCode} disabled={applying} activeOpacity={0.85}>
                {applying ? <ActivityIndicator color={Colors.primary} size="small" /> : <Text style={styles.applyBtnText}>OK</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Redeem */}
          <Text style={styles.redeemTitle}>{tr('redeemPoints')}</Text>
          <RedeemRow
            icon="rocket" tint={Colors.primary} bg={Colors.primaryLight}
            title={tr('boostProfile')} sub={tr('boostProfileSub')}
            cost={rewards.boost.cost} points={points}
            active={isActive(referral?.boost_until)} activeLabel={tr('active7')} redeemLabel={tr('redeem')}
            onRedeem={() => handleRedeem('boost', rewards.boost.cost)} busy={redeeming}
          />
          <RedeemRow
            icon="earth" tint={Colors.teal} bg={Colors.tealLight}
            title={tr('panIndiaJobs')} sub={tr('panIndiaJobsSub')}
            cost={rewards.pan_india.cost} points={points}
            active={isActive(referral?.pan_india_until)} activeLabel={tr('active7')} redeemLabel={tr('redeem')}
            onRedeem={() => handleRedeem('pan_india', rewards.pan_india.cost)} busy={redeeming}
          />
        </View>

        {/* Editable sections */}
        <Text style={styles.sectionHeading}>{tr('myProfile')}</Text>
        <View style={styles.menuCard}>
          {sections.map((s, i) => (
            <TouchableOpacity
              key={s.screen}
              style={[styles.menuRow, i < sections.length - 1 && styles.menuRowBorder]}
              onPress={() => navigation.navigate(s.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}><Icon name={s.icon} size={20} color={Colors.primary} /></View>
              <Text style={styles.menuLabel}>{s.label}</Text>
              <Icon name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Language */}
        <Text style={styles.sectionHeading}>{tr('language')}</Text>
        <View style={styles.langRow}>
          {LANGS.map((l) => {
            const active = lang === l.value;
            return (
              <TouchableOpacity key={l.value} style={[styles.langChip, active && styles.langChipActive]} onPress={() => changeLanguage(l.value)} activeOpacity={0.85}>
                <Text style={[styles.langChipText, active && styles.langChipTextActive]}>{l.label}</Text>
                {active && <Icon name="checkmark" size={15} color={Colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Icon name="log-out-outline" size={20} color={Colors.dangerText} />
          <Text style={styles.logoutText}>{tr('logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RedeemRow({ icon, tint, bg, title, sub, cost, points, active, activeLabel, redeemLabel, onRedeem, busy }: any) {
  const canAfford = points >= cost;
  return (
    <View style={styles.redeemRow}>
      <View style={[styles.redeemIcon, { backgroundColor: bg }]}><Icon name={icon} size={20} color={tint} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.redeemRowTitle}>{title}</Text>
        <Text style={styles.redeemRowSub}>{sub}</Text>
      </View>
      {active ? (
        <View style={styles.activeTag}><Icon name="checkmark" size={12} color={Colors.successText} /><Text style={styles.activeTagText}>{activeLabel}</Text></View>
      ) : (
        <TouchableOpacity
          style={[styles.redeemBtn, !canAfford && styles.redeemBtnDisabled]}
          onPress={onRedeem}
          disabled={busy || !canAfford}
          activeOpacity={0.85}
        >
          <Text style={[styles.redeemBtnText, !canAfford && { color: Colors.textTertiary }]}>{cost}</Text>
          <Icon name="star" size={11} color={canAfford ? '#fff' : Colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  headerTitle: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.lg },

  identityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  name: { ...Typography.h3, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { ...Typography.caption, color: Colors.textSecondary },
  verifyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  verifyOk: { backgroundColor: Colors.successLight },
  verifyPending: { backgroundColor: Colors.warningLight },
  verifyPillText: { ...Typography.tiny, fontWeight: '700' },

  referCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  referTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  referIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  referTitle: { ...Typography.h3, color: Colors.textPrimary },
  referSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  pointsBox: { alignItems: 'center', backgroundColor: Colors.accentLight, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 6 },
  pointsNum: { ...Typography.h2, color: Colors.accentText },
  pointsLabel: { ...Typography.tiny, color: Colors.accentText },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  codeBox: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', paddingHorizontal: 14, paddingVertical: 10 },
  codeText: { ...Typography.h3, color: Colors.primary, letterSpacing: 2 },
  referCount: { ...Typography.tiny, color: Colors.textSecondary, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 12 },
  shareBtnText: { color: '#fff', ...Typography.captionStrong },
  howItWorks: { ...Typography.caption, color: Colors.textTertiary, marginBottom: Spacing.md },
  applyRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  codeInput: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, minHeight: 46, ...Typography.body, color: Colors.textPrimary },
  applyBtn: { width: 56, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { ...Typography.bodyStrong, color: Colors.primary },
  redeemTitle: { ...Typography.captionStrong, color: Colors.textSecondary, marginBottom: Spacing.sm },
  redeemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  redeemIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  redeemRowTitle: { ...Typography.bodyStrong, color: Colors.textPrimary },
  redeemRowSub: { ...Typography.tiny, color: Colors.textSecondary, marginTop: 1 },
  redeemBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.accent, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  redeemBtnDisabled: { backgroundColor: Colors.surfaceAlt },
  redeemBtnText: { ...Typography.captionStrong, color: '#fff' },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successLight, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  activeTagText: { ...Typography.tiny, fontWeight: '700', color: Colors.successText },

  sectionHeading: { ...Typography.captionStrong, color: Colors.textSecondary, marginBottom: Spacing.sm, marginLeft: 2 },
  menuCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, ...Shadows.sm, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.lg },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  menuLabel: { flex: 1, ...Typography.bodyStrong, color: Colors.textPrimary },
  langRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  langChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 13 },
  langChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  langChipText: { ...Typography.bodyStrong, color: Colors.textSecondary },
  langChipTextActive: { color: Colors.primaryText },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, paddingVertical: 15 },
  logoutText: { ...Typography.bodyStrong, color: Colors.dangerText },
});
