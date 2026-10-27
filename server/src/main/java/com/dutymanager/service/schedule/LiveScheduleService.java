package com.dutymanager.service.schedule;

import com.dutymanager.common.time.DateRangeValidator;
import com.dutymanager.engine.schedule.AutomaticEngine;
import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.*;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.ScheduleRepository;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LiveScheduleService {
  private final EmployeeRepository employees;
  private final ExclusionRepository exclusions;
  private final ScheduleRepository schedules;
  private final AutomaticEngine engine;
  private final AutomaticDutyService definitions;
  private final ScheduleAccess access;

  public LiveScheduleService(
      EmployeeRepository employees,
      ExclusionRepository exclusions,
      ScheduleRepository schedules,
      AutomaticEngine engine,
      AutomaticDutyService definitions,
      ScheduleAccess access) {
    this.employees = employees;
    this.exclusions = exclusions;
    this.schedules = schedules;
    this.engine = engine;
    this.definitions = definitions;
    this.access = access;
  }

  private Map<String, List<RotationSlot>> ensureSlots(Duty duty, List<RotationTurn> turns) {
    var result = new HashMap<String, List<RotationSlot>>();
    schedules
        .slots(duty.id())
        .forEach(s -> result.computeIfAbsent(s.rotationKey(), k -> new ArrayList<>()).add(s));
    for (var turn : turns)
      if (!result.containsKey(turn.key()) && turn.warning() == null)
        schedules.saveTurn(duty.id(), turn);
    result.clear();
    schedules
        .slots(duty.id())
        .forEach(s -> result.computeIfAbsent(s.rotationKey(), k -> new ArrayList<>()).add(s));
    return result;
  }

  @Transactional
  public ScheduleResult schedule(LocalDate from, LocalDate to) {
    DateRangeValidator.validate(from, to);
    var result = new ArrayList<WorkOccurrence>();
    var people = employees.findAll();
    var peopleById = new HashMap<Long, Employee>();
    people.forEach(p -> peopleById.put(p.id(), p));
    var holidays = access.holidayDates();
    var configs = definitions.catalog();
    // Stable lock order for overlapping queries.
    for (var config :
        configs.stream().sorted(Comparator.comparingLong(c -> c.duty().id())).toList()) {
      var d = config.duty();
      access.lock(d.id());
      var r = config.schedule();
      var meetings = schedules.meetings(d.id());
      var turns =
          engine.turns(d, r, meetings, people, exclusions.findByDutyId(d.id()), holidays, to, 0);
      var saved = ensureSlots(d, turns);
      for (var event : engine.dates(d, r, meetings, to, holidays)) {
        var date = event.date();
        if (date != null && (date.isBefore(from) || date.isAfter(to))) continue;
        RotationTurn turn = null;
        if (r.rotationMode() == RotationMode.OCCURRENCE) {
          if (event.sequence() < turns.size()) turn = turns.get(event.sequence());
        } else if (date != null) {
          for (var candidate : turns)
            if (!date.isBefore(candidate.start()) && !date.isAfter(candidate.end())) {
              turn = candidate;
              break;
            }
        }
        if (turn == null) continue;
        var slots = saved.getOrDefault(turn.key(), List.of());
        var assignees =
            slots.stream()
                .sorted(Comparator.comparingInt(RotationSlot::slotIndex))
                .map(
                    slot -> {
                      var e = peopleById.get(slot.employeeId());
                      return new WorkAssignee(slot.id(), e.id(), e.employeeNumber(), e.name());
                    })
                .toList();
        result.add(
            new WorkOccurrence(
                d.id(),
                d.name(),
                event.sequence(),
                date,
                r.rotationMode(),
                turn.key(),
                turn.start(),
                turn.end(),
                assignees,
                slots.isEmpty() ? turn.warning() : null,
                date != null && holidays.contains(date)));
      }
    }
    var overlaps = new HashMap<String, Set<Long>>();
    for (var event : result)
      if (event.date() != null && !event.holiday())
        for (var person : event.assignees())
          overlaps
              .computeIfAbsent(event.date() + ":" + person.employeeId(), key -> new HashSet<>())
              .add(event.dutyId());
    var warned =
        result.stream()
            .map(
                event -> {
                  boolean overlap =
                      event.date() != null
                          && !event.holiday()
                          && event.assignees().stream()
                              .anyMatch(
                                  person ->
                                      overlaps
                                              .getOrDefault(
                                                  event.date() + ":" + person.employeeId(),
                                                  Set.of())
                                              .size()
                                          > 1);
                  return !overlap
                      ? event
                      : new WorkOccurrence(
                          event.dutyId(),
                          event.dutyName(),
                          event.sequence(),
                          event.date(),
                          event.rotationMode(),
                          event.rotationKey(),
                          event.periodStart(),
                          event.periodEnd(),
                          event.assignees(),
                          event.warning() == null ? "同じ日に別の当番も担当しています。" : event.warning(),
                          event.holiday());
                })
            .sorted(
                Comparator.comparing(
                        WorkOccurrence::date, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparingLong(WorkOccurrence::dutyId))
            .toList();
    return new ScheduleResult(warned, configs);
  }
}
