package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.*;
import java.time.LocalDate;
import java.util.*;

public interface ScheduleRepository {
  Map<Long, ScheduleRule> rules();

  void saveRule(long dutyId, ScheduleRule rule);

  List<Meeting> meetings(long dutyId);

  void saveMeeting(long dutyId, int sequence, LocalDate date);

  void updateMeeting(long dutyId, int sequence, LocalDate date);

  List<RotationSlot> slots(long dutyId);

  Optional<RotationSlot> slot(long id);

  void saveTurn(long dutyId, RotationTurn turn);

  void replace(RotationSlot slot, long employeeId, String reason);

  List<RotationChange> changes(long id);

  List<Holiday> holidays();

  void saveHoliday(Holiday holiday);

  void deleteHoliday(LocalDate date);
}
