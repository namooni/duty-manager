package com.dutymanager.dto.schedule;

import com.dutymanager.model.schedule.*;
import jakarta.validation.constraints.*;
import java.util.List;

public record ScheduleInput(
    @NotNull Recurrence recurrence,
    @NotNull RotationMode rotationMode,
    @NotNull @Size(max = 7) List<@Min(1) @Max(7) Integer> weekdays,
    @Min(1) @Max(365) int everyDays,
    @Min(0) @Max(31) int monthDay,
    @Min(0) @Max(5) int monthOrdinal,
    @Min(1) @Max(7) int weekday) {
  public ScheduleRule toRule() {
    return new ScheduleRule(
        recurrence,
        rotationMode,
        List.copyOf(weekdays),
        everyDays,
        monthDay,
        monthOrdinal,
        weekday);
  }
}
