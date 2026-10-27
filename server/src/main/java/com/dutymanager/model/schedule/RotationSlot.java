package com.dutymanager.model.schedule;

import java.time.LocalDate;

public record RotationSlot(
    long id,
    long dutyId,
    String rotationKey,
    int slotIndex,
    long employeeId,
    LocalDate periodStart,
    LocalDate periodEnd) {}
