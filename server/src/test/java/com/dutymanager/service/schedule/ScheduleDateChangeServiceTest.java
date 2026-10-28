package com.dutymanager.service.schedule;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ScheduleDateChangeServiceTest {
  @Autowired AutomaticDutyService automatic;
  @Autowired ScheduleDateChangeService dates;
  @Autowired LiveScheduleService live;
  @Autowired ScheduleRepository schedules;
  @Autowired ScheduleDateRepository history;
  @Autowired EmployeeRepository employees;
  @Autowired ScheduleAllocationService allocations;
  @Autowired AssignmentChangeService changes;
  @Autowired RotationSlotService rotations;
  @Autowired CompanyCalendarService calendar;
  @Autowired com.dutymanager.service.duty.DutyService duties;
  @Autowired ExclusionRepository exclusions;
  @Autowired Clock clock;
  LocalDate anchor;
  List<Long> ids;
  long id;

  @BeforeEach
  void setup() {
    anchor = LocalDate.now(clock).plusDays(14);
    ids = new ArrayList<>();
    for (int i = 0; i < 5; i++)
      ids.add(employees.save(new EmployeeDefinition("DATE" + i, "担当" + i)));
    id = weekly(anchor);
  }

  long create(AutomaticDefinition input) {
    return automatic.activate(input, automatic.preview(input).token());
  }

  long weekly(LocalDate start) {
    return create(
        new AutomaticDefinition(
            new DutyDefinition("週当番", "", start, 1, Unit.WEEK, Strategy.CUSTOM, 1, ids),
            new ScheduleRule(
                Recurrence.WORKDAYS, RotationMode.CALENDAR, List.of(1, 2, 3, 4, 5), 1, 1, 1, 1),
            List.of(),
            1234,
            0,
            null,
            start.plusDays(27)));
  }

  ScheduleDateChange command(String key, LocalDate date) {
    return new ScheduleDateChange(key, date, "実施日調整");
  }

  void apply(String key, LocalDate date) {
    var input = command(key, date);
    dates.confirm(id, input, dates.preview(id, input).token());
  }

  RotationSlot slot(String key) {
    return schedules.slots(id).stream()
        .filter(s -> s.rotationKey().equals(key))
        .findFirst()
        .orElseThrow();
  }

  @Test
  void calendarDateChangesAreRejectedWithoutModifyingAssignments() {
    var before = schedules.slots(id);
    var input = command("C:1", anchor.plusDays(9));
    assertThatThrownBy(() -> dates.context(id, "C:1")).isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> dates.preview(id, input)).isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> dates.confirm(id, input, "previously-issued-token"))
        .isInstanceOf(ConflictException.class);
    assertThat(schedules.slots(id)).isEqualTo(before);
    assertThat(history.history(id)).isEmpty();
    assertThat(live.schedule(id, anchor, anchor.plusDays(27)).occurrences())
        .noneMatch(WorkOccurrence::dateEditable);
  }

  void legacyBoundary() {
    var first = slot("C:0");
    var next = slot("C:1");
    history.updatePeriod(id, "C:0", anchor, anchor.plusDays(8));
    history.updatePeriod(id, "C:1", anchor.plusDays(9), next.periodEnd());
    history.record(
        id, "C:0", first.periodStart(), first.periodEnd(), anchor, anchor.plusDays(8), "以前の変更");
    history.record(
        id,
        "C:1",
        next.periodStart(),
        next.periodEnd(),
        anchor.plusDays(9),
        next.periodEnd(),
        "以前の変更");
  }

  @Test
  void scheduleQueriesUseMovedBoundariesAndNeverDuplicateOrDropAnExecution() {
    legacyBoundary();
    var result = live.schedule(id, anchor, anchor.plusDays(27));
    assertThat(result.occurrences()).hasSize(20);
    assertThat(result.occurrences())
        .allSatisfy(
            event -> {
              if (event.date().isBefore(anchor.plusDays(9)))
                assertThat(event.assignees().getFirst().employeeId()).isEqualTo(ids.get(0));
            });
    assertThat(result.occurrences().stream().map(WorkOccurrence::date).distinct().count())
        .isEqualTo(20);
  }

  @Test
  void shiftedBoundariesSurviveRuleChangesAndExtension() {
    legacyBoundary();
    var original = slot("C:0");
    var edit =
        new AssignmentChange(
            "DUTY", id, null, null, 1, Strategy.CUSTOM, 1, ids, null, "参加者確認", Map.of());
    changes.confirm(edit, changes.preview(edit).token());
    assertThat(slot("C:0").periodEnd()).isEqualTo(anchor.plusDays(8));
    assertThat(slot("C:1").periodStart()).isEqualTo(anchor.plusDays(9));
    var extension = new AllocationExtension(anchor.plusDays(41), 0);
    allocations.confirm(id, extension, allocations.preview(id, extension).token());
    assertThat(schedules.slot(original.id()).orElseThrow().periodEnd())
        .isEqualTo(anchor.plusDays(8));
    assertThat(slot("C:4").employeeId()).isEqualTo(ids.get(4));
  }

  @Test
  void stalePreviewCannotOverwriteAConcurrentAssigneeChange() {
    id = monthly(Recurrence.MONTHLY_DAY, List.of());
    var input = command("E:0", anchor.plusDays(1));
    var preview = dates.preview(id, input);
    var original = slot("E:0");
    rotations.replace(original.id(), ids.get(4), "同時変更");
    assertThatThrownBy(() -> dates.confirm(id, input, preview.token()))
        .isInstanceOf(ConflictException.class);
    assertThat(slot("E:0").periodStart()).isEqualTo(original.periodStart());
    assertThat(history.history(id)).isEmpty();
  }

  @Test
  void changingBackToTheOriginalDateStillInvalidatesAnEarlierPreview() {
    id = monthly(Recurrence.MONTHLY_DAY, List.of());
    var original = slot("E:0").periodStart();
    var input = command("E:0", anchor.plusDays(1));
    var preview = dates.preview(id, input);
    apply("E:0", anchor.plusDays(2));
    apply("E:0", original);
    assertThatThrownBy(() -> dates.confirm(id, input, preview.token()))
        .isInstanceOf(ConflictException.class);
  }

  long monthly(Recurrence recurrence, List<LocalDate> listed) {
    return create(
        new AutomaticDefinition(
            new DutyDefinition("定例会", "", anchor, 1, Unit.MONTH, Strategy.CUSTOM, 1, ids),
            new ScheduleRule(recurrence, RotationMode.OCCURRENCE, List.of(), 1, 0, 1, 1),
            listed,
            1234,
            0,
            null,
            anchor.plusMonths(4)));
  }

  @Test
  void recurringMonthlyMeetingCanMoveBeforeItsOriginalMonthWithoutChangingSequenceOrOwner() {
    id = monthly(Recurrence.MONTHLY_DAY, List.of());
    var first = slot("E:0");
    var next = slot("E:1");
    LocalDate moved = anchor.plusDays(1);
    apply("E:0", moved);
    var result = live.schedule(id, moved, moved);
    assertThat(result.occurrences()).hasSize(1);
    assertThat(result.occurrences().getFirst().assignees().getFirst().slotId())
        .isEqualTo(first.id());
    assertThat(result.occurrences().getFirst().sequence()).isZero();
    assertThat(slot("E:1")).isEqualTo(next);
    assertThat(slot("E:0").employeeId()).isEqualTo(first.employeeId());
  }

  @Test
  void explicitMeetingDateChangesKeepTheMeetingRecordAndSlotsInSync() {
    id = monthly(Recurrence.EXPLICIT_DATES, List.of(anchor.plusDays(10), anchor.plusDays(40)));
    var original = slot("E:0");
    apply("E:0", anchor.plusDays(15));
    assertThat(schedules.meetings(id).getFirst().date()).isEqualTo(anchor.plusDays(15));
    assertThat(slot("E:0").id()).isEqualTo(original.id());
    assertThatThrownBy(() -> dates.preview(id, command("E:0", anchor.plusDays(40))))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> dates.preview(id, command("E:0", anchor.plusMonths(5))))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void movingToACompanyHolidayIsExplicitlyWarnedWithoutMovingTheNextMeeting() {
    id = monthly(Recurrence.MONTHLY_DAY, List.of());
    var holiday = anchor.plusDays(1);
    calendar.saveHoliday(new Holiday(holiday, "休業"));
    var input = command("E:0", holiday);
    assertThat(dates.preview(id, input).warnings()).hasSize(1);
    dates.confirm(id, input, dates.preview(id, input).token());
    assertThat(live.schedule(id, holiday, holiday).occurrences().getFirst().holiday()).isTrue();
  }

  @Test
  void deletedDutiesRemoveTheirDateHistoryInForeignKeyOrder() {
    legacyBoundary();
    duties.delete(id);
    assertThat(history.history(id)).isEmpty();
    assertThat(schedules.slots(id)).isEmpty();
  }

  @Test
  void movingAMeetingIntoAnExclusionIsRejectedWithoutChangingDates() {
    id = monthly(Recurrence.MONTHLY_DAY, List.of());
    var old = slot("E:0");
    exclusions.save(
        id, new ExclusionDefinition(ids.get(0), anchor.plusDays(1), anchor.plusDays(1), "休暇"));
    assertThatThrownBy(() -> dates.preview(id, command("E:0", anchor.plusDays(1))))
        .isInstanceOf(BadRequestException.class);
    assertThat(slot("E:0")).isEqualTo(old);
    assertThat(history.history(id)).isEmpty();
  }
}
