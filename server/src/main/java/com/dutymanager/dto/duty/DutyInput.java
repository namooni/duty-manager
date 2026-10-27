package com.dutymanager.dto.duty;

import com.dutymanager.model.duty.DutyDefinition;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.duty.Unit;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record DutyInput(
    @NotBlank @Size(max = 100) String name,
    @NotNull @Size(max = 1000) String description,
    @NotNull LocalDate anchorDate,
    @Min(1) @Max(365) int intervalCount,
    @NotNull Unit intervalUnit,
    @NotNull Strategy strategy,
    @Min(1) @Max(20) int assigneeCount,
    @NotEmpty @Size(max = 200) List<@NotNull Long> memberIds) {
  public DutyDefinition toDefinition() {
    return new DutyDefinition(
        name,
        description,
        anchorDate,
        intervalCount,
        intervalUnit,
        strategy,
        assigneeCount,
        memberIds);
  }
}
