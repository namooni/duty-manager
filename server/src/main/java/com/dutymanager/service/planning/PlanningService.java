package com.dutymanager.service.planning;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.common.time.DateRangeValidator;
import com.dutymanager.engine.rotation.AssignmentEngine;
import com.dutymanager.exception.ConflictException;
import com.dutymanager.exception.NotFoundException;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.DutyDefinition;
import com.dutymanager.model.planning.Period;
import com.dutymanager.model.planning.Preview;
import com.dutymanager.repository.assignment.AssignmentRepository;
import com.dutymanager.repository.duty.DutyRepository;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.service.duty.DutyService;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlanningService {
  private final EmployeeRepository employees;
  private final DutyRepository duties;
  private final ExclusionRepository exclusions;
  private final AssignmentRepository assignments;
  private final AssignmentEngine engine;
  private final DutyService dutyService;

  public PlanningService(
      EmployeeRepository employees,
      DutyRepository duties,
      ExclusionRepository exclusions,
      AssignmentRepository assignments,
      AssignmentEngine engine,
      DutyService dutyService) {
    this.employees = employees;
    this.duties = duties;
    this.exclusions = exclusions;
    this.assignments = assignments;
    this.engine = engine;
    this.dutyService = dutyService;
  }

  @Transactional(readOnly = true)
  public Preview preview(long dutyId, LocalDate from, LocalDate to) {
    DateRangeValidator.validate(from, to);
    var duty = getDuty(dutyId);
    var periods =
        engine.generate(
            duty,
            employees.findAll(),
            exclusions.findByDutyId(dutyId),
            assignments.findAll(duty.anchorDate(), to),
            from,
            to);
    return new Preview(hash(periods.toString()), periods);
  }

  @Transactional
  public void confirm(long dutyId, LocalDate from, LocalDate to, String token) {
    lockDuty(dutyId);
    Preview preview = preview(dutyId, from, to);
    if (!preview.token().equals(token))
      throw new ConflictException("プレビュー後に予定が変更されました。再度プレビューを確認してください。");
    pendingPeriods(preview).forEach(p -> assignments.savePeriod(dutyId, p));
  }

  @Transactional(readOnly = true)
  public Preview previewDraft(DutyDefinition input, LocalDate from, LocalDate to, long seed) {
    DateRangeValidator.validate(from, to);
    require(from.equals(input.anchorDate()), "最初の予定は担当開始日から確認してください。");
    dutyService.validateDefinition(input);
    var draft =
        new Duty(
            0,
            input.name(),
            input.description(),
            input.anchorDate(),
            input.intervalCount(),
            input.intervalUnit(),
            input.strategy(),
            input.assigneeCount(),
            input.memberIds(),
            seed);
    var periods = engine.generate(draft, employees.findAll(), List.of(), List.of(), from, to);
    return new Preview(hash(input.toString() + from + to + seed + periods), periods);
  }

  @Transactional
  public long createConfirmed(
      DutyDefinition input, LocalDate from, LocalDate to, long seed, String token) {
    var preview = previewDraft(input, from, to, seed);
    if (!preview.token().equals(token))
      throw new ConflictException("参加メンバーの情報が変更されました。入力に戻って再度プレビューを確認してください。");
    var pending = pendingPeriods(preview);
    long id = dutyService.create(input, seed);
    pending.forEach(period -> assignments.savePeriod(id, period));
    return id;
  }

  private List<Period> pendingPeriods(Preview preview) {
    var pending = preview.periods().stream().filter(p -> !p.confirmed()).toList();
    require(!pending.isEmpty(), "新しく確定する予定がありません。");
    require(pending.stream().noneMatch(p -> p.warning() != null), "人数が不足している期間があります。設定を確認してください。");
    return pending;
  }

  private Duty getDuty(long id) {
    return duties.findById(id).orElseThrow(() -> new NotFoundException("当番が見つかりません。"));
  }

  private void lockDuty(long id) {
    if (!duties.lockById(id)) throw new NotFoundException("当番が見つかりません。");
  }

  private String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              java.security.MessageDigest.getInstance("SHA-256")
                  .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (java.security.NoSuchAlgorithmException ex) {
      throw new IllegalStateException(ex);
    }
  }
}
