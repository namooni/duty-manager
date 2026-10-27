package com.dutymanager.model.duty;

import java.time.LocalDate;
import java.util.List;

public record Duty(
    long id,
    String name,
    String description,
    LocalDate anchorDate,
    int intervalCount,
    Unit intervalUnit,
    Strategy strategy,
    int assigneeCount,
    List<Long> memberIds,
    long randomSeed) {
  public Duty(
      long id,
      String name,
      String description,
      LocalDate anchorDate,
      int intervalCount,
      Unit intervalUnit,
      Strategy strategy,
      int assigneeCount,
      List<Long> memberIds) {
    this(
        id,
        name,
        description,
        anchorDate,
        intervalCount,
        intervalUnit,
        strategy,
        assigneeCount,
        memberIds,
        id);
  }

  public Duty {
    memberIds = List.copyOf(memberIds);
  }
}
