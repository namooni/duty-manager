package com.dutymanager.repository.employee;

import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.employee.EmployeeDefinition;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository {
  List<Employee> findAll();

  long save(EmployeeDefinition definition);

  int updateActive(long id, boolean active);

  Optional<Employee> findById(long id);

  boolean lockById(long id);

  boolean hasReferences(long id);

  void update(long id, EmployeeDefinition definition);

  void delete(long id);
}
