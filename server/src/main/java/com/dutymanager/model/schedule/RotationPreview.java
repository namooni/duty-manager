package com.dutymanager.model.schedule;

import java.util.List;

public record RotationPreview(String token, List<RotationTurn> turns, ScheduleRange range) {
  public RotationPreview(String token, List<RotationTurn> turns) {
    this(token, turns, null);
  }
}
