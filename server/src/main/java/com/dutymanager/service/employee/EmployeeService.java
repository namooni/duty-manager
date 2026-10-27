package com.dutymanager.service.employee;

import com.dutymanager.exception.NotFoundException;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.employee.EmployeeDefinition;
import com.dutymanager.repository.employee.EmployeeRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {
  private final EmployeeRepository employees;

  public EmployeeService(EmployeeRepository employees) {
    this.employees = employees;
  }

  @Transactional(readOnly = true)
  public List<Employee> findAll() {
    return employees.findAll();
  }

  @Transactional
  public long create(EmployeeDefinition definition) {
    return employees.save(definition);
  }

  @Transactional
  public void updateActive(long id, boolean active) {
    if (employees.updateActive(id, active) == 0) throw new NotFoundException("項目が見つかりません。");
  }
}
