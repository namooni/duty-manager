import {useState} from 'react';
import type {AutomaticDuty} from '@/repositories/automatic/automatic.domain';
import {ExportFormat} from '@/repositories/scheduleExports/scheduleExports.domain';
import {scheduleExportsRepository} from '@/repositories/scheduleExports/scheduleExports.repository';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {downloadFile} from '@/libs/files/download';
import {validateRange} from '@/utils/validation/dateRange';
export function useScheduleExport(
  config: AutomaticDuty,
  initialFrom: string,
  initialTo: string,
  onClose: () => void,
) {
  const [from, setFrom] = useState(initialFrom),
    [to, setTo] = useState(initialTo);
  const recommended =
    config.schedule.rotationMode === 'CALENDAR' ? ExportFormat.PERIOD : ExportFormat.MEETING;
  const [format, setFormat] = useState<ExportFormat>(recommended);
  const [includeUndated, setIncludeUndated] = useState(true);
  const {busy, error, run} = useExclusiveAction();
  const notices: string[] = [];
  const end = config.range?.endDate;
  const effectiveEnd = end && end < to ? end : to;
  if (config.range && config.range.plannedThrough < effectiveEnd)
    notices.push(
      '未割当の期間があります。担当予定は' +
        config.range.plannedThrough +
        'までです。保存済みの予定だけを出力します。',
    );
  if (from < config.duty.anchorDate)
    notices.push('当番開始前の期間は対象外です（開始：' + config.duty.anchorDate + '）。');
  if (end && to > end) notices.push('当番終了後の期間は対象外です（終了：' + end + '）。');
  return {
    from,
    to,
    setFrom,
    setTo,
    format,
    setFormat,
    recommended,
    includeUndated,
    setIncludeUndated,
    busy,
    error,
    notices,
    hasUndated:
      config.schedule.recurrence === 'EXPLICIT_DATES' && config.meetings.some(m => m.date === null),
    download: () =>
      run(async () => {
        validateRange(from, to);
        const file = await scheduleExportsRepository.download(config.duty.id, config.duty.name, {
          from,
          to,
          format,
          includeUndated: config.schedule.recurrence === 'EXPLICIT_DATES' && includeUndated,
        });
        downloadFile(file);
      }, onClose),
  };
}
