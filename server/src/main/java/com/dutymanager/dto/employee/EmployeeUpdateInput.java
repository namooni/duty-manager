package com.dutymanager.dto.employee;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record EmployeeUpdateInput(
    @NotNull @Valid EmployeeInput employee, @NotNull @Valid EmployeeInput expected) {}
