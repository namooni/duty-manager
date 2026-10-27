package com.dutymanager.dto.planning;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ConfirmInput(
    @NotNull LocalDate from, @NotNull LocalDate to, @NotBlank String token) {}
