import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useUpdateEmployerProfileMutation, useVerifyGstMutation } from '../../store/api/employerApi';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Input } from '../../components/common/Input';
import { ChipGroup } from '../../components/common/ChipGroup';
import { Button } from '../../components/common/Button';
import { AlertCard } from '../../components/common/AlertCard';
import { Colors, Spacing, Typography } from '../../theme';

const ENTITY_TYPES = [
  { value: 'pvt_ltd', label: 'Pvt. Ltd.' },
  { value: 'llp', label: 'LLP' },
  { value: 'proprietor', label: 'Proprietor' },
  { value: 'individual', label: 'Individual' },
  { value: 'household', label: 'Household' },
];

export function EmployerRegistrationScreen({ navigation }: any) {
  const [entityType, setEntityType] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [tan, setTan] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [error, setError] = useState('');

  const [updateProfile, { isLoading }] = useUpdateEmployerProfileMutation();

  const isHousehold = entityType[0] === 'household';

  const handleSave = async () => {
    if (!companyName || !entityType[0]) {
      setError('Company name and entity type are required');
      return;
    }
    setError('');
    try {
      await updateProfile({
        company_name: companyName,
        entity_type: entityType[0],
        gst_number: gst || undefined,
        pan_number: pan || undefined,
        tan_number: tan || undefined,
        registered_address: address,
        city,
        state,
        pincode,
        contact_name: contactName,
        contact_mobile: contactMobile,
      }).unwrap();
      navigation.navigate('EmployerTabs');
    } catch {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <ProgressBar current={1} total={4} label="Step 1 of 4" />
        <Text style={styles.title}>Register as Employer</Text>
        {error ? <AlertCard type="danger" message={error} /> : null}

        <Text style={styles.label}>Entity Type</Text>
        <ChipGroup options={ENTITY_TYPES} selected={entityType} onToggle={(v) => setEntityType([v])} multiSelect={false} />

        <Input label="Company / Organisation Name" value={companyName} onChangeText={setCompanyName} placeholder="e.g. ABC Pvt. Ltd." />
        {!isHousehold && (
          <Input label="GST Number (Optional)" value={gst} onChangeText={(v) => setGst(v.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} autoCapitalize="characters" />
        )}
        <Input label="PAN Number" value={pan} onChangeText={(v) => setPan(v.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} autoCapitalize="characters" />
        {!isHousehold && (
          <Input label="TAN Number (Optional)" value={tan} onChangeText={setTan} placeholder="ABCD01234E" />
        )}
        <Input label="Registered Address" value={address} onChangeText={setAddress} multiline />
        <Input label="City" value={city} onChangeText={setCity} />
        <Input label="State" value={state} onChangeText={setState} />
        <Input label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
        <Input label="HR / Contact Name" value={contactName} onChangeText={setContactName} />
        <Input label="Contact Mobile" value={contactMobile} onChangeText={setContactMobile} keyboardType="phone-pad" maxLength={10} />

        <Button title="Register & Continue" onPress={handleSave} loading={isLoading} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { padding: Spacing.xxl },
  title: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.lg },
  label: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs },
  btn: { marginTop: Spacing.xl },
});
