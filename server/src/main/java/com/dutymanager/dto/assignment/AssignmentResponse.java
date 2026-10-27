package com.dutymanager.dto.assignment;

import com.dutymanager.model.assignment.Assignment;
import java.time.LocalDate;

public record AssignmentResponse(
    long id,
    long dutyId,
    String dutyName,
    LocalDate periodStart,
    LocalDate periodEnd,
    long employeeId,
    String employeeName,
    int slotIndex) {
  public static AssignmentResponse from(Assignment value) {
    return new AssignmentResponse(
        value.id(),
        value.dutyId(),
        value.dutyName(),
        value.periodStart(),
        value.periodEnd(),
        value.employeeId(),
        value.employeeName(),
        value.slotIndex());
  }
}
