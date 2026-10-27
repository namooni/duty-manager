package com.dutymanager.model.assignment;

public record Change(
    long id, String previousName, String newName, String reason, String changedAt) {}
