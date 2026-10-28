package com.dutymanager.model.schedule;

import com.dutymanager.model.duty.DutyDefinition;
import java.time.LocalDate;
import java.util.List;

public record AutomaticDefinition(
    DutyDefinition duty,
    ScheduleRule schedule,
    List<LocalDate> dates,
    long seed,
    int previewCount,
    LocalDate endDate,
    LocalDate plannedThrough) {
  public AutomaticDefinition(
      DutyDefinition duty, ScheduleRule schedule, List<LocalDate> dates, long seed) {
    this(duty, schedule, dates, seed, 0, null, null);
  }

  public AutomaticDefinition(
      DutyDefinition duty, ScheduleRule schedule, List<LocalDate> dates, long seed, int count) {
    this(duty, schedule, dates, seed, count, null, null);
  }

  public AutomaticDefinition {
    dates = java.util.Collections.unmodifiableList(new java.util.ArrayList<>(dates));
  }
}
