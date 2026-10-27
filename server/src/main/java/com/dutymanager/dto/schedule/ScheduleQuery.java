package com.dutymanager.dto.schedule;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ScheduleQuery(@NotNull LocalDate from, @NotNull LocalDate to) {}
