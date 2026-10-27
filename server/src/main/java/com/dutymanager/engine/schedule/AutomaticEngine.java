package com.dutymanager.engine.schedule;

import com.dutymanager.engine.rotation.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.schedule.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class AutomaticEngine {
  private final AssignmentEngine periods;
  private final OccurrenceEngine occurrences;

  public AutomaticEngine(AssignmentEngine periods, OccurrenceEngine occurrences) {
    this.periods = periods;
    this.occurrences = occurrences;
  }

  public List<RotationTurn> turns(
      Duty duty,
      ScheduleRule rule,
      List<Meeting> meetings,
      List<Employee> employees,
      List<Exclusion> exclusions,
      Set<LocalDate> holidays,
      LocalDate to,
      int sampleCount) {
    if (sampleCount > 0 && rule.recurrence() == Recurrence.EXPLICIT_DATES)
      sampleCount = Math.max(sampleCount, meetings.size());
    var allocator = new RotationAllocator(duty, employees);
    var result = new ArrayList<RotationTurn>();
    List<Meeting> events =
        rule.recurrence() == Recurrence.EXPLICIT_DATES
            ? new ArrayList<>(meetings)
            : rule.rotationMode() == RotationMode.OCCURRENCE
                ? occurrences.generate(rule, duty.anchorDate(), to, sampleCount, holidays)
                : List.of();
    if (sampleCount > 0 && rule.recurrence() == Recurrence.EXPLICIT_DATES)
      while (events.size() < sampleCount) events.add(new Meeting(events.size(), null));
    int limit =
        sampleCount > 0
            ? sampleCount
            : rule.rotationMode() == RotationMode.OCCURRENCE ? events.size() : 4000;
    for (int index = 0; index < limit; index++) {
      LocalDate start, end;
      if (rule.rotationMode() == RotationMode.CALENDAR) {
        start = periods.boundary(duty, index);
        end = periods.boundary(duty, index + 1).minusDays(1);
        if (sampleCount == 0 && start.isAfter(to)) break;
        if (index == 3999 && sampleCount == 0 && !periods.boundary(duty, index + 1).isAfter(to))
          throw new com.dutymanager.exception.BadRequestException("開始日から計算できるのは最大4,000期間です。");
      } else {
        start = index < events.size() ? events.get(index).date() : null;
        end = start;
      }
      final var from = start;
      final var through = end;
      var eligible =
          allocator.roster().stream()
              .filter(
                  e ->
                      e.active()
                          && (from == null || !periods.excluded(e.id(), from, through, exclusions)))
              .toList();
      var selected = allocator.select(eligible);
      String warning =
          selected.size() < duty.assigneeCount() ? "担当できるメンバーが不足しています。参加者・対象外期間を確認してください。" : null;
      result.add(
          new RotationTurn(
              (rule.rotationMode() == RotationMode.CALENDAR ? "C:" : "E:") + index,
              index,
              start,
              end,
              selected,
              warning));
    }
    return result;
  }

  public List<Meeting> dates(
      Duty duty, ScheduleRule rule, List<Meeting> meetings, LocalDate to, Set<LocalDate> holidays) {
    return rule.recurrence() == Recurrence.EXPLICIT_DATES
        ? meetings
        : occurrences.generate(rule, duty.anchorDate(), to, 0, holidays);
  }
}
