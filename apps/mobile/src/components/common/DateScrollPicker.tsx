import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Colors } from '../../theme';

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

export function DateScrollPicker({ label, value, onChange, minYear = 1970, maxYear = 2030, monthOnly = false }: Props) {
  const [visible, setVisible] = useState(false);

  // Parse current value
  const parsed = value ? value.split('-') : [];
  const [year, setYear] = useState(parseInt(parsed[0] ?? '2000', 10));
  const [month, setMonth] = useState(parseInt(parsed[1] ?? '1', 10));
  const [day, setDay] = useState(parseInt(parsed[2] ?? '1', 10));

  const years = range(minYear, maxYear);
  const months = range(1, 12);
  const days = range(1, daysInMonth(year, month));

  const yearIdx = years.indexOf(year);
  const monthIdx = months.indexOf(month);
  const dayIdx = Math.min(day - 1, days.length - 1);

  const formatted = monthOnly
    ? `${year}-${String(month).padStart(2, '0')}`
    : value || 'Select date';

  const displayValue = monthOnly
    ? (value ? `${MONTHS[month - 1]} ${year}` : 'Select month & year')
    : (value ? `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}` : 'Select date');

  const handleDone = () => {
    const mm = String(month).padStart(2, '0');
    const dd = String(Math.min(day, daysInMonth(year, month))).padStart(2, '0');
    onChange(monthOnly ? `${year}-${mm}` : `${year}-${mm}-${dd}`);
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
          <Text style={styles.calIcon}>📅</Text>
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
              {/* Month */}
              <Column
                items={months}
                selectedIndex={monthIdx}
                onSelect={(i) => setMonth(months[i])}
                formatter={(v) => MONTHS[v - 1].slice(0, 3)}
              />
              {/* Day (only if not monthOnly) */}
              {!monthOnly && (
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
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#fff',
  },
  inputText: { fontSize: 16, color: Colors.textPrimary, flex: 1 },
  placeholder: { color: '#94A3B8' },
  calIcon: { fontSize: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cancelBtn: { fontSize: 16, color: Colors.textSecondary },
  doneBtn: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  columns: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
});
