package com.dutymanager.engine.schedule;

import com.dutymanager.model.schedule.*;
import java.time.*;
import java.time.temporal.*;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class OccurrenceEngine {
  public boolean matches(ScheduleRule rule, LocalDate anchor, LocalDate date) {
    return switch (rule.recurrence()) {
      case WORKDAYS -> date.getDayOfWeek().getValue() <= 5;
      case WEEKLY -> rule.weekdays().contains(date.getDayOfWeek().getValue());
      case DAILY_INTERVAL -> ChronoUnit.DAYS.between(anchor, date) % rule.everyDays() == 0;
      case MONTHLY_DAY ->
          date.getDayOfMonth() == (rule.monthDay() == 0 ? date.lengthOfMonth() : rule.monthDay());
      case MONTHLY_NTH_WEEKDAY ->
          date.getDayOfWeek().getValue() == rule.weekday()
              && (rule.monthOrdinal() == 0
                  ? date.plusWeeks(1).getMonth() != date.getMonth()
                  : (date.getDayOfMonth() - 1) / 7 + 1 == rule.monthOrdinal());
      case EXPLICIT_DATES -> false;
    };
  }

  public List<Meeting> generate(
      ScheduleRule rule, LocalDate anchor, LocalDate to, int count, Set<LocalDate> holidays) {
    var result = new ArrayList<Meeting>();
    // count > 0 is a first-cycle sample; otherwise enumerate only through the requested date.
    for (int day = 0; day < 100000; day++) {
      var date = anchor.plusDays(day);
      if (count == 0 && date.isAfter(to)) return result;
      if (matches(rule, anchor, date)) {
        result.add(new Meeting(result.size(), date));
        if (count > 0 && result.size() == count) return result;
      }
    }
    throw new com.dutymanager.exception.BadRequestException("計算できる日付の範囲を超えています。");
  }
}
