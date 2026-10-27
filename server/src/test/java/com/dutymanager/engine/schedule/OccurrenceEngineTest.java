package com.dutymanager.engine.schedule;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.model.schedule.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class OccurrenceEngineTest {
  final OccurrenceEngine engine = new OccurrenceEngine();

  ScheduleRule rule(Recurrence type, int day, int ordinal, int weekday) {
    return new ScheduleRule(type, RotationMode.OCCURRENCE, List.of(2, 4), 3, day, ordinal, weekday);
  }

  @Test
  void monthlyDaySkipsMissingDaysAndSupportsEndOfMonth() {
    var anchor = LocalDate.of(2027, 1, 1);
    var end = LocalDate.of(2027, 3, 31);
    assertThat(
            engine
                .generate(rule(Recurrence.MONTHLY_DAY, 31, 1, 1), anchor, end, 0, Set.of())
                .stream()
                .map(Meeting::date))
        .containsExactly(LocalDate.of(2027, 1, 31), LocalDate.of(2027, 3, 31));
    assertThat(
            engine
                .generate(rule(Recurrence.MONTHLY_DAY, 0, 1, 1), anchor, end, 0, Set.of())
                .stream()
                .map(Meeting::date))
        .containsExactly(
            LocalDate.of(2027, 1, 31), LocalDate.of(2027, 2, 28), LocalDate.of(2027, 3, 31));
  }

  @Test
  void nthWeekdayAndLastWeekdayAreCalendarRules() {
    var anchor = LocalDate.of(2027, 2, 1);
    var end = LocalDate.of(2027, 2, 28);
    assertThat(
            engine.generate(
                rule(Recurrence.MONTHLY_NTH_WEEKDAY, 1, 5, 1), anchor, end, 0, Set.of()))
        .isEmpty();
    assertThat(
            engine
                .generate(rule(Recurrence.MONTHLY_NTH_WEEKDAY, 1, 0, 1), anchor, end, 0, Set.of())
                .getFirst()
                .date())
        .isEqualTo(LocalDate.of(2027, 2, 22));
  }

  @Test
  void dayIntervalAndWeekdaysAreIndependentOfRotation() {
    var anchor = LocalDate.of(2027, 2, 1);
    assertThat(
            engine
                .generate(
                    rule(Recurrence.DAILY_INTERVAL, 1, 1, 1),
                    anchor,
                    anchor.plusDays(8),
                    0,
                    Set.of())
                .stream()
                .map(Meeting::date))
        .containsExactly(anchor, anchor.plusDays(3), anchor.plusDays(6));
    assertThat(
            engine
                .generate(rule(Recurrence.WEEKLY, 1, 1, 1), anchor, anchor.plusDays(6), 0, Set.of())
                .stream()
                .map(Meeting::date))
        .containsExactly(anchor.plusDays(1), anchor.plusDays(3));
  }
}
