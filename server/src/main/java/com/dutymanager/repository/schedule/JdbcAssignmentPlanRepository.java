package com.dutymanager.repository.schedule;

import com.dutymanager.common.jdbc.*;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.schedule.*;
import java.sql.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAssignmentPlanRepository implements AssignmentPlanRepository {
  private final JdbcTemplate jdbc;
  private final JdbcInsertSupport inserts;
  private final JdbcPlanningLock mutex;

  public JdbcAssignmentPlanRepository(
      JdbcTemplate jdbc, JdbcInsertSupport inserts, JdbcPlanningLock mutex) {
    this.jdbc = jdbc;
    this.inserts = inserts;
    this.mutex = mutex;
  }

  public void lock() {
    mutex.lock();
  }

  public List<AssignmentPlan> plans(long dutyId) {
    return jdbc.query(
        "SELECT * FROM duty_assignment_plans WHERE duty_id=? AND superseded=FALSE ORDER BY"
            + " start_index,id",
        (rs, n) -> {
          long id = rs.getLong("id");
          var members = new ArrayList<Long>();
          var initial = new TreeMap<Integer, Long>();
          var eligible = new LinkedHashSet<Long>();
          jdbc.query(
              "SELECT * FROM duty_assignment_plan_members WHERE plan_id=? ORDER BY position_index",
              (org.springframework.jdbc.core.RowCallbackHandler)
                  m -> {
                    long employee = m.getLong("employee_id");
                    members.add(employee);
                    if (m.getObject("initial_position") != null)
                      initial.put(m.getInt("initial_position"), employee);
                    if (m.getBoolean("eligible")) eligible.add(employee);
                  },
              id);
          return new AssignmentPlan(
              id,
              dutyId,
              rs.getInt("start_index"),
              rs.getInt("assignee_count"),
              Strategy.valueOf(rs.getString("strategy")),
              rs.getLong("random_seed"),
              rs.getLong("next_round"),
              members,
              new ArrayList<>(initial.values()),
              eligible,
              rs.getString("reason"),
              rs.getDate("members_from") == null ? null : rs.getDate("members_from").toLocalDate());
        },
        dutyId);
  }

  public boolean hasPlans(long dutyId) {
    return jdbc.queryForObject(
            "SELECT COUNT(*) FROM duty_assignment_plans WHERE duty_id=?", Integer.class, dutyId)
        > 0;
  }

  public void save(AssignmentPlan p) {
    jdbc.update(
        "UPDATE duty_assignment_plans SET superseded=TRUE WHERE duty_id=? AND start_index=? AND"
            + " superseded=FALSE",
        p.dutyId(),
        p.startIndex());
    long id =
        inserts.insert(
            "INSERT INTO"
                + " duty_assignment_plans(duty_id,start_index,assignee_count,strategy,random_seed,next_round,reason,members_from)"
                + " VALUES (?,?,?,?,?,?,?,?)",
            p.dutyId(),
            p.startIndex(),
            p.assigneeCount(),
            p.strategy().name(),
            p.seed(),
            p.nextRound(),
            p.reason(),
            p.membersFrom() == null ? null : java.sql.Date.valueOf(p.membersFrom()));
    for (int i = 0; i < p.members().size(); i++) {
      long e = p.members().get(i);
      int first = p.initialQueue().indexOf(e);
      jdbc.update(
          "INSERT INTO"
              + " duty_assignment_plan_members(plan_id,employee_id,position_index,initial_position,eligible)"
              + " VALUES (?,?,?,?,?)",
          id,
          e,
          i,
          first < 0 ? null : first,
          p.eligible().contains(e));
    }
  }

  public boolean requiresReview(long employeeId) {
    return jdbc.queryForObject(
        """
        SELECT EXISTS(SELECT 1 FROM duty_members m JOIN duty_schedules s ON s.duty_id=m.duty_id WHERE m.employee_id=?)
        OR EXISTS(SELECT 1 FROM duty_assignment_plan_members m JOIN duty_assignment_plans p ON p.id=m.plan_id WHERE m.employee_id=? AND p.superseded=FALSE)
        OR EXISTS(SELECT 1 FROM assignments WHERE employee_id=? AND period_end>=CURRENT_DATE)
        """,
        Boolean.class,
        employeeId,
        employeeId,
        employeeId);
  }

  public String historyStamp() {
    return jdbc.query(
            "SELECT COUNT(*),COALESCE(MAX(id),0) FROM duty_rotation_changes",
            (rs, n) -> rs.getLong(1) + ":" + rs.getLong(2))
        .getFirst();
  }

  public List<AssignmentReview.History> history(long dutyId) {
    return jdbc.query(
        "SELECT * FROM duty_assignment_plans WHERE duty_id=? ORDER BY id DESC",
        (rs, n) ->
            new AssignmentReview.History(
                rs.getLong("id"),
                rs.getInt("start_index"),
                Strategy.valueOf(rs.getString("strategy")),
                rs.getInt("assignee_count"),
                rs.getString("reason"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getBoolean("superseded")),
        dutyId);
  }

  public void apply(AssignmentChange command, List<AssignmentReview.Row> rows) {
    long audit =
        inserts.insert(
            "INSERT INTO"
                + " assignment_plan_changes(change_kind,employee_id,active_before,active_after,reason)"
                + " VALUES (?,?,?,?,?)",
            command.kind(),
            command.employeeId(),
            command.active() == null ? null : !command.active(),
            command.active(),
            command.reason().trim());
    var keys = new LinkedHashMap<String, AssignmentReview.Row>();
    for (var row : rows)
      keys.putIfAbsent(
          row.dutyId()
              + ":"
              + row.key().substring(row.key().indexOf(':') + 1, row.key().lastIndexOf(':')),
          row);
    // Clear unique employee constraints for a whole turn before swapping/reusing its slots.
    for (var row : keys.values())
      jdbc.update(
          "UPDATE duty_rotation_slots SET employee_id=NULL,retired=TRUE WHERE duty_id=? AND"
              + " rotation_key=?",
          row.dutyId(),
          rotationKey(row));
    for (var row : rows) {
      Long before = row.before() == null ? null : row.before().id(),
          after = row.after() == null ? null : row.after().id();
      if (!Objects.equals(before, after))
        inserts.insert(
            "INSERT INTO"
                + " assignment_plan_change_items(change_id,duty_id,rotation_key,slot_index,previous_employee_id,new_employee_id)"
                + " VALUES (?,?,?,?,?,?)",
            audit,
            row.dutyId(),
            rotationKey(row),
            row.slotIndex(),
            before,
            after);
      if (after == null) continue;
      var ids =
          jdbc.queryForList(
              "SELECT id FROM duty_rotation_slots WHERE duty_id=? AND rotation_key=? AND"
                  + " slot_index=?",
              Long.class,
              row.dutyId(),
              rotationKey(row),
              row.slotIndex());
      long slot;
      if (ids.isEmpty())
        slot =
            inserts.insert(
                "INSERT INTO"
                    + " duty_rotation_slots(duty_id,rotation_key,slot_index,employee_id,period_start,period_end,manual_override)"
                    + " VALUES (?,?,?,?,?,?,?)",
                row.dutyId(),
                rotationKey(row),
                row.slotIndex(),
                after,
                date(row.start()),
                date(row.end()),
                row.protectedAssignment());
      else {
        slot = ids.getFirst();
        jdbc.update(
            "UPDATE duty_rotation_slots SET"
                + " employee_id=?,period_start=?,period_end=?,retired=FALSE,manual_override=? WHERE"
                + " id=?",
            after,
            date(row.start()),
            date(row.end()),
            row.protectedAssignment(),
            slot);
      }
      if (before != null && !before.equals(after))
        inserts.insert(
            "INSERT INTO"
                + " duty_rotation_changes(rotation_slot_id,previous_employee_id,new_employee_id,reason)"
                + " VALUES (?,?,?,?)",
            slot,
            before,
            after,
            "ルール・状態変更：" + command.reason().trim());
    }
  }

  private String rotationKey(AssignmentReview.Row row) {
    return row.key().substring(row.key().indexOf(':') + 1, row.key().lastIndexOf(':'));
  }

  private java.sql.Date date(java.time.LocalDate d) {
    return d == null ? null : java.sql.Date.valueOf(d);
  }
}
