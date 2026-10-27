import type {EmployeeDto} from './employees.dto';
import type {Employee} from './employees.domain';
export const toEmployee = (dto: EmployeeDto): Employee => ({
  id: dto.id,
  employeeNumber: dto.employeeNumber,
  name: dto.name,
  active: dto.active,
});
