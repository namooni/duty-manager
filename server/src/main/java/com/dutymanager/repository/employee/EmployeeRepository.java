package com.dutymanager.repository.employee;

import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.employee.EmployeeDefinition;
import java.util.List;

public interface EmployeeRepository {
  List<Employee> findAll();

  long save(EmployeeDefinition definition);

  int updateActive(long id, boolean active);
}
