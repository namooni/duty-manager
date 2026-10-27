package com.dutymanager.model.schedule;

import com.dutymanager.model.duty.DutyDefinition;
import java.time.LocalDate;
import java.util.List;

public record AutomaticDefinition(
    DutyDefinition duty,
    ScheduleRule schedule,
    List<LocalDate> dates,
    long seed,
    int previewCount) {
  public AutomaticDefinition(
      DutyDefinition duty, ScheduleRule schedule, List<LocalDate> dates, long seed) {
    this(duty, schedule, dates, seed, 0);
  }

  public AutomaticDefinition {
    dates = java.util.Collections.unmodifiableList(new java.util.ArrayList<>(dates));
  }
}
