package com.dutymanager.engine.rotation;

import com.dutymanager.exception.BadRequestException;
import com.dutymanager.model.assignment.Assignment;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.Exclusion;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.planning.Period;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AssignmentEngine {
  public LocalDate boundary(Duty duty, long index) {
    long amount = Math.multiplyExact(index, duty.intervalCount());
    return switch (duty.intervalUnit()) {
      case DAY -> duty.anchorDate().plusDays(amount);
      case WEEK -> duty.anchorDate().plusWeeks(amount);
      case MONTH -> duty.anchorDate().plusMonths(amount);
    };
  }

  public boolean excluded(
      long employeeId, LocalDate start, LocalDate end, List<Exclusion> exclusions) {
    return exclusions.stream()
        .anyMatch(
            x ->
                x.employeeId() == employeeId
                    && !x.startDate().isAfter(end)
                    && !x.endDate().isBefore(start));
  }

  public List<Period> generate(
      Duty duty,
      List<Employee> employees,
      List<Exclusion> exclusions,
      List<Assignment> confirmed,
      LocalDate from,
      LocalDate to) {
    Map<Long, Employee> byId = new HashMap<>();
    employees.forEach(e -> byId.put(e.id(), e));
    var allocator = new RotationAllocator(duty, employees);
    var roster = allocator.roster();
    Map<LocalDate, List<Assignment>> published = new HashMap<>();
    confirmed.stream()
        .filter(a -> a.dutyId() == duty.id())
        .forEach(a -> published.computeIfAbsent(a.periodStart(), k -> new ArrayList<>()).add(a));
    List<Period> result = new ArrayList<>();
    int index = 0;
    for (; index < 4000; index++) {
      LocalDate start = boundary(duty, index);
      if (start.isAfter(to)) break;
      LocalDate end = boundary(duty, index + 1).minusDays(1);
      List<Employee> eligible =
          roster.stream()
              .filter(e -> e.active() && !excluded(e.id(), start, end, exclusions))
              .toList();
      List<Employee> selected = new ArrayList<>();
      String warning = null;
      if (eligible.size() < duty.assigneeCount()) {
        warning =
            "割当可能な人数が不足しています（"
                + eligible.size()
                + "/"
                + duty.assigneeCount()
                + "）。対象外の期間とメンバーの有効状態を確認してください。";
      } else {
        selected = new ArrayList<>(allocator.select(eligible));
      }
      boolean isConfirmed = published.containsKey(start);
      if (isConfirmed) {
        selected =
            published.get(start).stream()
                .sorted(Comparator.comparingInt(Assignment::slotIndex))
                .map(a -> byId.get(a.employeeId()))
                .toList();
        warning = null;
      }
      if (!end.isBefore(from))
        result.add(new Period(start, end, List.copyOf(selected), isConfirmed, warning));
    }
    if (index == 4000 && !boundary(duty, index).isAfter(to))
      throw new BadRequestException("開始日から計算できるのは最大4,000期間です。");
    return result;
  }
}
