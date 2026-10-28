import {describe, expect, it} from 'vitest';
import {AxiosError, AxiosHeaders, CanceledError, type AxiosResponse} from 'axios';
import apiClient, {normalizeApiError} from './apiClient';
import {ApiError} from './types';

function httpError(status: number, data: unknown) {
  const response: AxiosResponse = {
    status,
    data,
    statusText: '',
    headers: {},
    config: {headers: new AxiosHeaders()},
  };
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}
describe('API error contract', () => {
  it('preserves the Java server message', () => {
    expect(
      normalizeApiError(httpError(409, {message: 'プレビュー後に予定が変更されました。'})),
    ).toMatchObject({
      code: 'HTTP_409',
      status: 409,
      message: 'プレビュー後に予定が変更されました。',
    });
  });
  it('handles a response-less network failure safely', () => {
    expect(normalizeApiError(new AxiosError('Network Error', 'ERR_NETWORK'))).toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
      message: 'サーバーに接続できません。起動状態を確認してください。',
    });
  });
  it('distinguishes a timeout', () => {
    expect(normalizeApiError(new AxiosError('timeout', 'ECONNABORTED')).code).toBe('TIMEOUT');
  });
  it('uses Japanese fallback messages for malformed error bodies', () => {
    expect(normalizeApiError(httpError(400, '<html>bad request</html>')).message).toBe(
      '入力内容を確認してください。',
    );
    expect(normalizeApiError(httpError(500, {message: 123})).message).toBe(
      'サーバーでエラーが発生しました。',
    );
  });
  it('normalizes actual Axios rejections in the shared instance', async () => {
    await expect(
      apiClient.get('/employees', {
        adapter: async () => {
          throw httpError(404, {message: 'メンバーが見つかりません。'});
        },
      }),
    ).rejects.toMatchObject({name: 'ApiError', status: 404, message: 'メンバーが見つかりません。'});
  });
  it('keeps cancellation out of the user-facing error path', async () => {
    const cancellation = new CanceledError('aborted');
    await expect(
      apiClient.get('/employees', {
        adapter: async () => {
          throw cancellation;
        },
      }),
    ).rejects.toBe(cancellation);
  });
  it('does not discard an already normalized error', () => {
    const error = new ApiError('VALIDATION_ERROR', '入力を確認してください。', 400, [
      {field: 'name', message: '名前を入力してください。'},
    ]);
    expect(normalizeApiError(error)).toBe(error);
    expect(error.getFieldMessage('name')).toBe('名前を入力してください。');
  });
});

it('preserves Japanese server messages in binary download error responses', () => {
  const bytes = new TextEncoder().encode(
    JSON.stringify({message: '出力期間を確認してください。'}),
  ).buffer;
  expect(normalizeApiError(httpError(400, bytes)).message).toBe('出力期間を確認してください。');
  expect(normalizeApiError(httpError(500, new Uint8Array([0, 1]).buffer)).message).toBe(
    'サーバーでエラーが発生しました。',
  );
});
