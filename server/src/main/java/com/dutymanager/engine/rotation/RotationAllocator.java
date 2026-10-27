package com.dutymanager.engine.rotation;

import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.employee.Employee;
import java.util.*;

/** One cursor per calculation; replacements do not change the subsequent cursor. */
public final class RotationAllocator {
  private final Duty duty;
  private final List<Employee> roster;
  private long cursor;

  public RotationAllocator(Duty duty, List<Employee> employees) {
    this.duty = duty;
    var byId = new HashMap<Long, Employee>();
    employees.forEach(e -> byId.put(e.id(), e));
    roster =
        new ArrayList<>(duty.memberIds().stream().map(byId::get).filter(Objects::nonNull).toList());
    if (duty.strategy() == Strategy.EMPLOYEE_NUMBER)
      roster.sort(Comparator.comparing(Employee::employeeNumber).thenComparingLong(Employee::id));
  }

  public List<Employee> roster() {
    return List.copyOf(roster);
  }

  public List<Employee> select(List<Employee> eligible) {
    if (eligible.size() < duty.assigneeCount()) return List.of();
    var ids = new HashSet<Long>();
    eligible.forEach(e -> ids.add(e.id()));
    var result = new ArrayList<Employee>();
    while (result.size() < duty.assigneeCount()) {
      long round = cursor / roster.size();
      int position = (int) (cursor % roster.size());
      var order = new ArrayList<>(roster);
      if (duty.strategy() == Strategy.SHUFFLED_ROUND)
        Collections.shuffle(order, new Random(duty.randomSeed() * 1000003L + round));
      var candidate = order.get(position);
      cursor++;
      if (ids.contains(candidate.id()) && result.stream().noneMatch(e -> e.id() == candidate.id()))
        result.add(candidate);
    }
    return List.copyOf(result);
  }
}
