package com.dutymanager.model.assignment;

import java.time.LocalDate;

public record Assignment(
    long id,
    long dutyId,
    String dutyName,
    LocalDate periodStart,
    LocalDate periodEnd,
    long employeeId,
    String employeeName,
    int slotIndex) {}
