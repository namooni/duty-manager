import styled from 'styled-components';
import {InlineActions, Table} from '@/components/ui';
export const MemberActions = styled(InlineActions)({
  flexWrap: 'nowrap',
  '& > button:nth-child(2)': {minWidth: 100},
});

export const EmployeeTable = styled(Table)({'& td': {verticalAlign: 'middle'}});
