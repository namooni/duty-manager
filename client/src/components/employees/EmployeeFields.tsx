import type {EmployeeInput} from '@/repositories/employees/employees.domain';
import * as U from '@/components/ui';
export function EmployeeFields({
  form,
  onChange,
}: {
  form: EmployeeInput;
  onChange: (key: keyof EmployeeInput, value: string) => void;
}) {
  return (
    <>
      <U.Field>
        <U.Text>社員番号</U.Text>
        <U.Input
          required
          autoFocus
          maxLength={40}
          value={form.employeeNumber}
          onChange={event => onChange('employeeNumber', event.target.value)}
          placeholder="例：001"
        />
      </U.Field>
      <U.Field>
        <U.Text>名前</U.Text>
        <U.Input
          required
          maxLength={80}
          value={form.name}
          onChange={event => onChange('name', event.target.value)}
          placeholder="例：田中 太郎"
        />
      </U.Field>
    </>
  );
}
