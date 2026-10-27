package com.dutymanager.model.planning;

import com.dutymanager.model.employee.Employee;
import java.time.LocalDate;
import java.util.List;

public record Period(
    LocalDate start, LocalDate end, List<Employee> assignees, boolean confirmed, String warning) {
  public Period {
    assignees = List.copyOf(assignees);
  }
}
