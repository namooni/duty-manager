package com.dutymanager.dto.schedule;

import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.schedule.AssignmentChange;
import jakarta.validation.constraints.*;
import java.util.*;

public record AssignmentChangeInput(
    @NotBlank String kind,
    Long dutyId,
    Long employeeId,
    Boolean active,
    @Min(0) Integer effectiveIndex,
    Strategy strategy,
    @Min(1) @Max(20) Integer assigneeCount,
    @Size(max = 200) List<@NotNull Long> memberIds,
    Long firstEmployeeId,
    @NotBlank @Size(max = 300) String reason,
    @Size(max = 10000) Map<@NotBlank String, @NotNull @Positive Long> replacements,
    @Size(max = 20) Map<@Positive Long, @NotNull @Positive Long> handovers) {
  public AssignmentChange command() {
    return new AssignmentChange(
        kind,
        dutyId,
        employeeId,
        active,
        effectiveIndex,
        strategy,
        assigneeCount,
        memberIds,
        firstEmployeeId,
        reason,
        replacements,
        handovers);
  }
}
