import {expect, it} from 'vitest';
import {groupDutyChoices} from './groupDutyChoices';
import {config} from '@/test/fixtures/schedule';
it('shows one choice per name and retains all IDs including legacy duties', () => {
  const duty = config().duty;
  const choices = groupDutyChoices([
    {...duty, id: 5, name: 'ゴミ出し'},
    {...duty, id: 4, name: '定例会'},
    {...duty, id: 3, name: '定例会'},
    {...duty, id: 2, name: '定例会'},
    {...duty, id: 1, name: ' ゴミ出し '},
    {...duty, id: 5, name: 'ゴミ出し'},
  ]);
  expect(choices).toEqual([
    {id: 5, name: 'ゴミ出し', dutyIds: [5, 1]},
    {id: 4, name: '定例会', dutyIds: [4, 3, 2]},
  ]);
});
it('does not merge differently named duties or repeat an updated ID', () => {
  const duty = config().duty;
  expect(
    groupDutyChoices([
      {...duty, id: 1, name: '旧名称'},
      {...duty, id: 1, name: '朝会'},
      {...duty, id: 2, name: '議事録'},
    ]),
  ).toEqual([
    {id: 1, name: '朝会', dutyIds: [1]},
    {id: 2, name: '議事録', dutyIds: [2]},
  ]);
});
