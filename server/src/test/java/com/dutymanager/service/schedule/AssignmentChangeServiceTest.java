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
class AssignmentChangeServiceTest {
  @Autowired AssignmentChangeService changes;
  @Autowired AutomaticDutyService automatic;
  @Autowired LiveScheduleService live;
  @Autowired RotationSlotService rotations;
  @Autowired EmployeeRepository employees;
  @Autowired ScheduleRepository schedules;
  @Autowired AssignmentPlanRepository plans;
  @Autowired Clock clock;
  @Autowired ScheduleAllocationService allocations;
  List<Long> ids;
  long duty;
  LocalDate anchor;

  @BeforeEach
  void setup() {
    ids = new ArrayList<>();
    for (int i = 0; i < 16; i++)
      ids.add(
          employees.save(
              new EmployeeDefinition("PLAN" + String.format("%03d", i), "担当" + (char) ('A' + i))));
    anchor = LocalDate.now(clock).minusDays(7);
    duty = activate(Strategy.EMPLOYEE_NUMBER);
    live.schedule(duty, anchor, anchor.plusDays(50));
  }

  long activate(Strategy strategy) {
    var input =
        new AutomaticDefinition(
            new DutyDefinition("テスト当番", "", anchor, 1, Unit.WEEK, strategy, 1, ids),
            new ScheduleRule(
                Recurrence.WORKDAYS, RotationMode.CALENDAR, List.of(1, 2, 3, 4, 5), 1, 1, 1, 1),
            List.of(),
            54321,
            0,
            null,
            anchor.plusYears(1));
    return automatic.activate(input, automatic.preview(input).token());
  }

  AssignmentChange status(long employee, boolean active) {
    return new AssignmentChange(
        "STATUS", null, employee, active, null, null, null, List.of(), null, "状態変更", Map.of());
  }

  void apply(AssignmentChange input) {
    var preview = changes.preview(input);
    assertThat(preview.warnings()).isEmpty();
    assertThat(preview.canApply()).isTrue();
    changes.confirm(input, preview.token());
  }

  long assigned(int index) {
    return schedules.slots(duty).stream()
        .filter(s -> s.rotationKey().equals("C:" + index))
        .findFirst()
        .orElseThrow()
        .employeeId();
  }

  @Test
  void disablingCompactsAndReenablingRestoresTheOriginalPositionWithoutMovingCurrentOrPast() {
    var before = schedules.slots(duty);
    var input = status(ids.get(3), false);
    var review = changes.preview(input);
    assertThat(schedules.slots(duty)).isEqualTo(before);
    assertThat(assigned(3)).isEqualTo(ids.get(3));
    changes.confirm(input, review.token());
    assertThat(assigned(0)).isEqualTo(ids.get(0));
    assertThat(assigned(1)).isEqualTo(ids.get(1));
    assertThat(assigned(2)).isEqualTo(ids.get(2));
    assertThat(assigned(3)).isEqualTo(ids.get(4));
    apply(status(ids.get(3), true));
    assertThat(assigned(2)).isEqualTo(ids.get(2));
    assertThat(assigned(3)).isEqualTo(ids.get(3));
    assertThat(assigned(4)).isEqualTo(ids.get(4));
    assertThat(plans.history(duty)).hasSize(2);
    int savedCount = schedules.slots(duty).size();
    assertThat(
            live.schedule(duty, anchor.plusYears(2), anchor.plusYears(2).plusDays(35))
                .occurrences())
        .isEmpty();
    assertThat(schedules.slots(duty)).hasSize(savedCount);
    var extension = new AllocationExtension(anchor.plusYears(2).plusDays(35), 0);
    var preview = allocations.preview(duty, extension);
    allocations.confirm(duty, extension, preview.token());
    assertThat(
            live.schedule(duty, anchor.plusYears(2), anchor.plusYears(2).plusDays(35))
                .occurrences())
        .isNotEmpty();
  }

  @Test
  void evenTheImmediateNextCandidateReturnsToTheOriginalPlace() {
    apply(status(ids.get(2), false));
    assertThat(assigned(2)).isEqualTo(ids.get(3));
    apply(status(ids.get(2), true));
    assertThat(assigned(2)).isEqualTo(ids.get(2));
  }

  @Test
  void manualConflictIsResolvedInsideTheSameReviewAndRecorded() {
    var slot =
        schedules.slots(duty).stream()
            .filter(s -> s.rotationKey().equals("C:3"))
            .findFirst()
            .orElseThrow();
    rotations.replace(slot.id(), ids.get(10), "手動代理");
    var input = status(ids.get(10), false);
    var review = changes.preview(input);
    var conflict =
        review.rows().stream().filter(AssignmentReview.Row::conflict).findFirst().orElseThrow();
    assertThat(review.canApply()).isFalse();
    var resolved =
        new AssignmentChange(
            "STATUS",
            null,
            ids.get(10),
            false,
            null,
            null,
            null,
            List.of(),
            null,
            "代理の退職",
            Map.of(conflict.key(), ids.get(8)));
    apply(resolved);
    assertThat(assigned(3)).isEqualTo(ids.get(8));
    assertThat(schedules.slot(slot.id()).orElseThrow().manualOverride()).isTrue();
    assertThat(schedules.changes(slot.id())).hasSize(2);
  }

  @Test
  void manualAssignmentsRemainWhenStillEligible() {
    var slot =
        schedules.slots(duty).stream()
            .filter(s -> s.rotationKey().equals("C:4"))
            .findFirst()
            .orElseThrow();
    rotations.replace(slot.id(), ids.get(8), "代理");
    apply(status(ids.get(3), false));
    assertThat(assigned(4)).isEqualTo(ids.get(8));
  }

  @Test
  void stalePreviewAndCurrentAssigneeCannotBeSilentlyApplied() {
    var input = status(ids.get(3), false);
    var preview = changes.preview(input);
    var slot =
        schedules.slots(duty).stream()
            .filter(s -> s.rotationKey().equals("C:5"))
            .findFirst()
            .orElseThrow();
    rotations.replace(slot.id(), ids.get(9), "同時変更");
    assertThatThrownBy(() -> changes.confirm(input, preview.token()))
        .isInstanceOf(ConflictException.class);
    assertThat(employees.findById(ids.get(3)).orElseThrow().active()).isTrue();
    assertThat(changes.preview(status(ids.get(1), false)).canApply()).isFalse();
  }

  @Test
  void membershipEditingKeepsNextCandidateAndDoesNotResetAtTheBeginning() {
    var members = new ArrayList<>(ids);
    members.remove(ids.get(3));
    var input =
        new AssignmentChange(
            "DUTY",
            duty,
            null,
            null,
            2,
            Strategy.EMPLOYEE_NUMBER,
            1,
            members,
            null,
            "参加者変更",
            Map.of());
    apply(input);
    assertThat(assigned(2)).isEqualTo(ids.get(2));
    assertThat(assigned(3)).isEqualTo(ids.get(4));
  }

  @Test
  void randomStatusRestorationPreservesThePreviouslyGeneratedRound() {
    duty = activate(Strategy.SHUFFLED_ROUND);
    live.schedule(duty, anchor, anchor.plusDays(120));
    long target = assigned(4);
    var expected =
        schedules.slots(duty).stream()
            .filter(s -> s.periodStart().isAfter(LocalDate.now(clock)))
            .map(s -> s.rotationKey() + ":" + s.employeeId())
            .toList();
    apply(status(target, false));
    apply(status(target, true));
    var restored = schedules.slots(duty);
    for (String pair : expected)
      assertThat(
              restored.stream()
                  .anyMatch(s -> (s.rotationKey() + ":" + s.employeeId()).equals(pair)))
          .isTrue();
  }

  @Test
  void fixedOrderContinuesAcrossRoundBoundariesAfterRemovalAndRestore() {
    apply(status(ids.get(3), false));
    assertThat(assigned(14)).isEqualTo(ids.get(15));
    assertThat(assigned(15)).isEqualTo(ids.get(0));
    assertThat(assigned(16)).isEqualTo(ids.get(1));
    apply(status(ids.get(3), true));
    assertThat(assigned(15)).isEqualTo(ids.get(15));
    assertThat(assigned(16)).isEqualTo(ids.get(0));
  }

  @Test
  void increasingAndDecreasingCountReusesSlotIdentityAndNeverCreatesDuplicates() {
    var originalId =
        schedules.slots(duty).stream()
            .filter(slot -> slot.rotationKey().equals("C:2"))
            .findFirst()
            .orElseThrow()
            .id();
    apply(
        new AssignmentChange(
            "DUTY", duty, null, null, 2, Strategy.EMPLOYEE_NUMBER, 2, ids, null, "2人担当", Map.of()));
    assertThat(
            schedules.slots(duty).stream()
                .filter(slot -> slot.rotationKey().equals("C:2"))
                .map(RotationSlot::employeeId))
        .containsExactly(ids.get(2), ids.get(3));
    apply(
        new AssignmentChange(
            "DUTY", duty, null, null, 2, Strategy.EMPLOYEE_NUMBER, 1, ids, null, "1人担当", Map.of()));
    assertThat(schedules.slots(duty).stream().filter(slot -> slot.rotationKey().equals("C:2")))
        .hasSize(1);
    assertThat(schedules.slot(originalId)).isPresent();
  }

  @Test
  void explicitMeetingDatesAndSlotIdentitiesArePreservedByParticipantChanges() {
    var dates =
        List.of(
            LocalDate.now(clock).plusDays(10),
            LocalDate.now(clock).plusDays(40),
            LocalDate.now(clock).plusDays(70));
    var input =
        new AutomaticDefinition(
            new DutyDefinition("定例会", "", anchor, 1, Unit.MONTH, Strategy.EMPLOYEE_NUMBER, 1, ids),
            new ScheduleRule(
                Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE, List.of(), 1, 1, 1, 1),
            dates,
            321);
    duty = automatic.activate(input, automatic.preview(input).token());
    var meetings = schedules.meetings(duty);
    var slots = schedules.slots(duty);
    var members = new ArrayList<>(ids);
    members.remove(ids.get(1));
    apply(
        new AssignmentChange(
            "DUTY",
            duty,
            null,
            null,
            0,
            Strategy.EMPLOYEE_NUMBER,
            1,
            members,
            null,
            "参加者変更",
            Map.of()));
    assertThat(schedules.meetings(duty)).isEqualTo(meetings);
    for (var slot : slots)
      assertThat(schedules.slot(slot.id()).orElseThrow().rotationKey())
          .isEqualTo(slot.rotationKey());
    assertThat(
            schedules.slots(duty).stream()
                .filter(slot -> slot.rotationKey().equals("E:1"))
                .findFirst()
                .orElseThrow()
                .employeeId())
        .isEqualTo(ids.get(2));
  }

  @Test
  void employeeNumberNewcomersJoinTheirPositionsWithoutJumpingAheadOfNextCandidate() {
    long earlier = employees.save(new EmployeeDefinition("AAA", "先頭の新規"));
    long later = employees.save(new EmployeeDefinition("PLAN002A", "後続の新規"));
    var members = new ArrayList<>(ids);
    members.add(earlier);
    members.add(later);
    apply(
        new AssignmentChange(
            "DUTY",
            duty,
            null,
            null,
            2,
            Strategy.EMPLOYEE_NUMBER,
            1,
            members,
            null,
            "参加者追加",
            Map.of()));
    assertThat(assigned(2)).isEqualTo(ids.get(2));
    assertThat(assigned(3)).isEqualTo(later);
    assertThat(assigned(17)).isEqualTo(earlier);
  }

  @Test
  void randomNewcomersAreAppendedAfterTheUnconsumedRound() {
    duty = activate(Strategy.SHUFFLED_ROUND);
    var remaining =
        schedules.slots(duty).stream()
            .filter(
                slot ->
                    Integer.parseInt(slot.rotationKey().substring(2)) >= 2
                        && Integer.parseInt(slot.rotationKey().substring(2)) < 16)
            .sorted(
                Comparator.comparingInt(slot -> Integer.parseInt(slot.rotationKey().substring(2))))
            .map(RotationSlot::employeeId)
            .toList();
    long newcomer = employees.save(new EmployeeDefinition("ZZZ", "新規参加"));
    var members = new ArrayList<>(ids);
    members.add(newcomer);
    var change =
        new AssignmentChange(
            "DUTY",
            duty,
            null,
            null,
            2,
            Strategy.SHUFFLED_ROUND,
            1,
            members,
            null,
            "参加者追加",
            Map.of());
    assertThat(changes.preview(change).token()).isEqualTo(changes.preview(change).token());
    apply(change);
    for (int i = 0; i < remaining.size(); i++)
      assertThat(assigned(2 + i)).isEqualTo(remaining.get(i));
    assertThat(assigned(2 + remaining.size())).isEqualTo(newcomer);
  }
}
