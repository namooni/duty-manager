import {useDutyUiStore} from '@/stores/duties/dutyUi.store';
import {useAutoDismissMessage} from './useAutoDismissMessage';
export function useGlobalNoticeTimeout() {
  const {notice, noticeVersion, setNotice} = useDutyUiStore();
  useAutoDismissMessage(notice, setNotice, noticeVersion);
  return {notice, dismiss: () => setNotice('')};
}
