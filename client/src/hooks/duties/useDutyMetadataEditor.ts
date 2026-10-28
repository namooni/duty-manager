import {useState} from 'react';
import type {Duty} from '@/repositories/duties/duties.domain';
import {dutiesRepository} from '@/repositories/duties/duties.repository';
import {useExclusiveAction} from '@/hooks/common/useExclusiveAction';
import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
export function useDutyMetadataEditor() {
  const [original, setOriginal] = useState<Duty | null>(null);
  const [name, setName] = useState(''),
    [description, setDescription] = useState('');
  const {busy, error, setError, run} = useExclusiveAction();
  return {
    original,
    name,
    description,
    setName,
    setDescription,
    busy,
    error,
    open: (duty: Duty) => {
      if (useDutyUiStore.getState().busy) return;
      setOriginal(duty);
      setName(duty.name);
      setDescription(duty.description);
      setError('');
    },
    close: () => {
      if (!useDutyUiStore.getState().busy) {
        setOriginal(null);
        setError('');
      }
    },
    save: () =>
      run(
        async () => {
          if (!original) throw new Error('編集対象を選択してください。');
          if (!name.trim() || name.trim().length > 100 || description.length > 1000)
            throw new Error('名前は1〜100文字、説明は1000文字以内で入力してください。');
          await dutiesRepository.updateDetails(original.id, {
            name: name.trim(),
            description: description.trim(),
            expectedName: original.name,
            expectedDescription: original.description,
          });
        },
        () => {
          setOriginal(null);
          const ui = useDutyUiStore.getState();
          ui.setNotice('当番の基本情報を保存しました。');
          ui.refreshData();
        },
      ),
  };
}
