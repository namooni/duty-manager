package com.dutymanager.service.assignment;

import com.dutymanager.common.time.DateRangeValidator;
import com.dutymanager.engine.rotation.AssignmentEngine;
import com.dutymanager.exception.BadRequestException;
import com.dutymanager.exception.NotFoundException;
import com.dutymanager.model.assignment.Assignment;
import com.dutymanager.model.assignment.Change;
import com.dutymanager.model.assignment.Replacement;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.repository.assignment.AssignmentRepository;
import com.dutymanager.repository.duty.DutyRepository;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignmentService {
  private final EmployeeRepository employees;
  private final DutyRepository duties;
  private final ExclusionRepository exclusions;
  private final AssignmentRepository assignments;
  private final AssignmentEngine engine;

  public AssignmentService(
      EmployeeRepository employees,
      DutyRepository duties,
      ExclusionRepository exclusions,
      AssignmentRepository assignments,
      AssignmentEngine engine) {
    this.employees = employees;
    this.duties = duties;
    this.exclusions = exclusions;
    this.assignments = assignments;
    this.engine = engine;
  }

  @Transactional
  public void replace(long assignmentId, Replacement input) {
    Assignment initial = getAssignment(assignmentId);
    lockDuty(initial.dutyId());
    Assignment assignment = getAssignment(assignmentId);
    Duty duty = getDuty(assignment.dutyId());
    require(assignment.employeeId() != input.employeeId(), "現在の担当者と同じメンバーです。");
    require(duty.memberIds().contains(input.employeeId()), "この当番の参加メンバーを選択してください。");
    require(
        employees.findAll().stream().anyMatch(e -> e.id() == input.employeeId() && e.active()),
        "有効なメンバーを選択してください。");
    require(
        !engine.excluded(
            input.employeeId(),
            assignment.periodStart(),
            assignment.periodEnd(),
            exclusions.findByDutyId(duty.id())),
        "選択したメンバーの対象外期間と重なっています。");
    require(
        assignments.findAll(assignment.periodStart(), assignment.periodEnd()).stream()
            .noneMatch(
                a ->
                    a.dutyId() == duty.id()
                        && a.periodStart().equals(assignment.periodStart())
                        && a.employeeId() == input.employeeId()),
        "すでに同じ期間の担当者に割り当てられています。");
    assignments.replace(assignment, input);
  }

  private Duty getDuty(long id) {
    return duties.findById(id).orElseThrow(() -> new NotFoundException("当番が見つかりません。"));
  }

  private void lockDuty(long id) {
    if (!duties.lockById(id)) throw new NotFoundException("当番が見つかりません。");
  }

  private void require(boolean condition, String message) {
    if (!condition) throw new BadRequestException(message);
  }

  private Assignment getAssignment(long id) {
    return assignments.findById(id).orElseThrow(() -> new NotFoundException("割当が見つかりません。"));
  }

  @Transactional(readOnly = true)
  public List<Assignment> findAll(LocalDate from, LocalDate to) {
    DateRangeValidator.validate(from, to);
    return assignments.findAll(from, to);
  }

  @Transactional(readOnly = true)
  public List<Change> findChanges(long id) {
    getAssignment(id);
    return assignments.findChanges(id);
  }
}
