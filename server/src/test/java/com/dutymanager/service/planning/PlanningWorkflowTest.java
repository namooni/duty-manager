package com.dutymanager.service.planning;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.BadRequestException;
import com.dutymanager.exception.ConflictException;
import com.dutymanager.model.assignment.Assignment;
import com.dutymanager.model.assignment.Replacement;
import com.dutymanager.model.duty.DutyDefinition;
import com.dutymanager.model.duty.ExclusionDefinition;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.duty.Unit;
import com.dutymanager.model.employee.EmployeeDefinition;
import com.dutymanager.model.planning.Period;
import com.dutymanager.model.planning.Preview;
import com.dutymanager.repository.assignment.AssignmentRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.service.assignment.AssignmentService;
import com.dutymanager.service.duty.DutyService;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class PlanningWorkflowTest {
  @Autowired EmployeeRepository employees;
  @Autowired AssignmentRepository assignments;
  @Autowired PlanningService planning;
  @Autowired AssignmentService assignmentService;
  @Autowired DutyService service;
  @Autowired Clock clock;
  LocalDate start;
  long first, second, third, dutyId;

  @BeforeEach
  void setup() {
    start = LocalDate.now(clock);
    first = employees.save(new EmployeeDefinition("001", "田中"));
    second = employees.save(new EmployeeDefinition("002", "佐藤"));
    third = employees.save(new EmployeeDefinition("003", "鈴木"));
    dutyId =
        service.create(
            new DutyDefinition(
                "朝会",
                "司会と議事録",
                start,
                1,
                Unit.WEEK,
                Strategy.EMPLOYEE_NUMBER,
                1,
                List.of(first, second, third)));
  }

  List<Assignment> ownAssignments() {
    return assignments.findAll(start, start.plusDays(13)).stream()
        .filter(a -> a.dutyId() == dutyId)
        .toList();
  }

  Preview preview() {
    return planning.preview(dutyId, start, start.plusDays(13));
  }

  void confirm() {
    var p = preview();
    planning.confirm(dutyId, start, start.plusDays(13), p.token());
  }

  @Test
  void migrationAndPersistenceWorkTogether() {
    confirm();
    assertThat(ownAssignments()).hasSize(2);
    assertThat(preview().periods()).allMatch(Period::confirmed);
  }

  @Test
  void stalePreviewCannotBeConfirmed() {
    var old = preview();
    service.addExclusion(dutyId, new ExclusionDefinition(first, start, start, "休暇"));
    assertThatThrownBy(() -> planning.confirm(dutyId, start, start.plusDays(13), old.token()))
        .isInstanceOf(ConflictException.class);
    assertThat(ownAssignments()).isEmpty();
  }

  @Test
  void confirmingTwiceDoesNotDuplicateAssignments() {
    confirm();
    assertThatThrownBy(this::confirm).isInstanceOf(BadRequestException.class);
    assertThat(ownAssignments()).hasSize(2);
  }

  @Test
  void replacementIsPersistedWithHistoryAndDoesNotShiftNextPerson() {
    confirm();
    long id = ownAssignments().getFirst().id();
    assignmentService.replace(id, new Replacement(third, "出張のため代理"));
    assertThat(assignments.findById(id).orElseThrow().employeeId()).isEqualTo(third);
    assertThat(assignments.findChanges(id))
        .singleElement()
        .satisfies(
            c -> {
              assertThat(c.previousName()).isEqualTo("田中");
              assertThat(c.newName()).isEqualTo("鈴木");
            });
    assertThat(preview().periods().get(1).assignees().getFirst().id()).isEqualTo(second);
  }

  @Test
  void exclusionCannotSilentlyInvalidatePublishedAssignment() {
    confirm();
    assertThatThrownBy(
            () -> service.addExclusion(dutyId, new ExclusionDefinition(first, start, start, "休暇")))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void deactivationKeepsPublishedAssignments() {
    confirm();
    employees.updateActive(first, false);
    assertThat(preview().periods().getFirst().assignees().getFirst().id()).isEqualTo(first);
    assertThat(preview().periods().getFirst().confirmed()).isTrue();
  }

  @Test
  void insufficientStaffCannotBePublished() {
    employees.updateActive(first, false);
    employees.updateActive(second, false);
    employees.updateActive(third, false);
    var p = preview();
    assertThatThrownBy(() -> planning.confirm(dutyId, start, start.plusDays(13), p.token()))
        .isInstanceOf(BadRequestException.class);
    assertThat(ownAssignments()).isEmpty();
  }

  @Test
  void duplicateMembershipIsRejected() {
    assertThatThrownBy(
            () ->
                service.create(
                    new DutyDefinition(
                        "朝会", "", start, 1, Unit.WEEK, Strategy.CUSTOM, 1, List.of(first, first))))
        .isInstanceOf(BadRequestException.class);
  }
}
