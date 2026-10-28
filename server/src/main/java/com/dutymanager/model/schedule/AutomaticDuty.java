package com.dutymanager.model.schedule;

import com.dutymanager.model.duty.Duty;
import java.util.List;

public record AutomaticDuty(
    Duty duty, ScheduleRule schedule, List<Meeting> meetings, ScheduleRange range) {
  public AutomaticDuty(Duty duty, ScheduleRule schedule, List<Meeting> meetings) {
    this(duty, schedule, meetings, null);
  }
}
