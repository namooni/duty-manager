import type {ReactNode} from 'react';
import type {DutyManager} from '@/hooks/duties/useDutyManager';
import {pageTitles} from '@/constants/navigation';
import {DutyForms} from '@/components/duties/DutyForms';
import * as U from '@/components/ui';
export function DutyPageLayout({m, children}: {m: DutyManager; children: ReactNode}) {
  return (
    <>
      <U.Between style={{marginBottom: 20}}>
        <U.Flex flexDirection="column">
          <U.Text as="h1" variant="h1" style={{fontSize: 20, fontWeight: 650}}>
            {pageTitles[m.page]}
          </U.Text>
        </U.Flex>
        <U.Row>
          <U.Button disabled={m.loading || m.busy} onClick={m.refresh}>
            <U.Text>{m.refreshing ? '更新中…' : '更新'}</U.Text>
          </U.Button>
          <U.Button variant="primary" disabled={m.busy || m.loading} onClick={m.openPrimary}>
            <U.Text>{m.primaryLabel}</U.Text>
          </U.Button>
        </U.Row>
      </U.Between>
      {m.error && !m.modal && (
        <U.Alert role="alert">
          <U.Text>{m.error}</U.Text>
        </U.Alert>
      )}
      {children}
      <DutyForms m={m} />
    </>
  );
}
