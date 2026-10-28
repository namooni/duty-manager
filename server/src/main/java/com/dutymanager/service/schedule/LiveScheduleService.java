package com.dutymanager.service.schedule;

import com.dutymanager.common.time.DateRangeValidator;
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
  private final ScheduleTimelineService timeline;
  private final Clock clock;
  private final com.dutymanager.repository.schedule.HandoverRepository handovers;
  private final AssignmentProjectionService assignmentProjection;
  private final AutomaticDutyService definitions;
  private final ScheduleAccess access;
  private final com.dutymanager.repository.schedule.ScheduleRangeRepository ranges;

  public LiveScheduleService(
      EmployeeRepository employees,
      ExclusionRepository exclusions,
      ScheduleRepository schedules,
      ScheduleTimelineService timeline,
      Clock clock,
      com.dutymanager.repository.schedule.HandoverRepository handovers,
      AutomaticDutyService definitions,
      ScheduleAccess access,
      AssignmentProjectionService assignmentProjection,
      com.dutymanager.repository.schedule.ScheduleRangeRepository ranges) {
    this.employees = employees;
    this.exclusions = exclusions;
    this.schedules = schedules;
    this.timeline = timeline;
    this.clock = clock;
    this.handovers = handovers;
    this.definitions = definitions;
    this.access = access;
    this.assignmentProjection = assignmentProjection;
    this.ranges = ranges;
  }

  private Map<String, List<RotationSlot>> savedSlots(Duty duty) {
    var result = new HashMap<String, List<RotationSlot>>();
    schedules
        .slots(duty.id())
        .forEach(s -> result.computeIfAbsent(s.rotationKey(), k -> new ArrayList<>()).add(s));
    return result;
  }

  @Transactional
  public ScheduleResult schedule(LocalDate from, LocalDate to) {
    access.lockPlanning();
    return build(from, to, definitions.catalog());
  }

  @Transactional
  public ScheduleResult schedule(long dutyId, LocalDate from, LocalDate to) {
    DateRangeValidator.validate(from, to);
    access.lock(dutyId);
    var duty = access.duty(dutyId);
    var rule = schedules.rules().get(dutyId);
    return build(
        from,
        to,
        rule == null
            ? List.of()
            : List.of(
                new AutomaticDuty(
                    duty, rule, schedules.meetings(dutyId), ranges.find(dutyId).orElseThrow())));
  }

  private ScheduleResult build(LocalDate from, LocalDate to, List<AutomaticDuty> configs) {
    DateRangeValidator.validate(from, to);
    var result = new ArrayList<WorkOccurrence>();
    var people = employees.findAll();
    var peopleById = new HashMap<Long, Employee>();
    people.forEach(p -> peopleById.put(p.id(), p));
    var holidays = access.holidayDates();
    // Stable lock order for overlapping queries.
    for (var config :
        configs.stream().sorted(Comparator.comparingLong(c -> c.duty().id())).toList()) {
      var d = config.duty();
      access.lock(d.id());
      var r = config.schedule();
      var meetings = schedules.meetings(d.id());
      var range = ranges.find(d.id()).orElseThrow();
      var through = range.limit(to);
      var turns =
          assignmentProjection
              .turns(
                  access.duty(d.id()),
                  r,
                  meetings,
                  people,
                  exclusions.findByDutyId(d.id()),
                  holidays,
                  through)
              .stream()
              .filter(range::includes)
              .map(range::trim)
              .toList();
      var saved = savedSlots(d);
      var handoverData = handovers.find(d.id());
      for (var event : timeline.dates(d, r, meetings, through, holidays)) {
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
        if (!saved.containsKey(turn.key())) continue;
        var slots = saved.getOrDefault(turn.key(), List.of());
        var assignees =
            slots.stream()
                .sorted(Comparator.comparingInt(RotationSlot::slotIndex))
                .map(
                    slot -> {
                      var segment =
                          com.dutymanager.engine.schedule.SlotAssignmentResolver.at(
                              slot, handoverData, date);
                      var e = peopleById.get(segment.employeeId());
                      return new WorkAssignee(slot.id(), e.id(), e.employeeNumber(), e.name());
                    })
                .toList();
        var segments =
            slots.stream()
                .map(
                    slot ->
                        com.dutymanager.engine.schedule.SlotAssignmentResolver.at(
                            slot, handoverData, date))
                .toList();
        var segmentStart = turn.start();
        var segmentEnd = turn.end();
        boolean segmented =
            segments.stream()
                .anyMatch(
                    com.dutymanager.engine.schedule.SlotAssignmentResolver.Segment::segmented);
        for (var segment : segments) {
          if (segment.start() != null
              && (segmentStart == null || segment.start().isAfter(segmentStart)))
            segmentStart = segment.start();
          if (segment.end() != null && (segmentEnd == null || segment.end().isBefore(segmentEnd)))
            segmentEnd = segment.end();
        }
        boolean dateEditable =
            r.rotationMode() == RotationMode.OCCURRENCE
                && (date == null || date.isAfter(LocalDate.now(clock)));
        result.add(
            new WorkOccurrence(
                d.id(),
                d.name(),
                event.sequence(),
                date,
                r.rotationMode(),
                turn.key(),
                segmentStart,
                segmentEnd,
                assignees,
                slots.isEmpty() ? turn.warning() : null,
                date != null && holidays.contains(date),
                dateEditable,
                segmented));
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
                          event.holiday(),
                          event.dateEditable(),
                          event.segmented());
                })
            .sorted(
                Comparator.comparing(
                        WorkOccurrence::date, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparingLong(WorkOccurrence::dutyId))
            .toList();
    return new ScheduleResult(warned, configs);
  }
}
