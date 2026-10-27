package com.dutymanager.model.duty;

import java.time.LocalDate;

public record ExclusionDefinition(
    long employeeId, LocalDate startDate, LocalDate endDate, String reason) {}
