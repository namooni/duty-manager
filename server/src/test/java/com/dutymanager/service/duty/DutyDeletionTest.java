package com.dutymanager.service.duty;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.NotFoundException;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.EmployeeDefinition;
import com.dutymanager.repository.employee.EmployeeRepository;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class DutyDeletionTest {
  @Autowired DutyService service;
  @Autowired EmployeeRepository employees;
  @Autowired JdbcTemplate db;
  @Autowired Clock clock;

  long create(long person) {
    long id =
        service.create(
            new DutyDefinition(
                "同名当番",
                "",
                LocalDate.now(clock),
                1,
                Unit.MONTH,
                Strategy.CUSTOM,
                1,
                List.of(person)));
    db.update(
        "INSERT INTO duty_schedules VALUES (?, 'EXPLICIT_DATES', 'OCCURRENCE', 0, 1, 1, 1, 1)", id);
    db.update("INSERT INTO duty_meetings VALUES (?, 0, CURRENT_DATE)", id);
    db.update(
        "INSERT INTO duty_rotation_slots(duty_id,rotation_key,slot_index,employee_id) VALUES (?,"
            + " 'O:0', 0, ?)",
        id,
        person);
    long slot =
        db.queryForObject("SELECT id FROM duty_rotation_slots WHERE duty_id=?", Long.class, id);
    db.update(
        "INSERT INTO"
            + " duty_rotation_changes(rotation_slot_id,previous_employee_id,new_employee_id,reason)"
            + " VALUES (?, ?, ?, 'test')",
        slot,
        person,
        person);
    db.update(
        "INSERT INTO assignments(duty_id,period_start,period_end,employee_id,slot_index) VALUES (?,"
            + " CURRENT_DATE, CURRENT_DATE, ?, 0)",
        id,
        person);
    long assignment =
        db.queryForObject("SELECT id FROM assignments WHERE duty_id=?", Long.class, id);
    db.update(
        "INSERT INTO assignment_changes(assignment_id,previous_employee_id,new_employee_id,reason)"
            + " VALUES (?, ?, ?, 'test')",
        assignment,
        person,
        person);
    db.update(
        "INSERT INTO exclusions(duty_id,employee_id,start_date,end_date,reason) VALUES (?, ?,"
            + " CURRENT_DATE, CURRENT_DATE, 'test')",
        id,
        person);
    return id;
  }

  @Test
  void removesOnlyTheRequestedDutyIncludingBothKindsOfHistory() {
    long person = employees.save(new EmployeeDefinition("DELETE_TEST", "担当者"));
    long target = create(person), other = create(person);
    int peopleBefore = employees.findAll().size();
    service.delete(target);
    for (String table :
        List.of(
            "duties",
            "duty_members",
            "duty_schedules",
            "duty_meetings",
            "duty_rotation_slots",
            "assignments",
            "exclusions")) {
      String key = table.equals("duties") ? "id" : "duty_id";
      assertThat(
              db.queryForObject(
                  "SELECT COUNT(*) FROM " + table + " WHERE " + key + "=?", Integer.class, target))
          .as(table)
          .isZero();
      assertThat(
              db.queryForObject(
                  "SELECT COUNT(*) FROM " + table + " WHERE " + key + "=?", Integer.class, other))
          .as(table)
          .isEqualTo(1);
    }
    for (String table : List.of("assignment_changes", "duty_rotation_changes"))
      assertThat(db.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class))
          .as(table)
          .isEqualTo(1);
    assertThat(employees.findAll()).hasSize(peopleBefore);
    assertThatThrownBy(() -> service.delete(target)).isInstanceOf(NotFoundException.class);
  }
}
