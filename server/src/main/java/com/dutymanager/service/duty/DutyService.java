package com.dutymanager.service.duty;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.common.time.DateRangeValidator;
import com.dutymanager.exception.NotFoundException;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.DutyDefinition;
import com.dutymanager.model.duty.Exclusion;
import com.dutymanager.model.duty.ExclusionDefinition;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.repository.assignment.AssignmentRepository;
import com.dutymanager.repository.duty.DutyRepository;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DutyService {
  private final EmployeeRepository employees;
  private final DutyRepository duties;
  private final ExclusionRepository exclusions;
  private final AssignmentRepository assignments;
  private final Clock clock;
  private final com.dutymanager.repository.schedule.ScheduleRepository schedules;

  public DutyService(
      EmployeeRepository employees,
      DutyRepository duties,
      ExclusionRepository exclusions,
      AssignmentRepository assignments,
      Clock clock,
      com.dutymanager.repository.schedule.ScheduleRepository schedules) {
    this.employees = employees;
    this.duties = duties;
    this.exclusions = exclusions;
    this.assignments = assignments;
    this.clock = clock;
    this.schedules = schedules;
  }

  @Transactional
  public long create(DutyDefinition input) {
    return create(input, null);
  }

  @Transactional
  public long create(DutyDefinition input, Long randomSeed) {
    validateDefinition(input);
    return duties.save(input, randomSeed);
  }

  @Transactional(readOnly = true)
  public void validateDefinition(DutyDefinition input) {
    require(new HashSet<>(input.memberIds()).size() == input.memberIds().size(), "参加メンバーが重複しています。");
    require(input.assigneeCount() <= input.memberIds().size(), "参加メンバーが担当人数より少なくなっています。");
    require(
        !input.anchorDate().isBefore(LocalDate.now(clock).minusYears(10))
            && !input.anchorDate().isAfter(LocalDate.now(clock).plusYears(10)),
        "開始日は現在から前後10年以内で指定してください。");
    Set<Long> activeIds = new HashSet<>();
    employees.findAll().stream().filter(Employee::active).forEach(e -> activeIds.add(e.id()));
    require(activeIds.containsAll(input.memberIds()), "有効なメンバーのみ参加者に登録できます。");
  }

  @Transactional
  public void addExclusion(long dutyId, ExclusionDefinition input) {
    lockDuty(dutyId);
    var duty = getDuty(dutyId);
    require(duty.memberIds().contains(input.employeeId()), "この当番の参加メンバーのみ対象外に設定できます。");
    DateRangeValidator.validate(input.startDate(), input.endDate());
    require(
        assignments.findAll(input.startDate(), input.endDate()).stream()
            .noneMatch(a -> a.dutyId() == dutyId && a.employeeId() == input.employeeId()),
        "確定済みの担当期間と重なっています。先に担当者を変更してください。");
    require(
        schedules.slots(dutyId).stream()
            .noneMatch(
                slot ->
                    slot.employeeId() == input.employeeId()
                        && slot.periodStart() != null
                        && !slot.periodStart().isAfter(input.endDate())
                        && !slot.periodEnd().isBefore(input.startDate())),
        "保存済みの担当期間と重なっています。先に担当者を変更してください。");
    exclusions.save(dutyId, input);
  }

  private Duty getDuty(long id) {
    return duties.findById(id).orElseThrow(() -> new NotFoundException("当番が見つかりません。"));
  }

  private void lockDuty(long id) {
    if (!duties.lockById(id)) throw new NotFoundException("当番が見つかりません。");
  }

  @Transactional(readOnly = true)
  public List<Duty> findAll() {
    return duties.findAll();
  }

  @Transactional(readOnly = true)
  public List<Exclusion> findExclusions(long dutyId) {
    getDuty(dutyId);
    return exclusions.findByDutyId(dutyId);
  }
}
