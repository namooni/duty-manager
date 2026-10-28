package com.dutymanager.dto.schedule;

import com.dutymanager.dto.employee.EmployeeResponse;
import com.dutymanager.model.schedule.*;
import java.time.*;
import java.util.*;

public final class ScheduleDateResponses {
  private ScheduleDateResponses() {}

  public record Period(
      String rotationKey, LocalDate start, LocalDate end, List<EmployeeResponse> assignees) {
    static Period from(ScheduleDateReview.Period p) {
      return new Period(
          p.rotationKey(),
          p.start(),
          p.end(),
          p.assignees().stream().map(EmployeeResponse::from).toList());
    }
  }

  public record History(
      long id,
      String rotationKey,
      LocalDate previousStart,
      LocalDate previousEnd,
      LocalDate newStart,
      LocalDate newEnd,
      String reason,
      Instant createdAt) {
    public static History from(ScheduleDateReview.History h) {
      return new History(
          h.id(),
          h.rotationKey(),
          h.previousStart(),
          h.previousEnd(),
          h.newStart(),
          h.newEnd(),
          h.reason(),
          h.createdAt());
    }
  }

  public record Context(
      String dutyName,
      RotationMode mode,
      LocalDate minimum,
      LocalDate maximum,
      LocalDate currentDate,
      List<Period> periods,
      List<History> history) {
    public static Context from(ScheduleDateReview.Context c) {
      return new Context(
          c.dutyName(),
          c.mode(),
          c.minimum(),
          c.maximum(),
          c.currentDate(),
          c.periods().stream().map(Period::from).toList(),
          c.history().stream().map(History::from).toList());
    }
  }

  public record Row(Period before, Period after) {
    static Row from(ScheduleDateReview.Row r) {
      return new Row(Period.from(r.before()), Period.from(r.after()));
    }
  }

  public record Result(String token, List<Row> rows, List<String> warnings) {
    public static Result from(ScheduleDateReview.Result r) {
      return new Result(r.token(), r.rows().stream().map(Row::from).toList(), r.warnings());
    }
  }
}
