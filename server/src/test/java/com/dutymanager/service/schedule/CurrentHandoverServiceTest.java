package com.dutymanager.service.schedule;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.*;
import com.dutymanager.service.duty.DutyService;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@Import(CurrentHandoverServiceTest.TimeConfig.class)
class CurrentHandoverServiceTest {
  static class MutableClock extends Clock {
    LocalDate day = LocalDate.of(2026, 11, 4);

    public ZoneId getZone() {
      return ZoneId.of("Asia/Tokyo");
    }

    public Clock withZone(ZoneId zone) {
      return Clock.fixed(instant(), zone);
    }

    public Instant instant() {
      return day.atTime(12, 0).atZone(getZone()).toInstant();
    }
  }

  @TestConfiguration
  static class TimeConfig {
    @Bean
    @Primary
    MutableClock handoverClock() {
      return new MutableClock();
    }
  }

  @Autowired MutableClock clock;
  @Autowired EmployeeRepository employees;
  @Autowired AutomaticDutyService automatic;
  @Autowired AssignmentChangeService changes;
  @Autowired ScheduleRepository schedules;
  @Autowired HandoverRepository handovers;
  @Autowired LiveScheduleService live;
  @Autowired DutyService duties;
  @Autowired ScheduleAllocationService allocations;
  @Autowired RotationSlotService replacements;
  @Autowired ExclusionRepository exclusions;
  List<Long> ids;
  long id;
  LocalDate anchor;

  @BeforeEach
  void setup() {
    clock.day = LocalDate.of(2026, 11, 4);
    anchor = clock.day.minusDays(16);
    ids = new ArrayList<>();
    for (int i = 0; i < 6; i++)
      ids.add(employees.save(new EmployeeDefinition("HAND" + i, "担当" + (char) ('A' + i))));
    id = create(Strategy.CUSTOM, 1, anchor.plusDays(69));
  }

  long create(Strategy strategy, int count, LocalDate through) {
    var draft =
        new AutomaticDefinition(
            new DutyDefinition("週担当", "", anchor, 1, Unit.WEEK, strategy, count, ids),
            new ScheduleRule(
                Recurrence.WORKDAYS, RotationMode.CALENDAR, List.of(1, 2, 3, 4, 5), 1, 1, 1, 1),
            List.of(),
            1234,
            0,
            null,
            through);
    return automatic.activate(draft, automatic.preview(draft).token());
  }

  RotationSlot slot(int seq, int index) {
    return schedules.slots(id).stream()
        .filter(s -> s.rotationKey().equals("C:" + seq) && s.slotIndex() == index)
        .findFirst()
        .orElseThrow();
  }

  AssignmentChange edit(List<Long> members, Map<Long, Long> handover) {
    var context = changes.context(id);
    return new AssignmentChange(
        "DUTY",
        id,
        null,
        null,
        context.boundaries().getFirst().index(),
        context.duty().strategy(),
        context.duty().assigneeCount(),
        members,
        null,
        "担当メンバー変更",
        Map.of(),
        handover);
  }

  void apply(AssignmentChange c) {
    var preview = changes.preview(c);
    assertThat(preview.warnings()).isEmpty();
    assertThat(preview.canApply()).isTrue();
    changes.confirm(c, preview.token());
  }

  List<Long> owners(LocalDate date) {
    return live.schedule(id, date, date).occurrences().stream()
        .flatMap(e -> e.assignees().stream())
        .map(WorkAssignee::employeeId)
        .toList();
  }

  @Test
  void keepingCurrentOwnerImmediatelyRemovesThemFromTheRosterButKeepsThisPeriod() {
    var input = edit(ids.subList(3, 6), Map.of());
    var before = schedules.slots(id);
    var preview = changes.preview(input);
    assertThat(schedules.slots(id)).isEqualTo(before);
    assertThat(preview.currentRows()).hasSize(1);
    changes.confirm(input, preview.token());
    assertThat(duties.findById(id).memberIds()).containsExactlyElementsOf(ids.subList(3, 6));
    assertThat(owners(clock.day)).containsExactly(ids.get(2));
    assertThat(owners(clock.day.plusDays(1))).containsExactly(ids.get(2));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(3));
    assertThat(handovers.find(id)).isEmpty();
  }

  @Test
  void handoverPreservesPastDaysAndConsumesTheRecipientBeforeNextAutomaticTurn() {
    var current = slot(2, 0);
    var input = edit(ids.subList(3, 6), Map.of(current.id(), ids.get(3)));
    var preview = changes.preview(input);
    assertThat(preview.currentRows()).hasSize(2);
    assertThat(owners(clock.day)).containsExactly(ids.get(2));
    assertThat(handovers.find(id)).isEmpty();
    changes.confirm(input, preview.token());
    assertThat(duties.findById(id).memberIds()).containsExactlyElementsOf(ids.subList(3, 6));
    assertThat(owners(clock.day.minusDays(2))).containsExactly(ids.get(2));
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(2));
    assertThat(owners(clock.day)).containsExactly(ids.get(3));
    assertThat(owners(clock.day.plusDays(1))).containsExactly(ids.get(3));
    assertThat(slot(2, 0).employeeId()).isEqualTo(ids.get(2));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(4));
    assertThat(slot(4, 0).employeeId()).isEqualTo(ids.get(5));
    assertThat(slot(5, 0).employeeId()).isEqualTo(ids.get(3));
    assertThat(schedules.changes(current.id())).hasSize(1);
  }

  @Test
  void groupedRowsAreSplitAtTheHandoverWithoutChangingTheRotationBoundaries() {
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    var work = live.schedule(id, anchor.plusDays(14), anchor.plusDays(20)).occurrences();
    assertThat(work.stream().filter(e -> e.date().isBefore(clock.day)))
        .allMatch(
            e ->
                e.periodEnd().equals(clock.day.minusDays(1))
                    && e.assignees().getFirst().employeeId() == ids.get(2));
    assertThat(work.stream().filter(e -> !e.date().isBefore(clock.day)))
        .allMatch(
            e ->
                e.periodStart().equals(clock.day)
                    && e.assignees().getFirst().employeeId() == ids.get(3));
    assertThat(slot(2, 0).periodStart()).isEqualTo(anchor.plusDays(14));
    assertThat(slot(2, 0).periodEnd()).isEqualTo(anchor.plusDays(20));
  }

  @Test
  void theNextCurrentOwnerCanBeHandedOverAgainOnTheFollowingDay() {
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    clock.day = clock.day.plusDays(1);
    var input = edit(ids.subList(4, 6), Map.of(slot(2, 0).id(), ids.get(4)));
    apply(input);
    assertThat(owners(clock.day.minusDays(2))).containsExactly(ids.get(2));
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(3));
    assertThat(owners(clock.day)).containsExactly(ids.get(4));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(5));
    assertThat(handovers.find(id)).hasSize(2);
  }

  @Test
  void extensionKeepsTheAdvancedCursorAndHandover() {
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    var extension = new AllocationExtension(anchor.plusDays(90), 0);
    allocations.confirm(id, extension, allocations.preview(id, extension).token());
    assertThat(owners(clock.day.plusDays(1))).containsExactly(ids.get(3));
    assertThat(slot(10, 0).employeeId()).isEqualTo(ids.get(5));
  }

  @Test
  void invalidRecipientOrStalePreviewCannotPartiallyChangeAnything() {
    var original = schedules.slots(id);
    var invalid = edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(0)));
    assertThatThrownBy(() -> changes.preview(invalid)).isInstanceOf(BadRequestException.class);
    var input = edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3)));
    var accepted = input;
    var preview = changes.preview(input);
    replacements.replace(slot(4, 0).id(), ids.get(0), "同時変更");
    assertThatThrownBy(() -> changes.confirm(accepted, preview.token()))
        .isInstanceOf(ConflictException.class);
    assertThat(handovers.find(id)).isEmpty();
    assertThat(duties.findById(id).memberIds()).containsExactlyElementsOf(ids);
    assertThat(slot(2, 0))
        .isEqualTo(
            original.stream().filter(s -> s.rotationKey().equals("C:2")).findFirst().orElseThrow());
  }

  @Test
  void exclusionsAndNonCurrentSlotsAreRejected() {
    var current = slot(2, 0);
    exclusions.save(id, new ExclusionDefinition(ids.get(3), clock.day, clock.day, "休暇"));
    assertThatThrownBy(
            () -> changes.preview(edit(ids.subList(3, 6), Map.of(current.id(), ids.get(3)))))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> changes.preview(edit(ids, Map.of(slot(3, 0).id(), ids.get(4)))))
        .isInstanceOf(BadRequestException.class);
    assertThat(handovers.find(id)).isEmpty();
  }

  @Test
  void twoSimultaneousOwnersRequireDistinctRecipientsAndBothConsumeTheirTurns() {
    id = create(Strategy.CUSTOM, 2, anchor.plusDays(69));
    var members = ids.subList(0, 4);
    assertThatThrownBy(
            () ->
                changes.preview(
                    edit(
                        members, Map.of(slot(2, 0).id(), ids.get(0), slot(2, 1).id(), ids.get(0)))))
        .isInstanceOf(BadRequestException.class);
    apply(edit(members, Map.of(slot(2, 0).id(), ids.get(0), slot(2, 1).id(), ids.get(1))));
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(4), ids.get(5));
    assertThat(owners(clock.day)).containsExactly(ids.get(0), ids.get(1));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(2));
    assertThat(slot(3, 1).employeeId()).isEqualTo(ids.get(3));
  }

  @Test
  void theLastDayOfCurrentAllocationCanBeHandedOverToday() {
    clock.day = anchor.plusDays(20);
    assertThat(changes.context(id).handoverDate()).isEqualTo(clock.day);
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    assertThat(
            com.dutymanager.engine.schedule.SlotAssignmentResolver.at(
                    slot(2, 0), handovers.find(id), clock.day)
                .employeeId())
        .isEqualTo(ids.get(3));
    assertThat(handovers.find(id).getFirst().date()).isEqualTo(clock.day);
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(4));
  }

  @Test
  void currentPeriodCanBeHandedOverWithoutCreatingUnrequestedFuturePeriods() {
    id = create(Strategy.CUSTOM, 1, anchor.plusDays(20));
    var before = schedules.slots(id).size();
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    assertThat(schedules.slots(id)).hasSize(before);
    assertThat(owners(clock.day.plusDays(1))).containsExactly(ids.get(3));
    var extension = new AllocationExtension(anchor.plusDays(27), 0);
    allocations.confirm(id, extension, allocations.preview(id, extension).token());
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(4));
  }

  @Test
  void todaySegmentReplacementsCannotRewriteEarlierDays() {
    var current = slot(2, 0);
    apply(edit(ids.subList(3, 6), Map.of(current.id(), ids.get(3))));
    assertThatThrownBy(() -> replacements.replace(current.id(), ids.get(5), "変更"))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> replacements.replace(current.id(), ids.get(5), "変更", clock.day))
        .isInstanceOf(BadRequestException.class);
    apply(edit(ids.subList(3, 6), Map.of(current.id(), ids.get(5))));
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(2));
    assertThat(owners(clock.day)).containsExactly(ids.get(5));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(4));
  }

  @Test
  void dutyDeletionRemovesHandoverRowsWithoutDroppingEmployeeHistory() {
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    duties.delete(id);
    assertThat(handovers.find(id)).isEmpty();
  }

  @Test
  void randomHandoverConsumesOnlyTheChosenRemainingCandidate() {
    id = create(Strategy.SHUFFLED_ROUND, 1, anchor.plusDays(69));
    var current = slot(2, 0);
    var members = ids.stream().filter(person -> person != current.employeeId()).toList();
    var candidates =
        changes.context(id).nextCandidates().stream().filter(members::contains).toList();
    var receiver = candidates.getFirst();
    apply(edit(members, Map.of(current.id(), receiver)));
    assertThat(owners(clock.day.minusDays(1))).containsExactly(current.employeeId());
    assertThat(owners(clock.day)).containsExactly(receiver);
    assertThat(slot(3, 0).employeeId()).isEqualTo(candidates.get(1));
  }

  @Test
  void anOldOwnerCanBeDeactivatedAfterTheHandoverTakesEffect() {
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    var input =
        new AssignmentChange(
            "STATUS", null, ids.get(2), false, null, null, null, List.of(), null, "退職", Map.of());
    apply(input);
    assertThat(employees.findById(ids.get(2)).orElseThrow().active()).isFalse();
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(2));
    assertThat(owners(clock.day)).containsExactly(ids.get(3));
  }

  @Test
  void aPreviouslyExcludedContinuingOwnerCanBeHandedOverOnReediting() {
    apply(edit(ids.subList(3, 6), Map.of()));
    assertThat(duties.findById(id).memberIds()).containsExactlyElementsOf(ids.subList(3, 6));
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(2));
    assertThat(owners(clock.day)).containsExactly(ids.get(3));
    assertThat(owners(clock.day.plusDays(1))).containsExactly(ids.get(3));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(4));
  }

  @Test
  void sameDayHandoverUpdatesTodayOnlyAndKeepsBothAuditEvents() {
    var current = slot(2, 0);
    apply(edit(ids.subList(3, 6), Map.of(current.id(), ids.get(3))));
    var input = edit(ids.subList(4, 6), Map.of(current.id(), ids.get(4)));
    var preview = changes.preview(input);
    assertThat(preview.currentRows()).hasSize(1);
    assertThat(preview.currentRows().getFirst().start()).isEqualTo(clock.day);
    changes.confirm(input, preview.token());
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(2));
    assertThat(owners(clock.day)).containsExactly(ids.get(4));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(5));
    assertThat(handovers.find(id)).hasSize(1);
    assertThat(schedules.changes(current.id())).hasSize(2);
  }

  @Test
  void scheduleHandoverKeepsTheRosterAndAdvancesTheNextAutomaticOwner() {
    var current = slot(2, 0);
    var input = edit(ids, Map.of(current.id(), ids.get(3)));
    var preview = changes.preview(input);
    assertThat(owners(clock.day)).containsExactly(ids.get(2));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(3));
    changes.confirm(input, preview.token());
    assertThat(duties.findById(id).memberIds()).containsExactlyElementsOf(ids);
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(2));
    assertThat(owners(clock.day)).containsExactly(ids.get(3));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(4));
    assertThat(slot(4, 0).employeeId()).isEqualTo(ids.get(5));
    assertThat(slot(5, 0).employeeId()).isEqualTo(ids.get(0));
    assertThatThrownBy(() -> changes.preview(edit(ids, Map.of(current.id(), ids.get(3)))))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void rejoiningTheRemovedOriginalOwnerRestoresTodayAndReturnsTheRecipientToNextTurn() {
    var current = slot(2, 0);
    apply(edit(ids.subList(3, 6), Map.of(current.id(), ids.get(3))));
    var members = List.of(ids.get(3), ids.get(4), ids.get(5), ids.get(2));
    var input = edit(members, Map.of());
    var preview = changes.preview(input);
    assertThat(owners(clock.day)).containsExactly(ids.get(3));
    assertThat(preview.currentRows())
        .anyMatch(row -> row.after().id() == ids.get(2) && row.start().equals(clock.day));
    changes.confirm(input, preview.token());
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(2));
    assertThat(owners(clock.day)).containsExactly(ids.get(2));
    assertThat(duties.findById(id).memberIds()).containsExactlyElementsOf(ids.subList(2, 6));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(3));
    assertThat(slot(4, 0).employeeId()).isEqualTo(ids.get(4));
    assertThat(slot(5, 0).employeeId()).isEqualTo(ids.get(5));
    assertThat(slot(6, 0).employeeId()).isEqualTo(ids.get(2));
    assertThat(schedules.changes(current.id())).hasSize(2);
  }

  @Test
  void restorationOnTheNextDayKeepsTheInterimHandoverHistoryAndContinuesAfterExtension() {
    var current = slot(2, 0);
    apply(edit(ids.subList(3, 6), Map.of(current.id(), ids.get(3))));
    clock.day = clock.day.plusDays(1);
    apply(edit(List.of(ids.get(3), ids.get(4), ids.get(5), ids.get(2)), Map.of()));
    assertThat(owners(clock.day.minusDays(2))).containsExactly(ids.get(2));
    assertThat(owners(clock.day.minusDays(1))).containsExactly(ids.get(3));
    assertThat(owners(clock.day)).containsExactly(ids.get(2));
    assertThat(slot(3, 0).employeeId()).isEqualTo(ids.get(3));
    var extension = new AllocationExtension(anchor.plusDays(90), 0);
    allocations.confirm(id, extension, allocations.preview(id, extension).token());
    assertThat(slot(10, 0).employeeId()).isEqualTo(ids.get(2));
  }

  @Test
  void rejoiningAfterTheOriginalPeriodEndedDoesNotRewriteTheCurrentOwner() {
    apply(edit(ids.subList(3, 6), Map.of(slot(2, 0).id(), ids.get(3))));
    clock.day = anchor.plusDays(21);
    apply(edit(List.of(ids.get(3), ids.get(4), ids.get(5), ids.get(2)), Map.of()));
    assertThat(owners(clock.day)).containsExactly(ids.get(4));
    assertThat(handovers.find(id)).hasSize(1);
  }
}
