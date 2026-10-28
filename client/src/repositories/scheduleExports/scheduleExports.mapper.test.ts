import {expect, it} from 'vitest';
import {toDownloadFile} from './scheduleExports.mapper';
it('creates a valid xlsx download with a Japanese filename without filesystem separators', () => {
  const file = toDownloadFile(new Uint8Array([80, 75]).buffer, '会議/記録:*?', {
    from: '2026-01-01',
    to: '2026-12-31',
    format: 'MEETING',
    includeUndated: true,
  });
  expect(file.filename).toBe('会議_記録____開催日一覧_2026-01-01_2026-12-31.xlsx');
  expect(file.blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  expect(file.blob.size).toBe(2);
});
