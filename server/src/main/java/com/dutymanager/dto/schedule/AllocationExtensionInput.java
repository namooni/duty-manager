package com.dutymanager.dto.schedule;

import com.dutymanager.model.schedule.AllocationExtension;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record AllocationExtensionInput(
    @NotNull LocalDate plannedThrough, @Min(0) @Max(200) int additionalMeetings) {
  public AllocationExtension command() {
    return new AllocationExtension(plannedThrough, additionalMeetings);
  }

  public record Confirm(@NotNull @Valid AllocationExtensionInput input, @NotBlank String token) {}
}
