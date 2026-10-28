import {useNavigate} from 'react-router-dom';
import {useRetainedRequest} from '@/hooks/common/useRetainedRequest';
import {automaticRepository} from '@/repositories/automatic/automatic.repository';
import type {DutyManager} from './useDutyManager';
import {scheduleLabel, rotationLabel} from '@/utils/format/schedule';
export function useDutyCatalog(m: DutyManager) {
  const navigate = useNavigate();
  const request = useRetainedRequest('duty-catalog', automaticRepository.catalog, m.revision);
  const configs = request.data ?? [];
  return {
    showDetails: (id: number) => navigate('/duties/' + id),
    error: request.error,
    loading: request.loading,
    refreshing: request.refreshing,
    rows: m.duties.map(duty => {
      const config = configs.find(c => c.duty.id === duty.id);
      return {
        ...duty,
        scheduleText: config ? scheduleLabel(config.schedule) : '実施日未設定（以前の形式）',
        rotationText: config ? rotationLabel(duty, config.schedule) : '保存済みの担当期間を保持',
        automatic: !!config,
      };
    }),
  };
}
