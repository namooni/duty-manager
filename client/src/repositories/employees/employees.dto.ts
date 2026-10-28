export interface EmployeeDto {
  id: number;
  employeeNumber: string;
  name: string;
  active: boolean;
}
export interface EmployeeInputDto {
  employeeNumber: string;
  name: string;
}

export interface EmployeeUpdateInputDto {
  employee: EmployeeInputDto;
  expected: EmployeeInputDto;
}
export interface EmployeeDeletionStatusDto {
  canDelete: boolean;
}
