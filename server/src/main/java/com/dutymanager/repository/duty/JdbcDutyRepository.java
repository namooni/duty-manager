package com.dutymanager.repository.duty;

import com.dutymanager.common.jdbc.JdbcInsertSupport;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.DutyDefinition;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.duty.Unit;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcDutyRepository implements DutyRepository {
  private final JdbcTemplate jdbc;
  private final com.dutymanager.common.jdbc.JdbcPlanningLock planningLock;
  private final JdbcInsertSupport inserts;

  public JdbcDutyRepository(
      JdbcTemplate jdbc,
      JdbcInsertSupport inserts,
      com.dutymanager.common.jdbc.JdbcPlanningLock planningLock) {
    this.jdbc = jdbc;
    this.planningLock = planningLock;
    this.inserts = inserts;
  }

  public List<Duty> findAll() {
    Map<Long, List<Long>> members = new HashMap<>();
    jdbc.query(
        "SELECT duty_id,employee_id FROM duty_members ORDER BY duty_id,position_index",
        (org.springframework.jdbc.core.RowCallbackHandler)
            rs ->
                members
                    .computeIfAbsent(rs.getLong("duty_id"), key -> new ArrayList<>())
                    .add(rs.getLong("employee_id")));
    return jdbc.query(
        "SELECT * FROM duties ORDER BY id DESC",
        (rs, n) -> map(rs, members.getOrDefault(rs.getLong("id"), List.of())));
  }

  public Optional<Duty> findById(long id) {
    List<Long> members =
        jdbc.queryForList(
            "SELECT employee_id FROM duty_members WHERE duty_id=? ORDER BY position_index",
            Long.class,
            id);
    return jdbc.query("SELECT * FROM duties WHERE id=?", (rs, n) -> map(rs, members), id).stream()
        .findFirst();
  }

  private Duty map(ResultSet rs, List<Long> members) throws SQLException {
    return new Duty(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("description"),
        rs.getDate("anchor_date").toLocalDate(),
        rs.getInt("interval_count"),
        Unit.valueOf(rs.getString("interval_unit")),
        Strategy.valueOf(rs.getString("strategy")),
        rs.getInt("assignee_count"),
        members,
        rs.getObject("random_seed") == null ? rs.getLong("id") : rs.getLong("random_seed"));
  }

  public long save(DutyDefinition input, Long randomSeed) {
    planningLock.lock();
    long id =
        inserts.insert(
            "INSERT INTO"
                + " duties(name,description,anchor_date,interval_count,interval_unit,strategy,assignee_count,random_seed)"
                + " VALUES (?,?,?,?,?,?,?,?)",
            input.name().trim(),
            input.description().trim(),
            Date.valueOf(input.anchorDate()),
            input.intervalCount(),
            input.intervalUnit().name(),
            input.strategy().name(),
            input.assigneeCount(),
            randomSeed);
    for (int i = 0; i < input.memberIds().size(); i++)
      jdbc.update(
          "INSERT INTO duty_members(duty_id,employee_id,position_index) VALUES (?,?,?)",
          id,
          input.memberIds().get(i),
          i);
    return id;
  }

  public void updateDetails(long id, String name, String description) {
    jdbc.update("UPDATE duties SET name=?, description=? WHERE id=?", name, description, id);
  }

  public void delete(long id) {
    jdbc.update("DELETE FROM assignment_plan_change_items WHERE duty_id=?", id);
    jdbc.update(
        "DELETE FROM duty_assignment_plan_members WHERE plan_id IN (SELECT id FROM"
            + " duty_assignment_plans WHERE duty_id=?)",
        id);
    jdbc.update("DELETE FROM duty_assignment_plans WHERE duty_id=?", id);
    jdbc.update("DELETE FROM duty_schedule_ranges WHERE duty_id=?", id);
    jdbc.update(
        "DELETE FROM duty_slot_handovers WHERE rotation_slot_id IN (SELECT id FROM"
            + " duty_rotation_slots WHERE duty_id=?)",
        id);
    jdbc.update("DELETE FROM duty_schedule_date_changes WHERE duty_id=?", id);
    jdbc.update(
        "DELETE FROM duty_rotation_changes WHERE rotation_slot_id IN (SELECT id FROM"
            + " duty_rotation_slots WHERE duty_id=?)",
        id);
    jdbc.update(
        "DELETE FROM assignment_changes WHERE assignment_id IN (SELECT id FROM assignments WHERE"
            + " duty_id=?)",
        id);
    // Fixed table names, in foreign-key order. The service holds the duty row lock.
    for (String table :
        List.of(
            "duty_rotation_slots",
            "duty_meetings",
            "duty_schedules",
            "assignments",
            "exclusions",
            "duty_members")) {
      jdbc.update("DELETE FROM " + table + " WHERE duty_id=?", id);
    }
    jdbc.update("DELETE FROM duties WHERE id=?", id);
  }

  public void lockPlanning() {
    planningLock.lock();
  }

  public boolean lockById(long id) {
    planningLock.lock();
    return !jdbc.queryForList("SELECT id FROM duties WHERE id=? FOR UPDATE", Long.class, id)
        .isEmpty();
  }
}
