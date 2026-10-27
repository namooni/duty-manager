package com.dutymanager.dto.employee;

import com.dutymanager.model.employee.Employee;

public record EmployeeResponse(long id, String employeeNumber, String name, boolean active) {
  public static EmployeeResponse from(Employee value) {
    return new EmployeeResponse(value.id(), value.employeeNumber(), value.name(), value.active());
  }
}
