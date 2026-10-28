import type {ReactNode} from 'react';
import {act, renderHook} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect, it} from 'vitest';
import {useAppNavigation} from './useAppNavigation';
it('separates home and schedule routes', () => {
  const wrapper = ({children}: {children: ReactNode}) => <MemoryRouter>{children}</MemoryRouter>;
  const {result} = renderHook(useAppNavigation, {wrapper});
  expect(result.current.page).toBe('home');
  act(() => result.current.setPage('schedule'));
  expect(result.current.page).toBe('schedule');
  act(() => result.current.setPage('home'));
  expect(result.current.page).toBe('home');
});
