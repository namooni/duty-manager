package com.dutymanager.dto.schedule;

import com.dutymanager.dto.duty.DutyInput;
import com.dutymanager.model.schedule.AutomaticDefinition;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public record AutomaticInput(
    @NotNull @Valid DutyInput duty,
    @NotNull @Valid ScheduleInput schedule,
    @NotNull @Size(max = 200) List<LocalDate> dates,
    @Min(1) @Max(2147483647) long seed,
    @Min(0) @Max(200) Integer previewCount,
    LocalDate endDate,
    @NotNull LocalDate plannedThrough) {
  public AutomaticDefinition toDefinition() {
    return new AutomaticDefinition(
        duty.toDefinition(),
        schedule.toRule(),
        new java.util.ArrayList<>(dates),
        seed,
        previewCount == null ? 0 : previewCount,
        endDate,
        plannedThrough);
  }
}
