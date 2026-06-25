import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Press } from './Press';
import { Icon } from './Icon';
import { JobIcon } from './JobIcon';
import { Colors, Radius, Shadows, Spacing, Typography, jobLabel } from '../../theme';
import { salaryRange, timeAgo } from '../../utils/format';

// One job (a `match` row with a nested `requirement`). Shared by the worker
// home feed and the Jobs browse screen.
export function JobCard({ match, lang, onPress, applied }: { match: any; lang: string; onPress: () => void; applied?: boolean }) {
  const req = match.requirement ?? {};
  const en = lang === 'en';
  return (
    <Press style={[styles.card, applied && styles.cardApplied]} onPress={onPress}>
      <View style={styles.top}>
        <JobIcon jobType={req.job_type} size={52} />
        <View style={styles.info}>
          <Text style={styles.title}>{jobLabel(req.job_type, lang)}</Text>
          <Text style={styles.company} numberOfLines={1}>{req.employer?.company_name ?? (en ? 'Company' : 'कंपनी')}</Text>
        </View>
        <View style={styles.salaryBox}>
          <Text style={styles.salary}>{salaryRange(req.salary_min, req.salary_max, en)}</Text>
          {(req.salary_min != null || req.salary_max != null) && (
            <Text style={styles.salaryPer}>{en ? '/month' : '/माह'}</Text>
          )}
        </View>
      </View>
      <View style={styles.tags}>
        {req.is_urgent && (
          <View style={styles.tagUrgent}>
            <Icon name="flame" size={13} color={Colors.dangerText} />
            <Text style={styles.tagUrgentText}>{en ? 'Urgent' : 'जल्दी'}</Text>
          </View>
        )}
        {req.city && (
          <View style={styles.tag}>
            <Icon name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.tagText}>{req.city}</Text>
          </View>
        )}
        {match.distance_km != null && (
          <View style={styles.tag}>
            <Icon name="walk-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.tagText}>{Number(match.distance_km).toFixed(1)} {en ? 'km' : 'किमी'}</Text>
          </View>
        )}
        {match.applied_count > 0 && (
          <View style={styles.tag}>
            <Icon name="people-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.tagText}>{match.applied_count} {en ? 'applied' : 'ने आवेदन किया'}</Text>
          </View>
        )}
        {req.created_at && (
          <View style={styles.tag}>
            <Icon name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.tagText}>{timeAgo(req.created_at, lang)}</Text>
          </View>
        )}
        {applied && (
          <View style={styles.tagApplied}>
            <Icon name="checkmark-circle" size={13} color={Colors.successText} />
            <Text style={styles.tagAppliedText}>{en ? 'Applied' : 'आवेदित'}</Text>
          </View>
        )}
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  cardApplied: { borderColor: Colors.success, borderWidth: 1.5 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  info: { flex: 1, marginLeft: Spacing.md },
  title: { ...Typography.h3, color: Colors.textPrimary },
  company: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  salaryBox: { alignItems: 'flex-end' },
  salary: { ...Typography.h3, color: Colors.primary, fontWeight: '700' },
  salaryPer: { ...Typography.tiny, color: Colors.textTertiary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  tagUrgent: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.dangerLight, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  tagUrgentText: { ...Typography.caption, color: Colors.dangerText, fontWeight: '700' },
  tagApplied: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successLight, borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  tagAppliedText: { ...Typography.caption, color: Colors.successText, fontWeight: '700' },
});
