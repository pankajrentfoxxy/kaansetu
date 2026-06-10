import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Colors, Shadows, Typography } from '../theme';
import { t } from '../utils/i18n';

// Auth Screens
import { SplashLanguageScreen } from '../screens/worker/SplashLanguageScreen';
import { MobileOtpScreen } from '../screens/worker/MobileOtpScreen';

// Worker Screens
import { PersonalDetailsScreen } from '../screens/worker/PersonalDetailsScreen';
import { OccupationSkillsScreen } from '../screens/worker/OccupationSkillsScreen';
import { WorkHistoryScreen } from '../screens/worker/WorkHistoryScreen';
import { LocationPreferencesScreen } from '../screens/worker/LocationPreferencesScreen';
import { KycVerificationScreen } from '../screens/worker/KycVerificationScreen';
import { WorkerDashboardScreen } from '../screens/worker/WorkerDashboardScreen';
import { ProfileScreen } from '../screens/worker/ProfileScreen';
import { ProfileBlockedScreen } from '../screens/worker/ProfileBlockedScreen';

// Employer Screens
import { EmployerRegistrationScreen } from '../screens/employer/EmployerRegistrationScreen';
import { EmployerVerificationScreen } from '../screens/employer/EmployerVerificationScreen';
import { EmployerDashboardScreen } from '../screens/employer/EmployerDashboardScreen';
import { PostRequirementScreen } from '../screens/employer/PostRequirementScreen';
import { MatchedProfilesScreen } from '../screens/employer/MatchedProfilesScreen';
import { WorkerDetailScreen } from '../screens/employer/WorkerDetailScreen';
import { CaseAlertScreen } from '../screens/employer/CaseAlertScreen';
import { HireConfirmedScreen } from '../screens/employer/HireConfirmedScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  const color = focused ? Colors.primary : Colors.textTertiary;
  return (
    <View style={tabStyles.iconWrap}>
      <Ionicons name={(focused ? icon : `${icon}-outline`) as any} size={24} color={color} />
      <Text style={[tabStyles.label, { color }, focused && tabStyles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 72, paddingTop: 6 },
  label: { ...Typography.tiny, marginTop: 3 },
  labelActive: { fontWeight: '700' },
});

const TAB_BAR_STYLE = {
  height: 68,
  paddingBottom: 10,
  paddingTop: 4,
  backgroundColor: Colors.surface,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
  ...Shadows.lg,
};

function WorkerTabs() {
  const lang = useSelector((s: RootState) => s.auth.language);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: TAB_BAR_STYLE, tabBarShowLabel: false }}>
      <Tab.Screen
        name="Home"
        component={WorkerDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="home" label={t('tabHome', lang)} focused={focused} /> }}
      />
      <Tab.Screen
        name="KYC"
        component={KycVerificationScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="shield-checkmark" label={t('tabVerify', lang)} focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="person" label={t('tabProfile', lang)} focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function EmployerTabs() {
  const lang = useSelector((s: RootState) => s.auth.language);
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: TAB_BAR_STYLE, tabBarShowLabel: false }}>
      <Tab.Screen
        name="Home"
        component={EmployerDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="home" label={t('tabHome', lang)} focused={focused} /> }}
      />
      <Tab.Screen
        name="Post"
        component={PostRequirementScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="add-circle" label={t('tabPost', lang)} focused={focused} /> }}
      />
      <Tab.Screen
        name="Verify"
        component={EmployerVerificationScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="shield-checkmark" label={t('tabVerify', lang)} focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashLanguageScreen} />
            <Stack.Screen name="OTP" component={MobileOtpScreen} />
            <Stack.Screen name="EmployerRegistration" component={EmployerRegistrationScreen} />
          </>
        ) : role === 'WORKER' ? (
          <>
            <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
            <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
            <Stack.Screen name="OccupationSkills" component={OccupationSkillsScreen} />
            <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
            <Stack.Screen name="LocationPreferences" component={LocationPreferencesScreen} />
            <Stack.Screen name="KycVerification" component={KycVerificationScreen} />
            <Stack.Screen name="ProfileBlocked" component={ProfileBlockedScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
            <Stack.Screen name="EmployerVerification" component={EmployerVerificationScreen} />
            <Stack.Screen name="PostRequirement" component={PostRequirementScreen} />
            <Stack.Screen name="MatchedProfiles" component={MatchedProfilesScreen} />
            <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
            <Stack.Screen name="CaseAlert" component={CaseAlertScreen} />
            <Stack.Screen name="HireConfirmed" component={HireConfirmedScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
