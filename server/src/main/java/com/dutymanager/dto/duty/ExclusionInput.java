package com.dutymanager.dto.duty;

import com.dutymanager.model.duty.ExclusionDefinition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ExclusionInput(
    @Positive long employeeId,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotBlank @Size(max = 300) String reason) {
  public ExclusionDefinition toDefinition() {
    return new ExclusionDefinition(employeeId, startDate, endDate, reason);
  }
}
