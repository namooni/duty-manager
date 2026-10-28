package com.dutymanager.engine.rotation;

import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.Employee;
import java.util.*;

public final class RotationAllocator {
  private final Duty duty;
  private final List<Employee> roster;
  private final List<Employee> initial;
  private final long nextRound;
  private long cursor;

  public record Queue(List<Long> remaining, long round) {}

  public RotationAllocator(Duty duty, List<Employee> employees) {
    this(duty, employees, null, 1, false);
  }

  public RotationAllocator(
      Duty duty, List<Employee> employees, List<Long> first, long nextRound, boolean snapshot) {
    this.duty = duty;
    this.nextRound = nextRound;
    var byId = new HashMap<Long, Employee>();
    employees.forEach(e -> byId.put(e.id(), e));
    roster =
        new ArrayList<>(duty.memberIds().stream().map(byId::get).filter(Objects::nonNull).toList());
    if (!snapshot && duty.strategy() == Strategy.EMPLOYEE_NUMBER)
      roster.sort(Comparator.comparing(Employee::employeeNumber).thenComparingLong(Employee::id));
    initial =
        first == null ? order(0) : first.stream().map(byId::get).filter(Objects::nonNull).toList();
  }

  private List<Employee> order(long round) {
    var result = new ArrayList<>(roster);
    if (duty.strategy() == Strategy.SHUFFLED_ROUND)
      Collections.shuffle(result, new Random(duty.randomSeed() * 1000003L + round));
    return result;
  }

  public List<Employee> roster() {
    return List.copyOf(roster);
  }

  public Queue queue() {
    if (cursor < initial.size())
      return new Queue(
          initial.subList((int) cursor, initial.size()).stream().map(Employee::id).toList(),
          nextRound - 1);
    long offset = cursor - initial.size(), round = nextRound + offset / Math.max(1, roster.size());
    int position = (int) (offset % Math.max(1, roster.size()));
    return new Queue(
        order(round).subList(position, roster.size()).stream().map(Employee::id).toList(), round);
  }

  private Employee candidate() {
    if (cursor < initial.size()) return initial.get((int) cursor++);
    long offset = cursor++ - initial.size();
    return order(nextRound + offset / roster.size()).get((int) (offset % roster.size()));
  }

  public List<Employee> select(List<Employee> eligible) {
    if (eligible.size() < duty.assigneeCount()) return List.of();
    var ids = new HashSet<Long>();
    eligible.forEach(e -> ids.add(e.id()));
    var result = new ArrayList<Employee>();
    while (result.size() < duty.assigneeCount()) {
      var e = candidate();
      if (ids.contains(e.id()) && result.stream().noneMatch(p -> p.id() == e.id())) result.add(e);
    }
    return List.copyOf(result);
  }
}
