package com.dutymanager.model.schedule;

import java.util.List;

public record ScheduleResult(List<WorkOccurrence> occurrences, List<AutomaticDuty> duties) {}
