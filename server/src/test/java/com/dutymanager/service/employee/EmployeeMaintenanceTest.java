package com.dutymanager.service.employee;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.*;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.service.duty.DutyService;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class EmployeeMaintenanceTest {
  @Autowired EmployeeService service;
  @Autowired EmployeeRepository employees;
  @Autowired DutyService duties;
  @Autowired JdbcTemplate db;
  @Autowired Clock clock;

  long person(String number) {
    return service.create(new EmployeeDefinition(number, "担当者"));
  }

  long duty(long employee) {
    return duties.create(
        new DutyDefinition(
            "当番",
            "",
            LocalDate.now(clock),
            1,
            Unit.WEEK,
            Strategy.EMPLOYEE_NUMBER,
            1,
            List.of(employee)));
  }

  long assignment(long duty, long employee) {
    db.update(
        "INSERT INTO assignments(duty_id,period_start,period_end,employee_id,slot_index) VALUES"
            + " (?,CURRENT_DATE,CURRENT_DATE,?,0)",
        duty,
        employee);
    return db.queryForObject("SELECT id FROM assignments WHERE duty_id=?", Long.class, duty);
  }

  long slot(long duty, long employee) {
    db.update(
        "INSERT INTO duty_rotation_slots(duty_id,rotation_key,slot_index,employee_id) VALUES"
            + " (?,'E:0',0,?)",
        duty,
        employee);
    return db.queryForObject(
        "SELECT id FROM duty_rotation_slots WHERE duty_id=?", Long.class, duty);
  }

  @Test
  void editsMetadataWithoutChangingSavedAssignmentsOrStatusAndRejectsStaleEdits() {
    long employee = person("EDIT001"), task = duty(employee);
    long saved = assignment(task, employee);
    employees.updateActive(employee, false);
    service.update(
        employee,
        new EmployeeDefinition("EDIT002", "変更後"),
        new EmployeeDefinition("EDIT001", "担当者"));
    assertThat(employees.findById(employee).orElseThrow())
        .isEqualTo(new Employee(employee, "EDIT002", "変更後", false));
    assertThat(
            db.queryForObject("SELECT employee_id FROM assignments WHERE id=?", Long.class, saved))
        .isEqualTo(employee);
    assertThat(
            db.queryForObject(
                "SELECT employee_id FROM duty_members WHERE duty_id=?", Long.class, task))
        .isEqualTo(employee);
    assertThatThrownBy(
            () ->
                service.update(
                    employee,
                    new EmployeeDefinition("EDIT003", "再編集"),
                    new EmployeeDefinition("EDIT001", "担当者")))
        .isInstanceOf(ConflictException.class);
  }

  @Test
  void duplicateNumbersAreRejectedWithoutChangingTheEmployee() {
    long employee = person("DUP001");
    person("DUP002");
    assertThatThrownBy(
            () ->
                service.update(
                    employee,
                    new EmployeeDefinition("DUP002", "変更後"),
                    new EmployeeDefinition("DUP001", "担当者")))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("社員番号");
    assertThat(employees.findById(employee).orElseThrow().employeeNumber()).isEqualTo("DUP001");
  }

  @Test
  void deletesOnlyUnreferencedEmployeesAndReturnsNotFoundForMissingOnes() {
    long target = person("DELETE001"), other = person("DELETE002");
    assertThat(service.canDelete(target)).isTrue();
    service.delete(target);
    assertThat(employees.findById(target)).isEmpty();
    assertThat(employees.findById(other)).isPresent();
    assertThatThrownBy(() -> service.delete(target)).isInstanceOf(NotFoundException.class);
    assertThatThrownBy(() -> service.canDelete(target)).isInstanceOf(NotFoundException.class);
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
        "member",
        "exclusion",
        "assignment",
        "slot",
        "oldAssignment",
        "newAssignment",
        "oldRotation",
        "newRotation"
      })
  void protectsEveryRelationshipIncludingHistoryOnlyReferences(String relationship) {
    long target = person("REF001"), other = person("REF002"), task = duty(other);
    switch (relationship) {
      case "member" -> db.update("INSERT INTO duty_members VALUES (?,?,1)", task, target);
      case "exclusion" ->
          db.update(
              "INSERT INTO exclusions(duty_id,employee_id,start_date,end_date,reason) VALUES"
                  + " (?,?,CURRENT_DATE,CURRENT_DATE,'test')",
              task,
              target);
      case "assignment" -> assignment(task, target);
      case "slot" -> slot(task, target);
      case "oldAssignment", "newAssignment" ->
          db.update(
              "INSERT INTO"
                  + " assignment_changes(assignment_id,previous_employee_id,new_employee_id,reason)"
                  + " VALUES (?,?,?,'test')",
              assignment(task, other),
              relationship.equals("oldAssignment") ? target : other,
              relationship.equals("newAssignment") ? target : other);
      case "oldRotation", "newRotation" ->
          db.update(
              "INSERT INTO"
                  + " duty_rotation_changes(rotation_slot_id,previous_employee_id,new_employee_id,reason)"
                  + " VALUES (?,?,?,'test')",
              slot(task, other),
              relationship.equals("oldRotation") ? target : other,
              relationship.equals("newRotation") ? target : other);
      default -> throw new IllegalArgumentException();
    }
    assertThat(service.canDelete(target)).isFalse();
    assertThatThrownBy(() -> service.delete(target))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("削除できません");
    assertThat(employees.findById(target)).isPresent();
  }
}
