package com.dutymanager.repository.employee;

import com.dutymanager.common.jdbc.JdbcInsertSupport;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.employee.EmployeeDefinition;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcEmployeeRepository implements EmployeeRepository {
  private final JdbcTemplate jdbc;
  private final com.dutymanager.common.jdbc.JdbcPlanningLock planningLock;
  private final JdbcInsertSupport inserts;

  public JdbcEmployeeRepository(
      JdbcTemplate jdbc,
      JdbcInsertSupport inserts,
      com.dutymanager.common.jdbc.JdbcPlanningLock planningLock) {
    this.jdbc = jdbc;
    this.planningLock = planningLock;
    this.inserts = inserts;
  }

  public List<Employee> findAll() {
    return jdbc.query(
        "SELECT id,employee_number,name,active FROM employees ORDER BY employee_number,id",
        this::map);
  }

  private Employee map(ResultSet rs, int row) throws SQLException {
    return new Employee(
        rs.getLong("id"),
        rs.getString("employee_number"),
        rs.getString("name"),
        rs.getBoolean("active"));
  }

  public Optional<Employee> findById(long id) {
    return jdbc
        .query("SELECT id, employee_number, name, active FROM employees WHERE id=?", this::map, id)
        .stream()
        .findFirst();
  }

  public boolean lockById(long id) {
    planningLock.lock();
    return !jdbc.queryForList("SELECT id FROM employees WHERE id=? FOR UPDATE", Long.class, id)
        .isEmpty();
  }

  public boolean hasReferences(long id) {
    return Boolean.TRUE.equals(
        jdbc.queryForObject(
            """
                SELECT EXISTS(SELECT 1 FROM duty_members WHERE employee_id=?)
                  OR EXISTS(SELECT 1 FROM exclusions WHERE employee_id=?)
                  OR EXISTS(SELECT 1 FROM assignments WHERE employee_id=?)
                  OR EXISTS(SELECT 1 FROM duty_rotation_slots WHERE employee_id=?)
                  OR EXISTS(SELECT 1 FROM assignment_changes WHERE previous_employee_id=? OR new_employee_id=?)
                  OR EXISTS(SELECT 1 FROM duty_rotation_changes WHERE previous_employee_id=? OR new_employee_id=?)
            OR EXISTS(SELECT 1 FROM duty_slot_handovers WHERE employee_id=?)
            OR EXISTS(SELECT 1 FROM duty_assignment_plan_members WHERE employee_id=?)
            OR EXISTS(SELECT 1 FROM assignment_plan_changes WHERE employee_id=?)
            OR EXISTS(SELECT 1 FROM assignment_plan_change_items WHERE previous_employee_id=? OR new_employee_id=?)
            """,
            Boolean.class,
            id,
            id,
            id,
            id,
            id,
            id,
            id,
            id,
            id,
            id,
            id,
            id,
            id));
  }

  public void update(long id, EmployeeDefinition input) {
    jdbc.update(
        "UPDATE employees SET employee_number=?, name=? WHERE id=?",
        input.employeeNumber().trim(),
        input.name().trim(),
        id);
  }

  public void delete(long id) {
    jdbc.update("DELETE FROM employees WHERE id=?", id);
  }

  public long save(EmployeeDefinition input) {
    planningLock.lock();
    return inserts.insert(
        "INSERT INTO employees(employee_number,name) VALUES (?,?)",
        input.employeeNumber().trim(),
        input.name().trim());
  }

  public int updateActive(long id, boolean active) {
    planningLock.lock();
    return jdbc.update("UPDATE employees SET active=? WHERE id=?", active, id);
  }
}
