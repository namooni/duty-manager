package com.dutymanager.dto.duty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DutyDetailsInput(
    @NotBlank @Size(max = 100) String name,
    @NotNull @Size(max = 1000) String description,
    @NotNull @Size(max = 100) String expectedName,
    @NotNull @Size(max = 1000) String expectedDescription) {}
