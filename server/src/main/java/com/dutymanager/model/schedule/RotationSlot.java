package com.dutymanager.model.schedule;

import java.time.LocalDate;

public record RotationSlot(
    long id,
    long dutyId,
    String rotationKey,
    int slotIndex,
    long employeeId,
    LocalDate periodStart,
    LocalDate periodEnd,
    boolean manualOverride) {
  public RotationSlot(
      long id,
      long dutyId,
      String rotationKey,
      int slotIndex,
      long employeeId,
      LocalDate periodStart,
      LocalDate periodEnd) {
    this(id, dutyId, rotationKey, slotIndex, employeeId, periodStart, periodEnd, false);
  }
}
