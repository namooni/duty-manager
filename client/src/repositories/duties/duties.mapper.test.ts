import {describe, expect, it} from 'vitest';
import {toDuty, toDutyInputDto, toPreview} from './duties.mapper';
import type {DutyDto, PreviewDto} from './duties.dto';
describe('repository mapping boundaries', () => {
  const dto: DutyDto = {
    id: 1,
    name: '朝会',
    description: '',
    anchorDate: '2026-10-26',
    intervalCount: 1,
    intervalUnit: 'WEEK',
    strategy: 'CUSTOM',
    assigneeCount: 1,
    memberIds: [1],
  };
  it('does not expose mutable DTO member arrays to hooks', () => {
    const domain = toDuty(dto);
    dto.memberIds.push(2);
    expect(domain.memberIds).toEqual([1]);
    const input = toDutyInputDto(domain);
    input.memberIds.push(3);
    expect(domain.memberIds).toEqual([1]);
  });
  it('maps nested preview data without sharing server objects', () => {
    const raw: PreviewDto = {
      token: 'preview-token',
      periods: [
        {
          start: '2026-10-26',
          end: '2026-11-01',
          confirmed: false,
          warning: null,
          assignees: [{id: 1, name: '田中', employeeNumber: '001', active: true}],
        },
      ],
    };
    const preview = toPreview(raw);
    raw.periods[0].assignees[0].name = '変更';
    expect(preview.periods[0].assignees[0].name).toBe('田中');
    expect(preview.token).toBe('preview-token');
  });
});
