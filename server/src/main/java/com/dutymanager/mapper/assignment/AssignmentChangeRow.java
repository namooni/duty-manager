package com.dutymanager.mapper.assignment;

import com.dutymanager.model.assignment.Change;
import java.sql.Timestamp;

public record AssignmentChangeRow(
    long id, String previousName, String newName, String reason, Timestamp changedAt) {
  public Change toDomain() {
    return new Change(id, previousName, newName, reason, changedAt.toString());
  }
}
