package com.dutymanager.model.schedule;

import java.time.LocalDate;

public record ScheduleRange(LocalDate endDate, LocalDate plannedThrough) {
  public boolean includes(RotationTurn turn) {
    return turn.start() == null
        || (!turn.start().isAfter(plannedThrough)
            && (endDate == null || !turn.start().isAfter(endDate)));
  }

  public LocalDate limit(LocalDate requested) {
    return requested.isBefore(plannedThrough) ? requested : plannedThrough;
  }

  public RotationTurn trim(RotationTurn turn) {
    if (endDate == null || turn.end() == null || !turn.end().isAfter(endDate)) return turn;
    return new RotationTurn(
        turn.key(), turn.sequence(), turn.start(), endDate, turn.assignees(), turn.warning());
  }
}
