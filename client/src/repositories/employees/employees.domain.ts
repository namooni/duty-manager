export type Employee = Readonly<{
  id: number;
  employeeNumber: string;
  name: string;
  active: boolean;
}>;
export type EmployeeInput = Readonly<{employeeNumber: string; name: string}>;
