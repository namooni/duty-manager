package com.dutymanager.engine.schedule;

import com.dutymanager.model.schedule.*;
import java.time.LocalDate;
import java.util.List;

public final class SlotAssignmentResolver {
  private SlotAssignmentResolver() {}

  public record Segment(long employeeId, LocalDate start, LocalDate end, boolean segmented) {}

  public static Segment at(RotationSlot slot, List<SlotHandover> changes, LocalDate date) {
    long employee = slot.employeeId();
    LocalDate start = slot.periodStart(), end = slot.periodEnd();
    boolean segmented = false;
    for (var change : changes) {
      if (change.slotId() != slot.id()) continue;
      segmented = true;
      if (date != null && !change.date().isAfter(date)) {
        employee = change.employeeId();
        start = change.date();
      } else if (date != null
          && change.date().isAfter(date)
          && (end == null || change.date().minusDays(1).isBefore(end)))
        end = change.date().minusDays(1);
    }
    return new Segment(employee, start, end, segmented);
  }
}
