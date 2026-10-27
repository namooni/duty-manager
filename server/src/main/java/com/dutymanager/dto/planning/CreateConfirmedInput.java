package com.dutymanager.dto.planning;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateConfirmedInput(@NotNull @Valid DraftInput draft, @NotBlank String token) {}
