package com.dutymanager.dto.employee;

import com.dutymanager.model.employee.EmployeeDefinition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmployeeInput(
    @NotBlank @Size(max = 40) String employeeNumber, @NotBlank @Size(max = 80) String name) {
  public EmployeeDefinition toDefinition() {
    return new EmployeeDefinition(employeeNumber, name);
  }
}
