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
  private final com.dutymanager.repository.schedule.HandoverRepository handovers;
  private final AssignmentProjectionService assignmentProjection;

  public RotationSlotService(
      EmployeeRepository employees,
      ExclusionRepository exclusions,
      ScheduleRepository schedules,
      AssignmentEngine periodEngine,
      Clock clock,
      ScheduleAccess access,
      AssignmentProjectionService assignmentProjection,
      com.dutymanager.repository.schedule.HandoverRepository handovers) {
    this.employees = employees;
    this.exclusions = exclusions;
    this.schedules = schedules;
    this.periodEngine = periodEngine;
    this.clock = clock;
    this.access = access;
    this.assignmentProjection = assignmentProjection;
    this.handovers = handovers;
  }

  private Duty roster(RotationSlot slot) {
    var base = access.duty(slot.dutyId());
    var today = LocalDate.now(clock);
    if (slot.periodStart() != null
        && !slot.periodStart().isAfter(today)
        && !slot.periodEnd().isBefore(today))
      return assignmentProjection.current(
          base, access.rule(base.id()), schedules.meetings(base.id()), today);
    return assignmentProjection.definition(
        base,
        assignmentProjection.at(base.id(), Integer.parseInt(slot.rotationKey().substring(2))));
  }

  @Transactional
  public void replace(long slotId, long employeeId, String reason) {
    replace(slotId, employeeId, reason, null);
  }

  @Transactional
  public void replace(long slotId, long employeeId, String reason, LocalDate from) {
    access.lockPlanning();
    var slot = schedules.slot(slotId).orElseThrow(() -> new NotFoundException("担当枠が見つかりません。"));
    access.lock(slot.dutyId());
    require(
        access.rule(slot.dutyId()).rotationMode() != RotationMode.CALENDAR
            || slot.periodStart() == null
            || slot.periodStart().isAfter(LocalDate.now(clock))
            || slot.periodEnd().isBefore(LocalDate.now(clock)),
        "現在の担当変更は、今後の順番と併せて検討画面で確認してください。");
    var changes = handovers.find(slot.dutyId());
    var segment = com.dutymanager.engine.schedule.SlotAssignmentResolver.at(slot, changes, from);
    var d = roster(slot);
    var today = LocalDate.now(clock);
    require(slot.periodEnd() == null || !slot.periodEnd().isBefore(today), "過去の担当者は変更できません。");
    if (segment.segmented())
      require(
          from != null && from.equals(segment.start()) && !from.isBefore(today),
          "引継ぎのある担当は本日以降に始まる区間だけ変更できます。");
    require(segment.employeeId() != employeeId, "現在と異なる担当者を選択してください。");
    require(
        d.memberIds().contains(employeeId)
            && employees.findAll().stream().anyMatch(e -> e.id() == employeeId && e.active()),
        "有効な参加メンバーを選択してください。");
    require(
        schedules.slots(d.id()).stream()
            .filter(s -> s.id() != slotId && s.rotationKey().equals(slot.rotationKey()))
            .noneMatch(
                s ->
                    com.dutymanager.engine.schedule.SlotAssignmentResolver.at(s, changes, from)
                            .employeeId()
                        == employeeId),
        "この回には既に割り当てられています。");
    require(
        segment.start() == null
            || !periodEngine.excluded(
                employeeId, segment.start(), segment.end(), exclusions.findByDutyId(d.id())),
        "対象外期間に該当するメンバーは指定できません。");
    if (segment.segmented())
      handovers.save(slotId, from, segment.employeeId(), employeeId, reason.trim());
    else schedules.replace(slot, employeeId, reason.trim());
  }

  @Transactional(readOnly = true)
  public List<com.dutymanager.model.employee.Employee> choices(long id) {
    return choices(id, null);
  }

  @Transactional(readOnly = true)
  public List<com.dutymanager.model.employee.Employee> choices(long id, LocalDate from) {
    var slot = schedules.slot(id).orElseThrow(() -> new NotFoundException("担当枠が見つかりません。"));
    var d = roster(slot);
    var changes = handovers.find(d.id());
    var segment = com.dutymanager.engine.schedule.SlotAssignmentResolver.at(slot, changes, from);
    if (segment.segmented()
        && (from == null
            || !from.equals(segment.start())
            || segment.end().isBefore(LocalDate.now(clock)))) return List.of();
    var assigned =
        schedules.slots(d.id()).stream()
            .filter(s -> s.rotationKey().equals(slot.rotationKey()))
            .map(
                s ->
                    com.dutymanager.engine.schedule.SlotAssignmentResolver.at(s, changes, from)
                        .employeeId())
            .toList();
    return employees.findAll().stream()
        .filter(e -> e.active() && d.memberIds().contains(e.id()) && !assigned.contains(e.id()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<RotationChange> changes(long id) {
    require(schedules.slot(id).isPresent(), "担当枠が見つかりません。");
    return schedules.changes(id);
  }
}
