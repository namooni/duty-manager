package com.dutymanager.model.schedule;

import java.util.List;

public record ScheduleRule(
    Recurrence recurrence,
    RotationMode rotationMode,
    List<Integer> weekdays,
    int everyDays,
    int monthDay,
    int monthOrdinal,
    int weekday) {
  public ScheduleRule {
    weekdays = List.copyOf(weekdays);
  }
}
