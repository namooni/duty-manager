package com.dutymanager.service.schedule;

import com.dutymanager.exception.NotFoundException;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.schedule.ScheduleRule;
import com.dutymanager.repository.duty.DutyRepository;
import com.dutymanager.repository.schedule.ScheduleRepository;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class ScheduleAccess {
  private final DutyRepository duties;
  private final ScheduleRepository schedules;

  public ScheduleAccess(DutyRepository duties, ScheduleRepository schedules) {
    this.duties = duties;
    this.schedules = schedules;
  }

  public Duty duty(long id) {
    return duties.findById(id).orElseThrow(() -> new NotFoundException("当番が見つかりません。"));
  }

  public void lock(long id) {
    if (!duties.lockById(id)) throw new NotFoundException("当番が見つかりません。");
  }

  public ScheduleRule rule(long id) {
    var rule = schedules.rules().get(id);
    if (rule == null) throw new NotFoundException("実施日の設定が見つかりません。");
    return rule;
  }

  public Set<LocalDate> holidayDates() {
    var dates = new HashSet<LocalDate>();
    schedules.holidays().forEach(h -> dates.add(h.date()));
    return dates;
  }
}
