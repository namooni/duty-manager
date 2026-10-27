package com.dutymanager.repository.assignment;

import com.dutymanager.common.jdbc.JdbcInsertSupport;
import com.dutymanager.mapper.assignment.AssignmentChangeRow;
import com.dutymanager.mapper.assignment.AssignmentMapper;
import com.dutymanager.model.assignment.Assignment;
import com.dutymanager.model.assignment.Change;
import com.dutymanager.model.assignment.Replacement;
import com.dutymanager.model.planning.Period;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SqlAssignmentRepository implements AssignmentRepository {
  private final JdbcTemplate jdbc;
  private final JdbcInsertSupport inserts;
  private final AssignmentMapper mapper;

  public SqlAssignmentRepository(
      JdbcTemplate jdbc, JdbcInsertSupport inserts, AssignmentMapper mapper) {
    this.jdbc = jdbc;
    this.inserts = inserts;
    this.mapper = mapper;
  }

  public List<Assignment> findAll(LocalDate from, LocalDate to) {
    return mapper.findAll(from, to);
  }

  public Optional<Assignment> findById(long id) {
    return Optional.ofNullable(mapper.findById(id));
  }

  public List<Change> findChanges(long id) {
    return mapper.findChanges(id).stream().map(AssignmentChangeRow::toDomain).toList();
  }

  public void savePeriod(long dutyId, Period p) {
    for (int i = 0; i < p.assignees().size(); i++)
      inserts.insert(
          "INSERT INTO assignments(duty_id,period_start,period_end,employee_id,slot_index) VALUES"
              + " (?,?,?,?,?)",
          dutyId,
          Date.valueOf(p.start()),
          Date.valueOf(p.end()),
          p.assignees().get(i).id(),
          i);
  }

  public void replace(Assignment current, Replacement input) {
    jdbc.update(
        "UPDATE assignments SET employee_id=? WHERE id=?", input.employeeId(), current.id());
    inserts.insert(
        "INSERT INTO assignment_changes(assignment_id,previous_employee_id,new_employee_id,reason)"
            + " VALUES (?,?,?,?)",
        current.id(),
        current.employeeId(),
        input.employeeId(),
        input.reason().trim());
  }
}
