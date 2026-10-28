import {act, cleanup, renderHook, waitFor} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {useRetainedRequest} from './useRetainedRequest';
afterEach(cleanup);
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (cause: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return {promise, resolve, reject};
}
it('retains a loaded result while refreshing and replaces it only after success', async () => {
  const next = deferred<string[]>();
  const load = vi.fn().mockResolvedValueOnce(['old']).mockReturnValueOnce(next.promise);
  const {result, rerender} = renderHook(
    ({version}) => useRetainedRequest('members', load, version),
    {initialProps: {version: 0}},
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  rerender({version: 1});
  expect(result.current.data).toEqual(['old']);
  expect(result.current.loading).toBe(false);
  expect(result.current.refreshing).toBe(true);
  await act(async () => next.resolve(['new']));
  expect(result.current.data).toEqual(['new']);
  expect(result.current.refreshing).toBe(false);
});
it('treats a successful empty list as loaded during subsequent refreshes', async () => {
  const next = deferred<string[]>();
  const load = vi.fn().mockResolvedValueOnce([]).mockReturnValueOnce(next.promise);
  const {result, rerender} = renderHook(({version}) => useRetainedRequest('empty', load, version), {
    initialProps: {version: 0},
  });
  await waitFor(() => expect(result.current.hasData).toBe(true));
  rerender({version: 1});
  expect(result.current.loading).toBe(false);
  expect(result.current.refreshing).toBe(true);
  expect(result.current.data).toEqual([]);
  await act(async () => next.resolve([]));
});
it('preserves the last success and reports background errors, then allows retry', async () => {
  const retry = deferred<string[]>();
  const load = vi
    .fn()
    .mockResolvedValueOnce(['saved'])
    .mockRejectedValueOnce(new Error('接続できません'))
    .mockReturnValueOnce(retry.promise);
  const {result, rerender} = renderHook(
    ({version}) => useRetainedRequest('members', load, version),
    {initialProps: {version: 0}},
  );
  await waitFor(() => expect(result.current.hasData).toBe(true));
  rerender({version: 1});
  await waitFor(() => expect(result.current.error).toBe('接続できません'));
  expect(result.current.data).toEqual(['saved']);
  expect(result.current.loading).toBe(false);
  expect(result.current.refreshing).toBe(false);
  rerender({version: 2});
  expect(result.current.error).toBe('');
  expect(result.current.data).toEqual(['saved']);
  await act(async () => retry.resolve(['recovered']));
  expect(result.current.data).toEqual(['recovered']);
});
it('never displays an old year under a new query and ignores late aborted responses', async () => {
  const old = deferred<string[]>(),
    next = deferred<string[]>();
  const loadOld = vi.fn().mockResolvedValueOnce(['2026']).mockReturnValueOnce(old.promise),
    loadNew = vi.fn().mockReturnValue(next.promise);
  const {result, rerender} = renderHook(
    ({key, load, version}) => useRetainedRequest(key, load, version),
    {initialProps: {key: '2026', load: loadOld, version: 0}},
  );
  await waitFor(() => expect(result.current.hasData).toBe(true));
  rerender({key: '2026', load: loadOld, version: 1});
  await waitFor(() => expect(loadOld).toHaveBeenCalledTimes(2));
  rerender({key: '2027', load: loadNew, version: 0});
  expect(result.current.data).toBeUndefined();
  expect(result.current.loading).toBe(true);
  await act(async () => next.resolve(['2027']));
  await act(async () => old.resolve(['late 2026']));
  expect(result.current.data).toEqual(['2027']);
});
it('aborts requests on unmount and does not request disabled queries', async () => {
  const next = deferred<string[]>();
  const load = vi.fn().mockReturnValue(next.promise);
  const {result, rerender, unmount} = renderHook(
    ({enabled}) => useRetainedRequest('members', load, 0, enabled),
    {initialProps: {enabled: false}},
  );
  expect(result.current.loading).toBe(false);
  expect(load).not.toHaveBeenCalled();
  rerender({enabled: true});
  await waitFor(() => expect(load).toHaveBeenCalledOnce());
  const signal = load.mock.calls[0][0] as AbortSignal;
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => next.resolve(['late']));
});
