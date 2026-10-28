package com.dutymanager.model.schedule;

import java.time.LocalDate;

public record SlotHandover(long id, long slotId, LocalDate date, long employeeId, String reason) {}
