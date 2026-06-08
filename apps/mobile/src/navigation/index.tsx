import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SecureStore } from '../utils/storage';
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
import { EmployerDashboardScreen } from '../screens/employer/EmployerDashboardScreen';
import { PostRequirementScreen } from '../screens/employer/PostRequirementScreen';
import { MatchedProfilesScreen } from '../screens/employer/MatchedProfilesScreen';
import { WorkerDetailScreen } from '../screens/employer/WorkerDetailScreen';
import { CaseAlertScreen } from '../screens/employer/CaseAlertScreen';
import { HireConfirmedScreen } from '../screens/employer/HireConfirmedScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function WorkerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
      }}
    >
      <Tab.Screen name="Home" component={WorkerDashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: () => null }} />
      <Tab.Screen name="Alerts" component={KycVerificationScreen} options={{ tabBarLabel: 'Alerts' }} />
    </Tab.Navigator>
  );
}

function EmployerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
      }}
    >
      <Tab.Screen name="Home" component={EmployerDashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Post" component={PostRequirementScreen} options={{ tabBarLabel: 'Post' }} />
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
