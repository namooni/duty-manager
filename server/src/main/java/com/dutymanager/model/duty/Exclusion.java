package com.dutymanager.model.duty;

import java.time.LocalDate;

public record Exclusion(
    long id, long dutyId, long employeeId, LocalDate startDate, LocalDate endDate, String reason) {}
