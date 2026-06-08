import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Colors } from '../theme';

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

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  emoji: { fontSize: 20 },
  label: { fontSize: 10, color: Colors.textTertiary, marginTop: 2, fontWeight: '500' },
  labelActive: { color: Colors.primary, fontWeight: '700' },
});

const TAB_BAR_STYLE = {
  height: 64,
  paddingBottom: 8,
  paddingTop: 4,
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#E2E8F0',
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 8,
};

function WorkerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={WorkerDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="KYC"
        component={KycVerificationScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Verify" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function EmployerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={EmployerDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostRequirementScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="➕" label="Post" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Verify"
        component={EmployerVerificationScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔐" label="Verify" focused={focused} />,
        }}
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
