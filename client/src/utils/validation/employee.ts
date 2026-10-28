import type {EmployeeInput} from '@/repositories/employees/employees.domain';
export function validateEmployeeInput(input: EmployeeInput): EmployeeInput {
  const name = input.name.trim(),
    employeeNumber = input.employeeNumber.trim();
  if (!name || !employeeNumber) throw new Error('名前と社員番号を入力してください。');
  if (name.length > 80 || employeeNumber.length > 40)
    throw new Error('名前は80文字、社員番号は40文字以内で入力してください。');
  return {name, employeeNumber};
}
