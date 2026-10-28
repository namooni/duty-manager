package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.ScheduleRange;
import java.util.Optional;

public interface ScheduleRangeRepository {
  Optional<ScheduleRange> find(long dutyId);

  void save(long dutyId, ScheduleRange range);
}
