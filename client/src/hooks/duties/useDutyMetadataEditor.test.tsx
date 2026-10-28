import {act, cleanup, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {useDutyMetadataEditor} from './useDutyMetadataEditor';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {config} from '@/test/fixtures/schedule';
vi.mock('@/repositories/duties/duties.repository', () => ({
  dutiesRepository: {updateDetails: vi.fn()},
}));
beforeEach(() => {
  vi.resetAllMocks();
  useDutyUiStore.setState({busy: false, revision: 0, notice: ''});
});
afterEach(cleanup);
it('opens existing values and saves only metadata with its original values for conflict detection', async () => {
  vi.mocked(dutiesRepository.updateDetails).mockResolvedValue();
  const {result} = renderHook(useDutyMetadataEditor);
  act(() => result.current.open(config().duty));
  expect(result.current.name).toBe('朝会');
  act(() => {
    result.current.setName(' 朝会の司会 ');
    result.current.setDescription(' 連絡事項 ');
  });
  await act(async () => result.current.save());
  expect(dutiesRepository.updateDetails).toHaveBeenCalledWith(1, {
    name: '朝会の司会',
    description: '連絡事項',
    expectedName: '朝会',
    expectedDescription: '',
  });
  expect(result.current.original).toBeNull();
  expect(useDutyUiStore.getState().revision).toBe(1);
});
it('preserves the draft on an update conflict', async () => {
  vi.mocked(dutiesRepository.updateDetails).mockRejectedValue(new Error('更新されています'));
  const {result} = renderHook(useDutyMetadataEditor);
  act(() => result.current.open(config().duty));
  act(() => result.current.setName('変更後'));
  await act(async () => result.current.save());
  expect(result.current.name).toBe('変更後');
  expect(result.current.original).not.toBeNull();
  expect(result.current.error).toBe('更新されています');
  expect(useDutyUiStore.getState().revision).toBe(0);
});
