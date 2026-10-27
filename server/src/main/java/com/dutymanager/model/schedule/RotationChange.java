package com.dutymanager.model.schedule;

public record RotationChange(
    long id, String previousName, String newName, String reason, String changedAt) {}
