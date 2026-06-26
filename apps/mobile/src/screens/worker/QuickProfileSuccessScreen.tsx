import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Icon } from '../../components/common/Icon';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export function QuickProfileSuccessScreen({ navigation }: any) {
  const en = useSelector((s: RootState) => s.auth.language) === 'en';
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        {/* faint decorative icons for a confetti feel (no new assets) */}
        <Icon name="briefcase" size={26} color={Colors.primaryLight} style={[styles.deco, { top: 40, left: 50 }]} />
        <Icon name="star" size={22} color={Colors.accentLight} style={[styles.deco, { top: 90, right: 56 }]} />
        <Icon name="location" size={24} color={Colors.successLight} style={[styles.deco, { top: 160, left: 40 }]} />
        <Icon name="star" size={18} color={Colors.accentLight} style={[styles.deco, { bottom: 220, right: 44 }]} />

        <View style={styles.badge}>
          <Icon name="checkmark" size={56} color="#fff" />
        </View>
        <Text style={styles.title}>🎉 {en ? 'Profile created!' : 'Profile ban gayi!'}</Text>
        <Text style={styles.sub}>{en ? "You're all set to start getting job calls." : 'अब आपको नौकरी की कॉल आना शुरू हो जाएँगी।'}</Text>

        <View style={styles.tip}>
          <AlertCard
            type="info"
            message={en ? 'Complete your profile to get more calls from employers.' : 'Profile complete karo, zyada calls aayengi.'}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Button title={en ? 'Proceed' : 'आगे बढ़ें'} onPress={() => navigation.replace('WorkerTabs')} icon="arrow-forward" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  deco: { position: 'absolute', opacity: 0.9 },
  badge: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...({ shadowColor: Colors.success, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }) },
  title: { ...Typography.h1, color: Colors.accent, textAlign: 'center', marginBottom: 8 },
  sub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  tip: { width: '100%' },
  footer: { padding: Spacing.xl, paddingTop: Spacing.md },
});
