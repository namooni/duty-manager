package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.ScheduleDateReview.History;
import java.time.LocalDate;
import java.util.*;

public interface ScheduleDateRepository {
  List<History> history(long dutyId);

  void updatePeriod(long dutyId, String key, LocalDate start, LocalDate end);

  void record(
      long dutyId,
      String key,
      LocalDate oldStart,
      LocalDate oldEnd,
      LocalDate start,
      LocalDate end,
      String reason);
}
