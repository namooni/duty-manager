package com.dutymanager.service.employee;

import com.dutymanager.exception.ConflictException;
import com.dutymanager.exception.NotFoundException;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.employee.EmployeeDefinition;
import com.dutymanager.repository.employee.EmployeeRepository;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {
  private final EmployeeRepository employees;
  private final com.dutymanager.repository.schedule.AssignmentPlanRepository plans;

  public EmployeeService(
      EmployeeRepository employees,
      com.dutymanager.repository.schedule.AssignmentPlanRepository plans) {
    this.employees = employees;
    this.plans = plans;
  }

  @Transactional(readOnly = true)
  public List<Employee> findAll() {
    return employees.findAll();
  }

  @Transactional
  public long create(EmployeeDefinition definition) {
    return employees.save(definition);
  }

  private static final String DELETE_BLOCKED =
      "当番への参加、担当予定、対象外期間、または変更履歴があるメンバーは削除できません。退職などの場合は「無効にする」を使用してください。";

  private Employee lock(long id) {
    if (!employees.lockById(id)) throw new NotFoundException("メンバーが見つかりません。");
    return employees.findById(id).orElseThrow(() -> new NotFoundException("メンバーが見つかりません。"));
  }

  @Transactional(readOnly = true)
  public boolean canDelete(long id) {
    if (employees.findById(id).isEmpty()) throw new NotFoundException("メンバーが見つかりません。");
    return !employees.hasReferences(id);
  }

  @Transactional
  public void update(long id, EmployeeDefinition input, EmployeeDefinition expected) {
    var current = lock(id);
    if (!current.name().equals(expected.name())
        || !current.employeeNumber().equals(expected.employeeNumber()))
      throw new ConflictException("メンバー情報が更新されています。一覧を更新して、もう一度編集してください。");
    try {
      employees.update(id, input);
    } catch (DuplicateKeyException cause) {
      throw new ConflictException("この社員番号はすでに使われています。");
    }
  }

  @Transactional
  public void delete(long id) {
    lock(id);
    if (employees.hasReferences(id)) throw new ConflictException(DELETE_BLOCKED);
    try {
      employees.delete(id);
    } catch (DataIntegrityViolationException cause) {
      throw new ConflictException(DELETE_BLOCKED);
    }
  }

  @Transactional
  public void updateActive(long id, boolean active) {
    plans.lock();
    if (plans.requiresReview(id))
      throw new ConflictException("担当予定への影響確認が必要です。状態変更の検討画面から操作してください。");
    if (employees.updateActive(id, active) == 0) throw new NotFoundException("項目が見つかりません。");
  }
}
