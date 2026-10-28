package com.dutymanager.dto.schedule;

import com.dutymanager.dto.duty.DutyResponse;
import com.dutymanager.dto.employee.EmployeeResponse;
import com.dutymanager.model.schedule.AssignmentReview;
import java.time.LocalDate;
import java.util.List;

public final class AssignmentChangeResponses {
  private AssignmentChangeResponses() {}

  public record Current(
      long slotId,
      int slotIndex,
      LocalDate start,
      LocalDate end,
      EmployeeResponse employee,
      Long originalEmployeeId) {
    static Current from(AssignmentReview.Current c) {
      return new Current(
          c.slotId(),
          c.slotIndex(),
          c.start(),
          c.end(),
          EmployeeResponse.from(c.employee()),
          c.originalEmployeeId());
    }
  }

  public record Context(
      DutyResponse duty,
      List<AssignmentReview.Boundary> boundaries,
      List<EmployeeResponse> employees,
      List<AssignmentReview.History> history,
      List<Current> currentAssignments,
      List<Long> nextCandidates,
      LocalDate handoverDate) {
    public static Context from(AssignmentReview.Context c) {
      return new Context(
          DutyResponse.from(c.duty()),
          c.boundaries(),
          c.employees().stream().map(EmployeeResponse::from).toList(),
          c.history(),
          c.currentAssignments().stream().map(Current::from).toList(),
          c.nextCandidates(),
          c.handoverDate());
    }
  }

  public record Row(
      String key,
      long dutyId,
      String dutyName,
      int sequence,
      int slotIndex,
      LocalDate start,
      LocalDate end,
      EmployeeResponse before,
      EmployeeResponse after,
      boolean protectedAssignment,
      boolean conflict,
      List<EmployeeResponse> choices,
      String message) {
    static Row from(AssignmentReview.Row r) {
      return new Row(
          r.key(),
          r.dutyId(),
          r.dutyName(),
          r.sequence(),
          r.slotIndex(),
          r.start(),
          r.end(),
          r.before() == null ? null : EmployeeResponse.from(r.before()),
          r.after() == null ? null : EmployeeResponse.from(r.after()),
          r.protectedAssignment(),
          r.conflict(),
          r.choices().stream().map(EmployeeResponse::from).toList(),
          r.message());
    }
  }

  public record Result(
      String token,
      List<Row> rows,
      List<String> warnings,
      boolean canApply,
      List<String> summaries,
      List<Row> currentRows) {
    public static Result from(AssignmentReview.Result r) {
      return new Result(
          r.token(),
          r.rows().stream().map(Row::from).toList(),
          r.warnings(),
          r.canApply(),
          r.summaries(),
          r.currentRows().stream().map(Row::from).toList());
    }
  }
}
