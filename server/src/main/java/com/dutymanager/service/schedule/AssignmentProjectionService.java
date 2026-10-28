package com.dutymanager.service.schedule;

import com.dutymanager.engine.rotation.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.schedule.AssignmentPlanRepository;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AssignmentProjectionService {
  private final ScheduleTimelineService timeline;
  private final AssignmentEngine periods;
  private final AssignmentPlanRepository plans;

  public AssignmentProjectionService(
      ScheduleTimelineService timeline, AssignmentEngine periods, AssignmentPlanRepository plans) {
    this.timeline = timeline;
    this.periods = periods;
    this.plans = plans;
  }

  public record Projection(
      List<RotationTurn> turns, RotationAllocator.Queue queue, AssignmentPlan definition) {}

  public Duty definition(Duty base, AssignmentPlan p) {
    return p == null
        ? base
        : new Duty(
            base.id(),
            base.name(),
            base.description(),
            base.anchorDate(),
            base.intervalCount(),
            base.intervalUnit(),
            p.strategy(),
            p.assigneeCount(),
            p.members(),
            p.seed());
  }

  public Projection project(
      Duty base,
      ScheduleRule rule,
      List<Meeting> meetings,
      List<Employee> people,
      List<Exclusion> excluded,
      Set<LocalDate> holidays,
      LocalDate to,
      int beforeIndex,
      List<AssignmentPlan> versions) {
    var dates = timeline.turns(base, rule, meetings, people, excluded, holidays, to);
    var result = new ArrayList<RotationTurn>();
    RotationAllocator allocator = new RotationAllocator(base, people);
    AssignmentPlan active = null;
    var roster = allocator.roster();
    for (int index = 0; index < dates.size(); index++) {
      final int seq = index;
      var found = versions.stream().filter(p -> p.startIndex() == seq).findFirst();
      if (found.isPresent()) {
        active = found.get();
        var p = active;
        var snap =
            people.stream()
                .map(
                    e ->
                        new Employee(
                            e.id(), e.employeeNumber(), e.name(), p.eligible().contains(e.id())))
                .toList();
        allocator =
            new RotationAllocator(definition(base, p), snap, p.initialQueue(), p.nextRound(), true);
        roster = allocator.roster();
      }
      if (index == beforeIndex)
        return new Projection(List.copyOf(result), allocator.queue(), active);
      var date = dates.get(index);
      var eligible =
          roster.stream()
              .filter(Employee::active)
              .filter(
                  e ->
                      date.start() == null
                          || !periods.excluded(e.id(), date.start(), date.end(), excluded))
              .toList();
      var selected = allocator.select(eligible);
      int count = active == null ? base.assigneeCount() : active.assigneeCount();
      result.add(
          new RotationTurn(
              date.key(),
              index,
              date.start(),
              date.end(),
              selected,
              selected.size() < count ? "担当できるメンバーが不足しています。" : null));
    }
    return new Projection(List.copyOf(result), allocator.queue(), active);
  }

  public List<RotationTurn> turns(
      Duty duty,
      ScheduleRule rule,
      List<Meeting> meetings,
      List<Employee> people,
      List<Exclusion> excluded,
      Set<LocalDate> holidays,
      LocalDate to) {
    return project(duty, rule, meetings, people, excluded, holidays, to, -1, plans.plans(duty.id()))
        .turns();
  }

  public Duty current(Duty duty, ScheduleRule rule, List<Meeting> meetings, LocalDate today) {
    if (rule == null) return duty;
    int index = -1;
    if (rule.rotationMode() == RotationMode.CALENDAR) {
      var boundaries = timeline.boundaries(duty.id());
      for (int i = 0; i < 4000; i++) {
        if (boundaries.getOrDefault(i, periods.boundary(duty, i)).isAfter(today)) break;
        index = i;
      }
    } else
      for (var m : timeline.dates(duty, rule, meetings, today, Set.of()))
        if (m.date() != null && !m.date().isAfter(today)) index = Math.max(index, m.sequence());
    var current = definition(duty, at(duty.id(), index));
    var memberPlan =
        plans.plans(duty.id()).stream()
            .filter(p -> p.membersFrom() != null && !p.membersFrom().isAfter(today))
            .max(java.util.Comparator.comparingLong(AssignmentPlan::id))
            .orElse(null);
    if (memberPlan != null)
      current =
          new Duty(
              current.id(),
              current.name(),
              current.description(),
              current.anchorDate(),
              current.intervalCount(),
              current.intervalUnit(),
              current.strategy(),
              current.assigneeCount(),
              memberPlan.members(),
              current.randomSeed());
    return current;
  }

  public AssignmentPlan at(long dutyId, int index) {
    return plans.plans(dutyId).stream()
        .filter(p -> p.startIndex() <= index)
        .reduce((a, b) -> b)
        .orElse(null);
  }
}
