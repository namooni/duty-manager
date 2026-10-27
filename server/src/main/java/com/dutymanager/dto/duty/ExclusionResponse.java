package com.dutymanager.dto.duty;

import com.dutymanager.model.duty.Exclusion;
import java.time.LocalDate;

public record ExclusionResponse(
    long id, long dutyId, long employeeId, LocalDate startDate, LocalDate endDate, String reason) {
  public static ExclusionResponse from(Exclusion value) {
    return new ExclusionResponse(
        value.id(),
        value.dutyId(),
        value.employeeId(),
        value.startDate(),
        value.endDate(),
        value.reason());
  }
}
