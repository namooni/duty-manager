package com.dutymanager.dto.planning;

import com.dutymanager.dto.employee.EmployeeResponse;
import com.dutymanager.model.planning.Period;
import java.time.LocalDate;
import java.util.List;

public record PeriodResponse(
    LocalDate start,
    LocalDate end,
    List<EmployeeResponse> assignees,
    boolean confirmed,
    String warning) {
  public static PeriodResponse from(Period value) {
    return new PeriodResponse(
        value.start(),
        value.end(),
        value.assignees().stream().map(EmployeeResponse::from).toList(),
        value.confirmed(),
        value.warning());
  }
}
