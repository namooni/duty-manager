package com.dutymanager.dto.duty;

import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.duty.Unit;
import java.time.LocalDate;
import java.util.List;

public record DutyResponse(
    long id,
    String name,
    String description,
    LocalDate anchorDate,
    int intervalCount,
    Unit intervalUnit,
    Strategy strategy,
    int assigneeCount,
    List<Long> memberIds) {
  public static DutyResponse from(Duty value) {
    return new DutyResponse(
        value.id(),
        value.name(),
        value.description(),
        value.anchorDate(),
        value.intervalCount(),
        value.intervalUnit(),
        value.strategy(),
        value.assigneeCount(),
        value.memberIds());
  }
}
