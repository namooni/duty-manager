package com.dutymanager.dto.assignment;

import com.dutymanager.model.assignment.Replacement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ReplaceInput(
    @Positive long employeeId, @NotBlank @Size(max = 300) String reason, java.time.LocalDate from) {
  public Replacement toDefinition() {
    return new Replacement(employeeId, reason);
  }
}
