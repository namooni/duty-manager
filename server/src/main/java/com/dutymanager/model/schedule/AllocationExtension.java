package com.dutymanager.model.schedule;

import java.time.LocalDate;

public record AllocationExtension(LocalDate plannedThrough, int additionalMeetings) {}
