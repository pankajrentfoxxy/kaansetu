import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Icon } from './Icon';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

interface Props {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minYear?: number;
  maxYear?: number;
  /** If true only show year+month (no day) — for work history */
  monthOnly?: boolean;
  /** If true only show year (no month/day) — emits "YYYY". For experience. */
  yearOnly?: boolean;
}

function range(from: number, to: number) {
  const arr: number[] = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function Column({
  items,
  selectedIndex,
  onSelect,
  formatter,
}: {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatter: (v: number) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    // Scroll to selected on mount
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setActiveIndex(clamped);
    onSelect(clamped);
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={col.wrap}>
      {/* Selection highlight */}
      <View style={col.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {items.map((item, i) => (
          <View key={item} style={col.item}>
            <Text style={[col.text, i === activeIndex && col.textActive]}>
              {formatter(item)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const col = StyleSheet.create({
  wrap: { flex: 1, height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: 'hidden' },
  highlight: {
    position: 'absolute', top: ITEM_HEIGHT * 2, left: 0, right: 0,
    height: ITEM_HEIGHT, borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: Colors.primary, zIndex: 1,
  },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: '#999' },
  textActive: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
});

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function DateScrollPicker({ label, value, onChange, minYear = 1970, maxYear = 2030, monthOnly = false, yearOnly = false }: Props) {
  const [visible, setVisible] = useState(false);

  // Parse current value, clamped to the allowed range. When there is no value we
  // default to today (clamped) — never a stray out-of-range year like 2000, which
  // would otherwise be committed if the user opens the picker without scrolling.
  const today = new Date();
  const parsed = value ? value.split('-') : [];
  const defaultYear = clamp(parseInt(parsed[0] ?? '', 10) || today.getFullYear(), minYear, maxYear);
  const defaultMonth = clamp(parseInt(parsed[1] ?? '', 10) || (today.getMonth() + 1), 1, 12);
  const defaultDay = clamp(parseInt(parsed[2] ?? '', 10) || today.getDate(), 1, 31);
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState(defaultDay);

  const years = range(minYear, maxYear);
  const months = range(1, 12);
  const days = range(1, daysInMonth(year, month));

  const yearIdx = years.indexOf(year);
  const monthIdx = months.indexOf(month);
  const dayIdx = Math.min(day - 1, days.length - 1);

  const formatted = monthOnly
    ? `${year}-${String(month).padStart(2, '0')}`
    : value || 'Select date';

  const displayValue = yearOnly
    ? (value ? `${year}` : 'Select year')
    : monthOnly
    ? (value ? `${MONTHS[month - 1]} ${year}` : 'Select month & year')
    : (value ? `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}` : 'Select date');

  const handleDone = () => {
    const safeYear = clamp(year, minYear, maxYear);
    const safeMonth = clamp(month, 1, 12);
    const mm = String(safeMonth).padStart(2, '0');
    const dd = String(Math.min(day, daysInMonth(safeYear, safeMonth))).padStart(2, '0');
    onChange(yearOnly ? `${safeYear}` : monthOnly ? `${safeYear}-${mm}` : `${safeYear}-${mm}-${dd}`);
    setVisible(false);
  };

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.input} onPress={() => setVisible(true)} activeOpacity={0.7}>
          <Text style={[styles.inputText, !value && styles.placeholder]}>
            {displayValue}
          </Text>
          <Icon name="calendar-outline" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={handleDone}>
                <Text style={styles.doneBtn}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.columns}>
              {/* Month (hidden in yearOnly) */}
              {!yearOnly && (
                <Column
                  items={months}
                  selectedIndex={monthIdx}
                  onSelect={(i) => setMonth(months[i])}
                  formatter={(v) => MONTHS[v - 1].slice(0, 3)}
                />
              )}
              {/* Day (only full-date mode) */}
              {!monthOnly && !yearOnly && (
                <Column
                  items={days}
                  selectedIndex={dayIdx}
                  onSelect={(i) => setDay(days[i])}
                  formatter={(v) => String(v).padStart(2, '0')}
                />
              )}
              {/* Year */}
              <Column
                items={years}
                selectedIndex={Math.max(0, yearIdx)}
                onSelect={(i) => setYear(years[i])}
                formatter={(v) => String(v)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { ...Typography.captionStrong, color: Colors.textSecondary, marginBottom: 6 },
  input: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 16, minHeight: 52, backgroundColor: Colors.surface,
  },
  inputText: { ...Typography.bodyLg, color: Colors.textPrimary, flex: 1 },
  placeholder: { color: Colors.textTertiary },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: 32 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sheetTitle: { ...Typography.h3, color: Colors.textPrimary },
  cancelBtn: { ...Typography.body, color: Colors.textSecondary },
  doneBtn: { ...Typography.bodyStrong, color: Colors.primary },
  columns: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
});
