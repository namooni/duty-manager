package com.dutymanager.service.schedule;

import com.dutymanager.engine.schedule.AutomaticEngine;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.Exclusion;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.schedule.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class ScheduleTimelineService {
  private final AutomaticEngine engine;
  private final ScheduleRepository schedules;
  private final ScheduleRangeRepository ranges;

  public ScheduleTimelineService(
      AutomaticEngine engine, ScheduleRepository schedules, ScheduleRangeRepository ranges) {
    this.engine = engine;
    this.schedules = schedules;
    this.ranges = ranges;
  }

  private LocalDate through(long id, LocalDate to) {
    var range = ranges.find(id);
    return range.isPresent() && range.get().plannedThrough().isAfter(to)
        ? range.get().plannedThrough()
        : to;
  }

  private Map<String, RotationSlot> saved(long id) {
    var map = new HashMap<String, RotationSlot>();
    for (var slot : schedules.slots(id)) map.putIfAbsent(slot.rotationKey(), slot);
    return map;
  }

  public List<RotationTurn> turns(
      Duty duty,
      ScheduleRule rule,
      List<Meeting> meetings,
      List<Employee> people,
      List<Exclusion> excluded,
      Set<LocalDate> holidays,
      LocalDate to) {
    var saved = saved(duty.id());
    return engine
        .turns(duty, rule, meetings, people, excluded, holidays, through(duty.id(), to), 0)
        .stream()
        .map(
            turn -> {
              var slot = saved.get(turn.key());
              return slot == null
                  ? turn
                  : new RotationTurn(
                      turn.key(),
                      turn.sequence(),
                      slot.periodStart(),
                      slot.periodEnd(),
                      turn.assignees(),
                      turn.warning());
            })
        .toList();
  }

  public List<Meeting> dates(
      Duty duty, ScheduleRule rule, List<Meeting> meetings, LocalDate to, Set<LocalDate> holidays) {
    var saved = saved(duty.id());
    return engine.dates(duty, rule, meetings, through(duty.id(), to), holidays).stream()
        .map(
            event -> {
              var slot = saved.get("E:" + event.sequence());
              return rule.rotationMode() != RotationMode.OCCURRENCE || slot == null
                  ? event
                  : new Meeting(event.sequence(), slot.periodStart());
            })
        .toList();
  }

  public Map<Integer, LocalDate> boundaries(long dutyId) {
    var result = new HashMap<Integer, LocalDate>();
    for (var slot : schedules.slots(dutyId))
      if (slot.rotationKey().startsWith("C:"))
        result.put(Integer.parseInt(slot.rotationKey().substring(2)), slot.periodStart());
    return result;
  }
}
