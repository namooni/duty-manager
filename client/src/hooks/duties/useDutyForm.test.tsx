import {act, renderHook, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {useDutyForm} from './useDutyForm';
const employees = Array.from({length: 200}, (_, i) => ({
  id: i + 1,
  employeeNumber: String(i + 1),
  name: '社員' + i,
  active: true,
}));
afterEach(cleanup);
describe('duty participant selection', () => {
  it('selects all 200 active employees by default, including after loading', () => {
    const {result, rerender} = renderHook(({people}) => useDutyForm(people, '2026-10-26'), {
      initialProps: {people: [] as typeof employees},
    });
    rerender({people: employees});
    expect(result.current.form.memberIds).toHaveLength(200);
    act(() => result.current.update('strategy', 'SHUFFLED_ROUND'));
    expect(result.current.form.memberIds).toHaveLength(200);
    act(() => result.current.toggleMember(50));
    expect(result.current.form.memberIds).not.toContain(50);
    act(() => result.current.selectAll());
    expect(result.current.form.memberIds).toHaveLength(200);
  });
  it('uses click order only for custom selection and resets to all on strategy change', () => {
    const {result} = renderHook(() => useDutyForm(employees, '2026-10-26'));
    act(() => result.current.update('strategy', 'CUSTOM'));
    expect(result.current.form.memberIds).toEqual([]);
    act(() => result.current.toggleMember(3));
    act(() => result.current.toggleMember(1));
    expect(result.current.form.memberIds).toEqual([3, 1]);
    act(() => result.current.update('strategy', 'EMPLOYEE_NUMBER'));
    expect(result.current.form.memberIds).toHaveLength(200);
  });
});
