package com.dutymanager.model.schedule;

import com.dutymanager.model.employee.Employee;
import java.time.*;
import java.util.*;

public final class ScheduleDateReview {
  private ScheduleDateReview() {}

  public record Period(
      String rotationKey, LocalDate start, LocalDate end, List<Employee> assignees) {}

  public record History(
      long id,
      String rotationKey,
      LocalDate previousStart,
      LocalDate previousEnd,
      LocalDate newStart,
      LocalDate newEnd,
      String reason,
      Instant createdAt) {}

  public record Context(
      String dutyName,
      RotationMode mode,
      LocalDate minimum,
      LocalDate maximum,
      LocalDate currentDate,
      List<Period> periods,
      List<History> history) {}

  public record Row(Period before, Period after) {}

  public record Result(String token, List<Row> rows, List<String> warnings) {}
}
