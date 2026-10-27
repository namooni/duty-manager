package com.dutymanager.dto.assignment;

import com.dutymanager.model.assignment.Change;

public record ChangeResponse(
    long id, String previousName, String newName, String reason, String changedAt) {
  public static ChangeResponse from(Change value) {
    return new ChangeResponse(
        value.id(), value.previousName(), value.newName(), value.reason(), value.changedAt());
  }
}
