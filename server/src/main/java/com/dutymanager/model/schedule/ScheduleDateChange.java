package com.dutymanager.model.schedule;

import java.time.LocalDate;

public record ScheduleDateChange(String rotationKey, LocalDate date, String reason) {}
