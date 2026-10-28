package com.dutymanager.service.schedule;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.*;
import com.dutymanager.model.schedule.*;
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
class ScheduleAllocationServiceTest {
  @Autowired AutomaticDutyService automatic;
  @Autowired ScheduleAllocationService allocations;
  @Autowired LiveScheduleService live;
  @Autowired ScheduleRepository schedules;
  @Autowired ScheduleRangeRepository ranges;
  @Autowired EmployeeRepository employees;
  @Autowired RotationSlotService replacements;
  @Autowired MeetingScheduleService meetings;
  @Autowired AssignmentChangeService changes;
  @Autowired Clock clock;
  @Autowired AssignmentPlanRepository plans;
  List<Long> ids;
  LocalDate anchor;

  @BeforeEach
  void setup() {
    ids = new ArrayList<>();
    for (int i = 0; i < 5; i++)
      ids.add(employees.save(new EmployeeDefinition("RANGE" + i, "担当" + i)));
    anchor = LocalDate.now(clock).plusDays(7);
  }

  AutomaticDefinition weekly(LocalDate through, LocalDate end, Strategy strategy) {
    return new AutomaticDefinition(
        new DutyDefinition("週当番", "", anchor, 1, Unit.WEEK, strategy, 1, ids),
        new ScheduleRule(
            Recurrence.WORKDAYS, RotationMode.CALENDAR, List.of(1, 2, 3, 4, 5), 1, 1, 1, 1),
        List.of(),
        1234,
        0,
        end,
        through);
  }

  long create(AutomaticDefinition input) {
    var preview = automatic.preview(input);
    return automatic.activate(input, preview.token());
  }

  void extend(long id, AllocationExtension input) {
    var preview = allocations.preview(id, input);
    allocations.confirm(id, input, preview.token());
  }

  @Test
  void selectedWindowControlsTheCountAndAnnualQueriesNeverCreateMore() {
    var input = weekly(anchor.plusDays(8), null, Strategy.CUSTOM);
    var preview = automatic.preview(input);
    assertThat(preview.turns()).hasSize(2);
    assertThat(preview.range().plannedThrough()).isEqualTo(anchor.plusDays(13));
    long id = automatic.activate(input, preview.token());
    assertThat(live.schedule(id, anchor, anchor.plusDays(20)).duties().getFirst().range())
        .isEqualTo(preview.range());
    var before = schedules.slots(id);
    assertThat(
            live.schedule(id, anchor.plusYears(1), anchor.plusYears(1).plusDays(10)).occurrences())
        .isEmpty();
    assertThat(schedules.slots(id)).isEqualTo(before);
  }

  @Test
  void aWindowLongerThanOneCycleRepeatsParticipants() {
    var preview = automatic.preview(weekly(anchor.plusDays(55), null, Strategy.CUSTOM));
    assertThat(preview.turns()).hasSize(8);
    assertThat(preview.turns().get(5).assignees().getFirst().id()).isEqualTo(ids.getFirst());
  }

  @Test
  void operatingEndClipsTheFinalPeriodAndBlocksFurtherExtension() {
    long id = create(weekly(anchor.plusDays(8), anchor.plusDays(8), Strategy.CUSTOM));
    assertThat(schedules.slots(id).getLast().periodEnd()).isEqualTo(anchor.plusDays(8));
    assertThat(live.schedule(id, anchor, anchor.plusDays(40)).occurrences())
        .allMatch(o -> !o.date().isAfter(anchor.plusDays(8)));
    assertThatThrownBy(
            () -> allocations.preview(id, new AllocationExtension(anchor.plusDays(20), 0)))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void extensionContinuesTheCursorAndPreservesManualAssignments() {
    long id = create(weekly(anchor.plusDays(8), null, Strategy.CUSTOM));
    var first = schedules.slots(id).getFirst();
    replacements.replace(first.id(), ids.get(4), "代理");
    int before = schedules.slots(id).size();
    var input = new AllocationExtension(anchor.plusDays(41), 0);
    var preview = allocations.preview(id, input);
    assertThat(schedules.slots(id)).hasSize(before);
    assertThat(preview.turns()).hasSize(4);
    allocations.confirm(id, input, preview.token());
    assertThat(schedules.slot(first.id()).orElseThrow().employeeId()).isEqualTo(ids.get(4));
    assertThat(schedules.slots(id).get(2).employeeId()).isEqualTo(ids.get(2));
    assertThat(schedules.changes(first.id())).hasSize(1);
    assertThatThrownBy(() -> allocations.confirm(id, input, preview.token()))
        .isInstanceOf(ConflictException.class);
  }

  @Test
  void splitRandomAllocationMatchesASingleAllocationWithTheSameSeed() {
    long small = create(weekly(anchor.plusDays(8), null, Strategy.SHUFFLED_ROUND));
    long full = create(weekly(anchor.plusDays(69), null, Strategy.SHUFFLED_ROUND));
    extend(small, new AllocationExtension(anchor.plusDays(69), 0));
    assertThat(schedules.slots(small).stream().map(RotationSlot::employeeId))
        .containsExactlyElementsOf(
            schedules.slots(full).stream().map(RotationSlot::employeeId).toList());
  }

  @Test
  void anExplicitMeetingListDoesNotGrowWhenDatesAreRegisteredOrQueried() {
    var input =
        new AutomaticDefinition(
            new DutyDefinition("定例会", "", anchor, 1, Unit.MONTH, Strategy.CUSTOM, 1, ids),
            new ScheduleRule(
                Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE, List.of(), 1, 1, 1, 1),
            Arrays.asList(null, null, null),
            1234,
            0,
            null,
            anchor.plusMonths(6));
    long id = create(input);
    assertThat(schedules.slots(id)).hasSize(3);
    assertThat(schedules.meetings(id)).hasSize(3);
    meetings.updateMeeting(id, 2, anchor.plusMonths(2));
    assertThat(schedules.meetings(id)).hasSize(3);
    live.schedule(id, anchor, anchor.plusMonths(8));
    assertThat(schedules.slots(id)).hasSize(3);
    extend(id, new AllocationExtension(anchor.plusMonths(6), 2));
    assertThat(schedules.slots(id)).hasSize(5);
    assertThat(schedules.slots(id).get(3).employeeId()).isEqualTo(ids.get(3));
    assertThatThrownBy(() -> meetings.updateMeeting(id, 4, anchor.plusYears(1)))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void statusReviewDoesNotCreateAnArbitraryYearsWorthOfSlots() {
    long id = create(weekly(anchor.plusDays(8), null, Strategy.CUSTOM));
    var input =
        new AssignmentChange(
            "STATUS", null, ids.get(3), false, null, null, null, List.of(), null, "退職", Map.of());
    var preview = changes.preview(input);
    assertThat(preview.rows()).hasSize(2);
    changes.confirm(input, preview.token());
    assertThat(schedules.slots(id)).hasSize(2);
  }

  @Test
  void staleExtensionPreviewIsRejectedWithoutPartiallyChangingTheRange() {
    long id = create(weekly(anchor.plusDays(8), null, Strategy.CUSTOM));
    var original = ranges.find(id);
    var input = new AllocationExtension(anchor.plusDays(41), 0);
    var preview = allocations.preview(id, input);
    replacements.replace(schedules.slots(id).getFirst().id(), ids.get(3), "同時変更");
    assertThatThrownBy(() -> allocations.confirm(id, input, preview.token()))
        .isInstanceOf(ConflictException.class);
    assertThat(ranges.find(id)).isEqualTo(original);
    assertThat(schedules.slots(id)).hasSize(2);
  }

  @Test
  void reversedAllocationAndOperatingDatesAreRejected() {
    assertThatThrownBy(() -> automatic.preview(weekly(anchor.minusDays(1), null, Strategy.CUSTOM)))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(
            () ->
                automatic.preview(
                    weekly(anchor.plusDays(20), anchor.plusDays(10), Strategy.CUSTOM)))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void anUnallocatedCurrentPeriodDoesNotBlockMemberDeactivation() {
    anchor = LocalDate.now(clock).minusDays(21);
    long id = create(weekly(anchor.plusDays(6), null, Strategy.CUSTOM));
    var input =
        new AssignmentChange(
            "STATUS", null, ids.get(3), false, null, null, null, List.of(), null, "退職", Map.of());
    var preview = changes.preview(input);
    assertThat(preview.canApply()).isTrue();
    assertThat(preview.rows()).isEmpty();
    changes.confirm(input, preview.token());
    assertThat(schedules.slots(id)).hasSize(1);
  }

  @Test
  void completedExplicitMeetingsRetainStatusChangesForTheNextExtension() {
    anchor = LocalDate.now(clock).minusDays(60);
    var input =
        new AutomaticDefinition(
            new DutyDefinition("完了済み定例会", "", anchor, 1, Unit.MONTH, Strategy.CUSTOM, 1, ids),
            new ScheduleRule(
                Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE, List.of(), 1, 1, 1, 1),
            List.of(anchor),
            1234,
            0,
            null,
            anchor);
    long id = create(input);
    plans.save(
        new AssignmentPlan(
            0, id, 0, 1, Strategy.CUSTOM, 1234, 1, ids, ids, new LinkedHashSet<>(ids), "以前の設定"));
    var status =
        new AssignmentChange(
            "STATUS", null, ids.get(1), false, null, null, null, List.of(), null, "退職", Map.of());
    var preview = changes.preview(status);
    assertThat(preview.rows()).isEmpty();
    changes.confirm(status, preview.token());
    assertThat(schedules.meetings(id)).hasSize(1);
    assertThat(schedules.slots(id)).hasSize(1);
    extend(id, new AllocationExtension(LocalDate.now(clock).plusDays(90), 1));
    assertThat(schedules.slots(id).getLast().employeeId()).isEqualTo(ids.get(2));
  }

  @Test
  void endedDutiesCannotAcquireUndatedFutureAssignments() {
    anchor = LocalDate.now(clock).minusDays(60);
    var input =
        new AutomaticDefinition(
            new DutyDefinition("終了済み", "", anchor, 1, Unit.MONTH, Strategy.CUSTOM, 1, ids),
            new ScheduleRule(
                Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE, List.of(), 1, 1, 1, 1),
            List.of(anchor),
            1234,
            0,
            anchor,
            anchor);
    long id = create(input);
    assertThatThrownBy(() -> allocations.preview(id, new AllocationExtension(anchor, 1)))
        .isInstanceOf(BadRequestException.class);
    assertThat(schedules.slots(id)).hasSize(1);
  }
}
