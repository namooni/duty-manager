package com.dutymanager.model.duty;

import java.time.LocalDate;
import java.util.List;

public record DutyDefinition(
    String name,
    String description,
    LocalDate anchorDate,
    int intervalCount,
    Unit intervalUnit,
    Strategy strategy,
    int assigneeCount,
    List<Long> memberIds) {
  public DutyDefinition {
    memberIds = List.copyOf(memberIds);
  }
}
