package com.dutymanager.model.schedule;

import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.employee.Employee;
import java.time.LocalDate;
import java.util.*;

public final class AssignmentReview {
  private AssignmentReview() {}

  public record History(
      long id,
      int startIndex,
      com.dutymanager.model.duty.Strategy strategy,
      int assigneeCount,
      String reason,
      java.time.Instant createdAt,
      boolean superseded) {}

  public record Boundary(int index, LocalDate start, LocalDate end) {}

  public record Current(
      long slotId,
      int slotIndex,
      LocalDate start,
      LocalDate end,
      Employee employee,
      Long originalEmployeeId) {}

  public record Context(
      Duty duty,
      List<Boundary> boundaries,
      List<Employee> employees,
      List<History> history,
      List<Current> currentAssignments,
      List<Long> nextCandidates,
      LocalDate handoverDate) {}

  public record Row(
      String key,
      long dutyId,
      String dutyName,
      int sequence,
      int slotIndex,
      LocalDate start,
      LocalDate end,
      Employee before,
      Employee after,
      boolean protectedAssignment,
      boolean conflict,
      List<Employee> choices,
      String message) {}

  public record Result(
      String token,
      List<Row> rows,
      List<String> warnings,
      boolean canApply,
      List<String> summaries,
      List<Row> currentRows) {}
}
