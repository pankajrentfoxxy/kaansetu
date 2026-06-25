import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Icon } from './Icon';
import { ToggleSwitch } from './ToggleSwitch';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export interface JobFilters {
  maxDistanceKm: number | null; // null = any
  minSalary: number | null;
  urgentOnly: boolean;
  liveInOnly: boolean;
}

export const EMPTY_JOB_FILTERS: JobFilters = {
  maxDistanceKm: null, minSalary: null, urgentOnly: false, liveInOnly: false,
};

export function activeFilterCount(f: JobFilters): number {
  return [f.maxDistanceKm != null, f.minSalary != null, f.urgentOnly, f.liveInOnly].filter(Boolean).length;
}

const DIST = [{ v: null, l: 'Any' }, { v: 5, l: '≤5 km' }, { v: 20, l: '≤20 km' }, { v: 50, l: '≤50 km' }];
const SAL = [{ v: null, l: 'Any' }, { v: 10000, l: '₹10k+' }, { v: 20000, l: '₹20k+' }, { v: 30000, l: '₹30k+' }];

export function JobFilterSheet({
  visible, value, onChange, onClose, en = true,
}: {
  visible: boolean;
  value: JobFilters;
  onChange: (f: JobFilters) => void;
  onClose: () => void;
  en?: boolean;
}) {
  const set = (patch: Partial<JobFilters>) => onChange({ ...value, ...patch });

  const Row = ({ label, opts, selected, onPick }: { label: string; opts: { v: any; l: string }[]; selected: any; onPick: (v: any) => void }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {opts.map((o) => {
          const active = selected === o.v;
          return (
            <TouchableOpacity key={o.l} style={[styles.chip, active && styles.chipActive]} onPress={() => onPick(o.v)} activeOpacity={0.85}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.l}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>{en ? 'Filters' : 'फ़िल्टर'}</Text>
            <TouchableOpacity onPress={() => onChange(EMPTY_JOB_FILTERS)}>
              <Text style={styles.clear}>{en ? 'Clear all' : 'सभी हटाएँ'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Row label={en ? 'Distance' : 'दूरी'} opts={DIST} selected={value.maxDistanceKm} onPick={(v) => set({ maxDistanceKm: v })} />
            <Row label={en ? 'Minimum salary' : 'न्यूनतम वेतन'} opts={SAL} selected={value.minSalary} onPick={(v) => set({ minSalary: v })} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleIcon}><Icon name="flame" size={18} color={Colors.dangerText} /></View>
              <Text style={styles.toggleLabel}>{en ? 'Urgent hiring only' : 'केवल जल्दी भर्ती'}</Text>
              <ToggleSwitch value={value.urgentOnly} onToggle={() => set({ urgentOnly: !value.urgentOnly })} onColor={Colors.danger} />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleIcon}><Icon name="bed-outline" size={18} color={Colors.primary} /></View>
              <Text style={styles.toggleLabel}>{en ? 'Live-in jobs only' : 'केवल रहने वाली नौकरी'}</Text>
              <ToggleSwitch value={value.liveInOnly} onToggle={() => set({ liveInOnly: !value.liveInOnly })} onColor={Colors.primary} />
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.apply} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.applyText}>{en ? 'Show results' : 'परिणाम देखें'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderStrong, alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.textPrimary },
  clear: { ...Typography.bodyStrong, color: Colors.primary },
  label: { ...Typography.bodyStrong, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 9 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.captionStrong, color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  toggleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { ...Typography.bodyStrong, color: Colors.textPrimary, flex: 1 },
  apply: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.xl },
  applyText: { color: '#fff', ...Typography.button },
});
