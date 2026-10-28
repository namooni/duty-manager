package com.dutymanager.model.schedule;

import com.dutymanager.model.duty.Strategy;
import java.util.*;

public record AssignmentChange(
    String kind,
    Long dutyId,
    Long employeeId,
    Boolean active,
    Integer effectiveIndex,
    Strategy strategy,
    Integer assigneeCount,
    List<Long> memberIds,
    Long firstEmployeeId,
    String reason,
    Map<String, Long> replacements,
    Map<Long, Long> handovers) {
  public AssignmentChange(
      String kind,
      Long dutyId,
      Long employeeId,
      Boolean active,
      Integer effectiveIndex,
      Strategy strategy,
      Integer count,
      List<Long> members,
      Long first,
      String reason,
      Map<String, Long> replacements) {
    this(
        kind,
        dutyId,
        employeeId,
        active,
        effectiveIndex,
        strategy,
        count,
        members,
        first,
        reason,
        replacements,
        Map.of());
  }

  public AssignmentChange withHandovers(Map<Long, Long> values) {
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
        values);
  }

  public AssignmentChange {
    handovers =
        Collections.unmodifiableMap(new TreeMap<>(handovers == null ? Map.of() : handovers));
    memberIds = memberIds == null ? List.of() : List.copyOf(memberIds);
    replacements =
        Collections.unmodifiableMap(new TreeMap<>(replacements == null ? Map.of() : replacements));
  }
}
