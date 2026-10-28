export const ExportFormat = {PERIOD: 'PERIOD', MEETING: 'MEETING'} as const;
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];
export type ScheduleExportInput = Readonly<{
  from: string;
  to: string;
  format: ExportFormat;
  includeUndated: boolean;
}>;
export type DownloadFile = Readonly<{blob: Blob; filename: string}>;
