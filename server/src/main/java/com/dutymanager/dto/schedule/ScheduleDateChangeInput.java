package com.dutymanager.dto.schedule;

import com.dutymanager.model.schedule.ScheduleDateChange;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ScheduleDateChangeInput(
    @NotBlank @Pattern(regexp = "E:[0-9]{1,5}") String rotationKey,
    @NotNull LocalDate date,
    @NotBlank @Size(max = 300) String reason) {
  public ScheduleDateChange command() {
    return new ScheduleDateChange(rotationKey, date, reason);
  }

  public record Confirm(@NotNull @Valid ScheduleDateChangeInput input, @NotBlank String token) {}
}
