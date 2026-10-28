package com.dutymanager.dto.export;

import com.dutymanager.model.export.ExportFormat;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ScheduleExportInput(
    @NotNull LocalDate from,
    @NotNull LocalDate to,
    @NotNull ExportFormat format,
    boolean includeUndated) {}
