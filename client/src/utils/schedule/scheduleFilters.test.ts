import {describe, expect, it} from 'vitest';
import {matchesPerson, matchesSchedule} from './scheduleFilters';
const person = {employeeId: 1, name: '田中　太郎', employeeNumber: 'AB001'};
const empty = {dutyId: '', personId: '', personQuery: ''};
describe('person and duty filters', () => {
  it('matches names across Japanese spaces and mixed name / employee-number tokens', () => {
    expect(matchesPerson(person, {...empty, personQuery: '田中太郎'})).toBe(true);
    expect(matchesPerson(person, {...empty, personQuery: '田中 ００１'})).toBe(true);
    expect(matchesPerson(person, {...empty, personQuery: 'ａｂ００１'})).toBe(true);
    expect(matchesPerson(person, {...empty, personQuery: '田中 999'})).toBe(false);
  });
  it('combines duty selection and exact employee selection', () => {
    expect(matchesSchedule(3, [person], {...empty, dutyId: '3', personId: '1'})).toBe(true);
    expect(matchesSchedule(4, [person], {...empty, dutyId: '3', personId: '1'})).toBe(false);
    expect(matchesSchedule(3, [person], {...empty, personId: '11'})).toBe(false);
  });
  it('requires one assignee to satisfy both person and query conditions', () => {
    const second = {employeeId: 2, name: '鈴木', employeeNumber: '002'};
    expect(
      matchesSchedule(1, [person, second], {...empty, personId: '1', personQuery: '鈴木'}),
    ).toBe(false);
  });
  it('keeps unassigned events only when no person filter is active', () => {
    expect(matchesSchedule(1, [], empty)).toBe(true);
    expect(matchesSchedule(1, [], {...empty, personQuery: '　 '})).toBe(true);
    expect(matchesSchedule(1, [], {...empty, personId: '1'})).toBe(false);
    expect(matchesSchedule(1, [], {...empty, personQuery: '田中'})).toBe(false);
  });
});
