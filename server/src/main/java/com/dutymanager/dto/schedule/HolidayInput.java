package com.dutymanager.dto.schedule;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record HolidayInput(@NotNull LocalDate date, @NotBlank @Size(max = 100) String name) {}
