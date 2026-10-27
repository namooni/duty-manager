package com.dutymanager.service.schedule;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.ScheduleRepository;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AutomaticDutyServiceTest {
  @Autowired AutomaticDutyService service;
  @Autowired LiveScheduleService live;
  @Autowired MeetingScheduleService meetings;
  @Autowired RotationSlotService rotations;
  @Autowired CompanyCalendarService calendar;
  @Autowired EmployeeRepository employees;
  @Autowired ScheduleRepository schedules;
  @Autowired JdbcTemplate db;
  @Autowired Clock clock;
  List<Long> ids;
  LocalDate anchor;

  @BeforeEach
  void setup() {
    ids = new ArrayList<>();
    for (int i = 0; i < 5; i++)
      ids.add(employees.save(new EmployeeDefinition("AUTO" + i, "担当" + i)));
    anchor = LocalDate.now(clock).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
  }

  ScheduleRule rule(Recurrence type, RotationMode mode) {
    return new ScheduleRule(type, mode, List.of(1, 3, 5), 3, 20, 2, 5);
  }

  AutomaticDefinition input(ScheduleRule rule, List<LocalDate> dates, Strategy strategy) {
    return new AutomaticDefinition(
        new DutyDefinition("定例会", "", anchor, 1, Unit.MONTH, strategy, 1, ids), rule, dates, 12345);
  }

  long activate(AutomaticDefinition input) {
    return service.activate(input, service.preview(input).token());
  }

  @Test
  void twelveExplicitMeetingsUseAllTwelveDatesAndRepeatFiveParticipants() {
    var dates =
        java.util.stream.IntStream.range(0, 12).mapToObj(i -> anchor.plusMonths(i)).toList();
    var definition =
        input(
            rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE),
            dates,
            Strategy.EMPLOYEE_NUMBER);
    var preview = service.preview(definition);
    assertThat(preview.turns()).hasSize(12);
    for (int index = 0; index < 12; index++) {
      assertThat(preview.turns().get(index).start()).isEqualTo(dates.get(index));
      assertThat(preview.turns().get(index).assignees().getFirst().id())
          .isEqualTo(ids.get(index % 5));
    }
    long id = service.activate(definition, preview.token());
    assertThat(schedules.meetings(id)).hasSize(13);
    assertThat(schedules.slots(id)).hasSize(12);
  }

  @Test
  void monthlyRecurringPreviewCanShowTwelveTurnsAndRetainsTheSameRandomOrder() {
    var base =
        input(
            rule(Recurrence.MONTHLY_DAY, RotationMode.OCCURRENCE),
            List.of(),
            Strategy.SHUFFLED_ROUND);
    var shortPreview = service.preview(base);
    var longDefinition =
        new AutomaticDefinition(base.duty(), base.schedule(), base.dates(), base.seed(), 12);
    var longer = service.preview(longDefinition);
    assertThat(longer.turns()).hasSize(12);
    assertThat(longer.turns().subList(0, 5)).isEqualTo(shortPreview.turns());
    long id = service.activate(longDefinition, longer.token());
    assertThat(schedules.slots(id)).hasSize(12);
  }

  @Test
  void previewShowsFivePeopleWithoutSavingAndUndatedMeetingsAreNotMonthLongPeriods() {
    var input =
        input(
            rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE),
            List.of(anchor.plusDays(10), anchor.plusDays(40)),
            Strategy.EMPLOYEE_NUMBER);
    int before = db.queryForObject("SELECT COUNT(*) FROM duties", Integer.class);
    var preview = service.preview(input);
    assertThat(preview.turns()).hasSize(5);
    assertThat(preview.turns().stream().flatMap(t -> t.assignees().stream()).map(Employee::id))
        .containsExactlyElementsOf(ids);
    assertThat(preview.turns().get(0).start()).isEqualTo(anchor.plusDays(10));
    assertThat(preview.turns().get(0).end()).isEqualTo(preview.turns().get(0).start());
    assertThat(preview.turns().get(2).start()).isNull();
    assertThat(db.queryForObject("SELECT COUNT(*) FROM duties", Integer.class)).isEqualTo(before);
  }

  @Test
  void explicitDatesCanBeRegisteredAndMovedWithoutChangingTheAssignee() {
    long id =
        activate(
            input(
                rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE),
                List.of(),
                Strategy.EMPLOYEE_NUMBER));
    var pending =
        live.schedule(anchor, anchor.plusDays(60)).occurrences().stream()
            .filter(o -> o.dutyId() == id)
            .toList();
    assertThat(pending).hasSize(1);
    assertThat(pending.getFirst().date()).isNull();
    long slot = pending.getFirst().assignees().getFirst().slotId();
    meetings.updateMeeting(id, 0, anchor.plusDays(10));
    meetings.updateMeeting(id, 0, anchor.plusDays(15));
    var rows =
        live.schedule(anchor, anchor.plusDays(60)).occurrences().stream()
            .filter(o -> o.dutyId() == id)
            .toList();
    assertThat(rows).hasSize(2);
    assertThat(rows.getFirst().date()).isEqualTo(anchor.plusDays(15));
    assertThat(rows.getFirst().assignees().getFirst().slotId()).isEqualTo(slot);
    assertThat(rows.getFirst().assignees().getFirst().employeeId()).isEqualTo(ids.getFirst());
    assertThat(rows.getLast().date()).isNull();
    assertThat(rows.getLast().assignees().getFirst().employeeId()).isEqualTo(ids.get(1));
  }

  @Test
  void recurringMonthlyWorkContinuesPastOneCycleWithoutAnotherConfirmation() {
    long id =
        activate(
            input(
                rule(Recurrence.MONTHLY_DAY, RotationMode.OCCURRENCE), List.of(), Strategy.CUSTOM));
    var rows =
        live.schedule(anchor, anchor.plusDays(300)).occurrences().stream()
            .filter(o -> o.dutyId() == id)
            .toList();
    assertThat(rows.size()).isGreaterThan(5);
    assertThat(rows.get(5).assignees().getFirst().employeeId()).isEqualTo(ids.getFirst());
    assertThat(rows)
        .allMatch(o -> o.date().getDayOfMonth() == 20 && o.periodStart().equals(o.periodEnd()));
  }

  @Test
  void workingDaysAndWeeklyOwnershipRemainSeparateAcrossHolidays() {
    var rule = rule(Recurrence.WORKDAYS, RotationMode.CALENDAR);
    var input =
        new AutomaticDefinition(
            new DutyDefinition("朝会", "", anchor, 1, Unit.WEEK, Strategy.CUSTOM, 1, ids),
            rule,
            List.of(),
            12345);
    long id = activate(input);
    calendar.saveHoliday(new Holiday(anchor.plusDays(1), "会社休業"));
    calendar.saveHoliday(new Holiday(anchor.plusDays(2), "会社休業"));
    var rows =
        live.schedule(anchor, anchor.plusDays(11)).occurrences().stream()
            .filter(o -> o.dutyId() == id)
            .toList();
    var first = rows.stream().filter(o -> o.date().isBefore(anchor.plusWeeks(1))).toList();
    assertThat(first).hasSize(5);
    assertThat(first.stream().filter(o -> !o.holiday())).hasSize(3);
    assertThat(first).allMatch(o -> o.assignees().getFirst().employeeId() == ids.getFirst());
    assertThat(rows.stream().filter(o -> !o.date().isBefore(anchor.plusWeeks(1))))
        .allMatch(o -> o.assignees().getFirst().employeeId() == ids.get(1));
  }

  @Test
  void dateOrderAndDuplicateDatesAreRejected() {
    assertThatThrownBy(
            () ->
                service.preview(
                    input(
                        rule(Recurrence.EXPLICIT_DATES, RotationMode.CALENDAR),
                        List.of(),
                        Strategy.CUSTOM)))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(
            () ->
                service.preview(
                    input(
                        rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE),
                        List.of(anchor, anchor),
                        Strategy.CUSTOM)))
        .isInstanceOf(BadRequestException.class);
    long id =
        activate(
            input(
                rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE),
                List.of(anchor.plusDays(10), anchor.plusDays(20)),
                Strategy.CUSTOM));
    assertThatThrownBy(() -> meetings.updateMeeting(id, 0, anchor.plusDays(21)))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void replacementKeepsFollowingTurnsAndStoresHistoryThroughMyBatis() {
    long id =
        activate(
            input(
                rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE),
                List.of(anchor.plusDays(10), anchor.plusDays(40)),
                Strategy.CUSTOM));
    var initial =
        live.schedule(anchor, anchor.plusDays(80)).occurrences().stream()
            .filter(o -> o.dutyId() == id)
            .toList();
    long slot = initial.getFirst().assignees().getFirst().slotId();
    rotations.replace(slot, ids.get(3), "代理");
    var rows =
        live.schedule(anchor, anchor.plusDays(80)).occurrences().stream()
            .filter(o -> o.dutyId() == id)
            .toList();
    assertThat(rows.getFirst().assignees().getFirst().employeeId()).isEqualTo(ids.get(3));
    assertThat(rows.get(1).assignees().getFirst().employeeId()).isEqualTo(ids.get(1));
    assertThat(rotations.changes(slot)).hasSize(1);
    assertThat(rotations.changes(slot).getFirst().reason()).isEqualTo("代理");
  }

  @Test
  void staleTokenDoesNotCreateAnyDuty() {
    var input =
        input(rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE), List.of(), Strategy.CUSTOM);
    int before = db.queryForObject("SELECT COUNT(*) FROM duties", Integer.class);
    assertThatThrownBy(() -> service.activate(input, "stale"))
        .isInstanceOf(ConflictException.class);
    assertThat(db.queryForObject("SELECT COUNT(*) FROM duties", Integer.class)).isEqualTo(before);
  }

  @Test
  void randomPreviewAndPublishedSlotsMatch() {
    var input =
        input(
            rule(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE),
            List.of(anchor.plusDays(3), anchor.plusDays(40)),
            Strategy.SHUFFLED_ROUND);
    var preview = service.preview(input);
    long id = service.activate(input, preview.token());
    var slots = schedules.slots(id);
    for (int index = 0; index < 5; index++)
      assertThat(slots.get(index).employeeId())
          .isEqualTo(preview.turns().get(index).assignees().getFirst().id());
  }
}
