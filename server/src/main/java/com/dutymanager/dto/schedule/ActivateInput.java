package com.dutymanager.dto.schedule;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record ActivateInput(@NotNull @Valid AutomaticInput draft, @NotBlank String token) {}
