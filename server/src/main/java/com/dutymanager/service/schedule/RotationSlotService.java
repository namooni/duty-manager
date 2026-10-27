package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.engine.rotation.AssignmentEngine;
import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.*;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.ScheduleRepository;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RotationSlotService {
  private final EmployeeRepository employees;
  private final ExclusionRepository exclusions;
  private final ScheduleRepository schedules;
  private final AssignmentEngine periodEngine;
  private final Clock clock;
  private final ScheduleAccess access;

  public RotationSlotService(
      EmployeeRepository employees,
      ExclusionRepository exclusions,
      ScheduleRepository schedules,
      AssignmentEngine periodEngine,
      Clock clock,
      ScheduleAccess access) {
    this.employees = employees;
    this.exclusions = exclusions;
    this.schedules = schedules;
    this.periodEngine = periodEngine;
    this.clock = clock;
    this.access = access;
  }

  @Transactional
  public void replace(long slotId, long employeeId, String reason) {
    var initial = schedules.slot(slotId).orElseThrow(() -> new NotFoundException("担当枠が見つかりません。"));
    access.lock(initial.dutyId());
    var slot = schedules.slot(slotId).orElseThrow();
    var d = access.duty(slot.dutyId());
    require(
        slot.periodEnd() == null || !slot.periodEnd().isBefore(LocalDate.now(clock)),
        "過去の担当者は変更できません。");
    require(slot.employeeId() != employeeId, "現在と異なる担当者を選択してください。");
    require(
        d.memberIds().contains(employeeId)
            && employees.findAll().stream().anyMatch(e -> e.id() == employeeId && e.active()),
        "有効な参加メンバーを選択してください。");
    require(
        schedules.slots(d.id()).stream()
            .noneMatch(
                s -> s.rotationKey().equals(slot.rotationKey()) && s.employeeId() == employeeId),
        "この回には既に割り当てられています。");
    require(
        slot.periodStart() == null
            || !periodEngine.excluded(
                employeeId, slot.periodStart(), slot.periodEnd(), exclusions.findByDutyId(d.id())),
        "対象外期間に該当するメンバーは指定できません。");
    schedules.replace(slot, employeeId, reason.trim());
  }

  @Transactional(readOnly = true)
  public List<RotationChange> changes(long id) {
    require(schedules.slot(id).isPresent(), "担当枠が見つかりません。");
    return schedules.changes(id);
  }
}
