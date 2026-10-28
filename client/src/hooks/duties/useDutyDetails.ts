import {useCallback, useState} from 'react';
import {useRetainedRequest} from '@/hooks/common/useRetainedRequest';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {useDutyManager} from './useDutyManager';
import {useAutomaticSchedule} from './useAutomaticSchedule';
import {useDutyMetadataEditor} from './useDutyMetadataEditor';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import {assignmentsRepository} from '@/repositories/assignments/assignments.repository';
import {meetingDateRange} from '@/utils/schedule/meetingDateRange';
import {buildAnnualSchedule} from '@/utils/schedule/buildAnnualSchedule';
export function useDutyDetails() {
  const m = useDutyManager(false);
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const params = useParams();
  const parsedId = Number(params.dutyId);
  const id = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : -1;
  const [search, setSearch] = useSearchParams();
  const rawYear = search.get('year');
  const requestedYear = Number(rawYear);
  const year =
    rawYear && /^\d{4}$/.test(rawYear) && requestedYear >= 1900 && requestedYear <= 2199
      ? requestedYear
      : Number(m.today.slice(0, 4));
  const from = year + '-01-01',
    to = year + '-12-31';
  const work = useAutomaticSchedule(from, to, m.revision, m.employees, m.today, {dutyId: id});
  const editor = useDutyMetadataEditor();
  const navigate = useNavigate();
  const loadDuty = useCallback((signal: AbortSignal) => dutiesRepository.find(id, signal), [id]);
  const record = useRetainedRequest('duty:' + id, loadDuty, m.revision);
  const duty = record.data ?? null;
  const loadLegacy = useCallback(
    async (signal: AbortSignal) =>
      (await assignmentsRepository.list(from, to, signal)).filter(row => row.dutyId === id),
    [from, to, id],
  );
  const legacyRequest = useRetainedRequest(
    'legacy:' + id + ':' + from + ':' + to,
    loadLegacy,
    m.revision,
    !work.loading && !work.error && work.hasData && !work.duties.length,
  );
  const legacy = legacyRequest.data ?? [];
  const config = work.duties.find(item => item.duty.id === id);
  const events = work.scheduleData.occurrences.filter(event => event.dutyId === id);
  const months = buildAnnualSchedule(year, events);
  const pending = events.filter(event => event.date === null);
  return {
    m,
    finishExtension: () => setExtensionOpen(false),
    extensionOpen,
    exportOpen,
    openExport: () => setExportOpen(true),
    closeExport: () => {
      if (!m.busy) setExportOpen(false);
    },
    openExtension: () => setExtensionOpen(true),
    closeExtension: () => {
      if (!m.busy) setExtensionOpen(false);
    },
    ruleEditorOpen,
    openRuleEditor: () => setRuleEditorOpen(true),
    closeRuleEditor: () => {
      if (!m.busy) setRuleEditorOpen(false);
    },
    finishRuleEdit: () => setRuleEditorOpen(false),
    work,
    editor,
    duty,
    config,
    year,
    from,
    to,
    months: months.map(month => {
      if (config?.schedule.recurrence !== 'EXPLICIT_DATES') return {...month, registration: null};
      const monthKey = year + '-' + String(month.month).padStart(2, '0');
      const candidate = [...pending]
        .sort((a, b) => a.sequence - b.sequence)
        .find(
          event =>
            meetingDateRange(
              config.meetings,
              event.sequence,
              m.today,
              config.duty.anchorDate,
              monthKey,
              config.range?.plannedThrough,
            ).available,
        );
      return {
        ...month,
        registration: {
          available: !!candidate,
          reason:
            monthKey < m.today.slice(0, 7)
              ? '過去の月には登録できません。'
              : !candidate
                ? '開催順に合う未定の回がありません。下の未定一覧を確認してください。'
                : '',
          open: () => {
            if (candidate && !work.busy) work.openMeeting(candidate, monthKey);
          },
        },
      };
    }),
    pending,
    legacy,
    legacyError: legacyRequest.error,
    loading: record.loading,
    refreshing: record.refreshing,
    error: record.error,
    monthly:
      config?.schedule.recurrence === 'EXPLICIT_DATES' ||
      config?.schedule.recurrence.startsWith('MONTHLY'),
    scheduledCount: months.reduce((count, month) => count + month.events.length, 0),
    setYear: (next: number) => {
      if (!Number.isInteger(next) || next < 1900 || next > 2199 || editor.busy) return;
      const query = new URLSearchParams(search);
      query.set('year', String(next));
      setSearch(query);
    },
    showCurrentYear: () => {
      const query = new URLSearchParams(search);
      query.delete('year');
      setSearch(query);
    },
    back: () => navigate('/duties'),
    showSchedule: () => {
      if (duty) m.showDuty(duty.id);
    },
    currentContinuations: [
      ...new Map(
        events
          .filter(
            event =>
              event.periodStart &&
              event.periodEnd &&
              event.periodStart <= m.today &&
              event.periodEnd >= m.today,
          )
          .flatMap(event =>
            event.assignees
              .filter(person => duty && !duty.memberIds.includes(person.employeeId))
              .map(
                person =>
                  [
                    person.employeeId,
                    {
                      id: person.employeeId,
                      label: person.name + '：今回のみ ' + event.periodEnd + 'まで担当',
                    },
                  ] as const,
              ),
          ),
      ).values(),
    ],
    participants:
      duty?.memberIds.map(memberId => {
        const person = m.employees.find(employee => employee.id === memberId);
        return {
          id: memberId,
          label: person
            ? person.name + '（' + person.employeeNumber + '）' + (person.active ? '' : ' · 無効')
            : 'メンバー #' + memberId,
        };
      }) ?? [],
  };
}
export type DutyDetails = ReturnType<typeof useDutyDetails>;
