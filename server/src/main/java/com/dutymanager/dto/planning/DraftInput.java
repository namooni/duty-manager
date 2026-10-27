package com.dutymanager.dto.planning;

import com.dutymanager.dto.duty.DutyInput;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record DraftInput(
    @NotNull @Valid DutyInput duty,
    @NotNull LocalDate from,
    @NotNull LocalDate to,
    @Min(1) @Max(2147483647) long seed) {}
