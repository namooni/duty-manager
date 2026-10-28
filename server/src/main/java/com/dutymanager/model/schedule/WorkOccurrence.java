package com.dutymanager.model.schedule;

import java.time.LocalDate;
import java.util.List;

public record WorkOccurrence(
    long dutyId,
    String dutyName,
    int sequence,
    LocalDate date,
    RotationMode rotationMode,
    String rotationKey,
    LocalDate periodStart,
    LocalDate periodEnd,
    List<WorkAssignee> assignees,
    String warning,
    boolean holiday,
    boolean dateEditable,
    boolean segmented) {}
