package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.SlotHandover;
import java.time.LocalDate;
import java.util.List;

public interface HandoverRepository {
  List<SlotHandover> find(long dutyId);

  void save(long slotId, LocalDate date, long previousEmployee, long employee, String reason);
}
