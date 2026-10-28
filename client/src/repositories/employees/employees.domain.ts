export type Employee = Readonly<{
  id: number;
  employeeNumber: string;
  name: string;
  active: boolean;
}>;
export type EmployeeInput = Readonly<{employeeNumber: string; name: string}>;

export type EmployeeUpdateInput = Readonly<{employee: EmployeeInput; expected: EmployeeInput}>;
export type EmployeeDeletionStatus = Readonly<{canDelete: boolean}>;
