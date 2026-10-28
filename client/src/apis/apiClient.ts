import axios from 'axios';
import {env} from '@/config/env';
import {ApiError} from './types';

const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: {Accept: 'application/json'},
});

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError('UNKNOWN_ERROR', 'リクエストを処理できませんでした。');
  }
  if (!error.response) {
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      ? new ApiError('TIMEOUT', '通信がタイムアウトしました。もう一度お試しください。')
      : new ApiError('NETWORK_ERROR', 'サーバーに接続できません。起動状態を確認してください。');
  }
  const {status, data} = error.response;
  let body: unknown = data;
  if (Object.prototype.toString.call(data) === '[object ArrayBuffer]' || ArrayBuffer.isView(data)) {
    try {
      body = JSON.parse(new TextDecoder().decode(data));
    } catch {
      body = null;
    }
  }
  const message =
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string' &&
    body.message.trim()
      ? body.message
      : null;
  const messages: Record<number, string> = {
    400: '入力内容を確認してください。',
    401: '認証が必要です。',
    403: 'この操作を行う権限がありません。',
    404: '対象のデータが見つかりません。',
    409: 'データが変更されています。更新して確認してください。',
  };
  return new ApiError(
    `HTTP_${status}`,
    message ?? messages[status] ?? 'サーバーでエラーが発生しました。',
    status,
  );
}

apiClient.interceptors.response.use(
  response => response,
  (error: unknown) => {
    // Cancellation is control flow, not a user-facing network failure.
    return Promise.reject(axios.isCancel(error) ? error : normalizeApiError(error));
  },
);
export default apiClient;
