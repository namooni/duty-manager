package com.dutymanager.repository.employee;

import com.dutymanager.common.jdbc.JdbcInsertSupport;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.employee.EmployeeDefinition;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcEmployeeRepository implements EmployeeRepository {
  private final JdbcTemplate jdbc;
  private final JdbcInsertSupport inserts;

  public JdbcEmployeeRepository(JdbcTemplate jdbc, JdbcInsertSupport inserts) {
    this.jdbc = jdbc;
    this.inserts = inserts;
  }

  public List<Employee> findAll() {
    return jdbc.query(
        "SELECT id,employee_number,name,active FROM employees ORDER BY employee_number,id",
        (rs, n) ->
            new Employee(
                rs.getLong("id"),
                rs.getString("employee_number"),
                rs.getString("name"),
                rs.getBoolean("active")));
  }

  public long save(EmployeeDefinition input) {
    return inserts.insert(
        "INSERT INTO employees(employee_number,name) VALUES (?,?)",
        input.employeeNumber().trim(),
        input.name().trim());
  }

  public int updateActive(long id, boolean active) {
    return jdbc.update("UPDATE employees SET active=? WHERE id=?", active, id);
  }
}
