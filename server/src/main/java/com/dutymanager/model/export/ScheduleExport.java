package com.dutymanager.model.export;

import com.dutymanager.model.schedule.*;
import java.time.*;
import java.util.*;

public record ScheduleExport(
    AutomaticDuty config,
    LocalDate from,
    LocalDate to,
    ExportFormat format,
    ZonedDateTime generatedAt,
    List<WorkOccurrence> events,
    List<Holiday> holidays,
    List<String> notices) {
  public ScheduleExport {
    events = List.copyOf(events);
    holidays = List.copyOf(holidays);
    notices = List.copyOf(notices);
  }
}
