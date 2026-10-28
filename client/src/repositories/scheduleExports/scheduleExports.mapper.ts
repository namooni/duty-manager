import type {DownloadFile, ScheduleExportInput} from './scheduleExports.domain';
export function toDownloadFile(
  bytes: ArrayBuffer,
  name: string,
  input: ScheduleExportInput,
): DownloadFile {
  const safeName =
    name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\p{Cc}/gu, '_')
      .replace(/[. ]+$/g, '')
      .slice(0, 60) || '当番';
  return {
    blob: new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename:
      safeName +
      '_' +
      (input.format === 'PERIOD' ? '期間別担当表' : '開催日一覧') +
      '_' +
      input.from +
      '_' +
      input.to +
      '.xlsx',
  };
}
