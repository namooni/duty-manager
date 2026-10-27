package com.dutymanager.engine.rotation;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.model.assignment.Assignment;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.Exclusion;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.duty.Unit;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.planning.Period;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class AssignmentEngineTest {
  final AssignmentEngine engine = new AssignmentEngine();
  final LocalDate start = LocalDate.of(2026, 10, 26);
  final List<Employee> people =
      List.of(
          new Employee(1, "001", "田中", true),
          new Employee(2, "002", "佐藤", true),
          new Employee(3, "003", "鈴木", true));

  Duty duty(Strategy strategy, int count) {
    return new Duty(7, "朝会", "", start, 1, Unit.WEEK, strategy, count, List.of(1L, 2L, 3L));
  }

  List<Period> generate(Duty d, List<Employee> employees, List<Exclusion> exclusions, int weeks) {
    return engine.generate(
        d, employees, exclusions, List.of(), start, start.plusWeeks(weeks).minusDays(1));
  }

  @Test
  void orderedRotationWraps() {
    assertThat(generate(duty(Strategy.EMPLOYEE_NUMBER, 1), people, List.of(), 4))
        .extracting(p -> p.assignees().getFirst().id())
        .containsExactly(1L, 2L, 3L, 1L);
  }

  @Test
  void customOrderUsesSelectionOrder() {
    var d = new Duty(7, "朝会", "", start, 1, Unit.WEEK, Strategy.CUSTOM, 1, List.of(3L, 1L, 2L));
    assertThat(generate(d, people, List.of(), 3))
        .extracting(p -> p.assignees().getFirst().id())
        .containsExactly(3L, 1L, 2L);
  }

  @Test
  void monthEndUsesOriginalAnchor() {
    var d =
        new Duty(
            7, "月末", "", LocalDate.of(2026, 1, 31), 1, Unit.MONTH, Strategy.CUSTOM, 1, List.of(1L));
    assertThat(engine.boundary(d, 1)).isEqualTo(LocalDate.of(2026, 2, 28));
    assertThat(engine.boundary(d, 2)).isEqualTo(LocalDate.of(2026, 3, 31));
  }

  @Test
  void threeDayPeriodsAreInclusiveAndCanOverlapQueryStart() {
    var d = new Duty(7, "点検", "", start, 3, Unit.DAY, Strategy.CUSTOM, 1, List.of(1L, 2L, 3L));
    var periods =
        engine.generate(d, people, List.of(), List.of(), start.plusDays(1), start.plusDays(4));
    assertThat(periods).hasSize(2);
    assertThat(periods.getFirst().start()).isEqualTo(start);
    assertThat(periods.getFirst().end()).isEqualTo(start.plusDays(2));
  }

  @Test
  void anyOverlappingExclusionSkipsWholePeriod() {
    var x = new Exclusion(1, 7, 1, start.plusDays(2), start.plusDays(2), "休暇");
    assertThat(generate(duty(Strategy.CUSTOM, 1), people, List.of(x), 2))
        .extracting(p -> p.assignees().getFirst().id())
        .containsExactly(2L, 3L);
  }

  @Test
  void inactiveMemberIsSkipped() {
    var inactive = List.of(new Employee(1, "001", "田中", false), people.get(1), people.get(2));
    assertThat(
            generate(duty(Strategy.CUSTOM, 1), inactive, List.of(), 1)
                .getFirst()
                .assignees()
                .getFirst()
                .id())
        .isEqualTo(2);
  }

  @Test
  void shuffledRoundsAreRepeatableAndContainEveryoneOnce() {
    var d = duty(Strategy.SHUFFLED_ROUND, 1);
    var one = generate(d, people, List.of(), 6);
    assertThat(one).isEqualTo(generate(d, people, List.of(), 6));
    assertThat(one.subList(0, 3))
        .extracting(p -> p.assignees().getFirst().id())
        .containsExactlyInAnyOrder(1L, 2L, 3L);
    assertThat(one.subList(3, 6))
        .extracting(p -> p.assignees().getFirst().id())
        .containsExactlyInAnyOrder(1L, 2L, 3L);
  }

  @Test
  void multipleAssigneesNeverDuplicateAcrossRoundBoundary() {
    for (var period : generate(duty(Strategy.SHUFFLED_ROUND, 2), people, List.of(), 12))
      assertThat(period.assignees()).hasSize(2).extracting(Employee::id).doesNotHaveDuplicates();
  }

  @Test
  void insufficientEligibleMembersProducesWarningWithoutPartialAssignment() {
    var x = new Exclusion(1, 7, 1, start, start.plusDays(6), "休暇");
    var period = generate(duty(Strategy.CUSTOM, 3), people, List.of(x), 1).getFirst();
    assertThat(period.warning()).isNotBlank();
    assertThat(period.assignees()).isEmpty();
  }

  @Test
  void publishedReplacementDoesNotChangeFutureRotation() {
    var a = new Assignment(1, 7, "朝会", start, start.plusDays(6), 3, "鈴木", 0);
    var periods =
        engine.generate(
            duty(Strategy.CUSTOM, 1), people, List.of(), List.of(a), start, start.plusDays(13));
    assertThat(periods.getFirst().confirmed()).isTrue();
    assertThat(periods.getFirst().assignees().getFirst().id()).isEqualTo(3);
    assertThat(periods.get(1).assignees().getFirst().id()).isEqualTo(2);
  }
}
