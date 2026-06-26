import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useUpdatePersonalMutation } from '../../store/api/workerApi';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

export function QuickNameScreen({ navigation }: any) {
  const en = useSelector((s: RootState) => s.auth.language) === 'en';
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [updatePersonal, { isLoading }] = useUpdatePersonalMutation();

  const next = async () => {
    if (name.trim().length < 2) { setError(en ? 'Please enter your name' : 'कृपया अपना नाम दर्ज करें'); return; }
    setError('');
    try {
      await updatePersonal({ full_name: name.trim() }).unwrap();
      navigation.navigate('QuickJob');
    } catch {
      setError(en ? 'Could not save. Try again.' : 'सेव नहीं हुआ। फिर कोशिश करें।');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={en ? 'Create profile' : 'प्रोफ़ाइल बनाएँ'} subtitle={en ? 'Step 1 of 5' : 'स्टेप 1 / 5'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ProgressBar current={1} total={5} />
          <Text style={styles.q}>{en ? "What's your name?" : 'Aapka naam kya hai?'}</Text>
          <Text style={styles.sub}>{en ? 'This is how employers will see you.' : 'नियोक्ता आपको इसी नाम से देखेंगे।'}</Text>
          {error ? <AlertCard type="danger" message={error} /> : null}
          <Input value={name} onChangeText={setName} placeholder={en ? 'e.g. Ramesh Kumar' : 'जैसे रमेश कुमार'} icon="person-outline" autoFocus />
        </ScrollView>
        <View style={styles.footer}>
          <Button title={en ? 'Continue' : 'आगे बढ़ें'} onPress={next} loading={isLoading} icon="arrow-forward" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xl, paddingTop: Spacing.lg },
  q: { ...Typography.h1, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: 6 },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl },
  footer: { padding: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
});
