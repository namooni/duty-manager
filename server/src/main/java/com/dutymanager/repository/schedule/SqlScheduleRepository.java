package com.dutymanager.repository.schedule;

import com.dutymanager.common.jdbc.JdbcInsertSupport;
import com.dutymanager.mapper.schedule.ScheduleMapper;
import com.dutymanager.model.schedule.*;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SqlScheduleRepository implements ScheduleRepository {
  private final JdbcTemplate jdbc;
  private final JdbcInsertSupport inserts;
  private final ScheduleMapper mapper;

  public SqlScheduleRepository(
      JdbcTemplate jdbc, JdbcInsertSupport inserts, ScheduleMapper mapper) {
    this.jdbc = jdbc;
    this.inserts = inserts;
    this.mapper = mapper;
  }

  public Map<Long, ScheduleRule> rules() {
    var result = new LinkedHashMap<Long, ScheduleRule>();
    jdbc.query(
        "SELECT * FROM duty_schedules ORDER BY duty_id",
        (org.springframework.jdbc.core.RowCallbackHandler)
            rs -> {
              var weekdays = new ArrayList<Integer>();
              int mask = rs.getInt("weekdays_mask");
              for (int day = 1; day <= 7; day++) if ((mask & (1 << day)) != 0) weekdays.add(day);
              result.put(
                  rs.getLong("duty_id"),
                  new ScheduleRule(
                      Recurrence.valueOf(rs.getString("recurrence")),
                      RotationMode.valueOf(rs.getString("rotation_mode")),
                      weekdays,
                      rs.getInt("every_days"),
                      rs.getInt("month_day"),
                      rs.getInt("month_ordinal"),
                      rs.getInt("weekday")));
            });
    return result;
  }

  public void saveRule(long id, ScheduleRule rule) {
    int mask = rule.weekdays().stream().reduce(0, (value, day) -> value | (1 << day));
    jdbc.update(
        "INSERT INTO"
            + " duty_schedules(duty_id,recurrence,rotation_mode,weekdays_mask,every_days,month_day,month_ordinal,weekday)"
            + " VALUES (?,?,?,?,?,?,?,?)",
        id,
        rule.recurrence().name(),
        rule.rotationMode().name(),
        mask,
        rule.everyDays(),
        rule.monthDay(),
        rule.monthOrdinal(),
        rule.weekday());
  }

  public List<Meeting> meetings(long id) {
    return jdbc.query(
        "SELECT sequence_index,scheduled_date FROM duty_meetings WHERE duty_id=? ORDER BY"
            + " sequence_index",
        (rs, n) ->
            new Meeting(rs.getInt(1), rs.getDate(2) == null ? null : rs.getDate(2).toLocalDate()),
        id);
  }

  public void saveMeeting(long id, int sequence, LocalDate date) {
    jdbc.update(
        "INSERT INTO duty_meetings(duty_id,sequence_index,scheduled_date) VALUES (?,?,?)",
        id,
        sequence,
        date == null ? null : java.sql.Date.valueOf(date));
  }

  public void updateMeeting(long id, int sequence, LocalDate date) {
    jdbc.update(
        "UPDATE duty_meetings SET scheduled_date=? WHERE duty_id=? AND sequence_index=?",
        date == null ? null : java.sql.Date.valueOf(date),
        id,
        sequence);
    jdbc.update(
        "UPDATE duty_rotation_slots SET period_start=?,period_end=? WHERE duty_id=? AND"
            + " rotation_key=?",
        date == null ? null : java.sql.Date.valueOf(date),
        date == null ? null : java.sql.Date.valueOf(date),
        id,
        "E:" + sequence);
  }

  private RotationSlot map(ResultSet rs, int row) throws SQLException {
    return new RotationSlot(
        rs.getLong("id"),
        rs.getLong("duty_id"),
        rs.getString("rotation_key"),
        rs.getInt("slot_index"),
        rs.getLong("employee_id"),
        rs.getDate("period_start") == null ? null : rs.getDate("period_start").toLocalDate(),
        rs.getDate("period_end") == null ? null : rs.getDate("period_end").toLocalDate());
  }

  public List<RotationSlot> slots(long id) {
    return jdbc.query(
        "SELECT * FROM duty_rotation_slots WHERE duty_id=? ORDER BY id", this::map, id);
  }

  public Optional<RotationSlot> slot(long id) {
    return jdbc.query("SELECT * FROM duty_rotation_slots WHERE id=?", this::map, id).stream()
        .findFirst();
  }

  public void saveTurn(long id, RotationTurn turn) {
    for (int index = 0; index < turn.assignees().size(); index++)
      jdbc.update(
          "INSERT INTO"
              + " duty_rotation_slots(duty_id,rotation_key,slot_index,employee_id,period_start,period_end)"
              + " VALUES (?,?,?,?,?,?)",
          id,
          turn.key(),
          index,
          turn.assignees().get(index).id(),
          turn.start() == null ? null : java.sql.Date.valueOf(turn.start()),
          turn.end() == null ? null : java.sql.Date.valueOf(turn.end()));
  }

  public void replace(RotationSlot slot, long employeeId, String reason) {
    inserts.insert(
        "INSERT INTO"
            + " duty_rotation_changes(rotation_slot_id,previous_employee_id,new_employee_id,reason)"
            + " VALUES (?,?,?,?)",
        slot.id(),
        slot.employeeId(),
        employeeId,
        reason);
    jdbc.update("UPDATE duty_rotation_slots SET employee_id=? WHERE id=?", employeeId, slot.id());
  }

  public List<RotationChange> changes(long id) {
    return mapper.changes(id);
  }

  public List<Holiday> holidays() {
    return jdbc.query(
        "SELECT holiday_date,name FROM company_holidays ORDER BY holiday_date",
        (rs, n) -> new Holiday(rs.getDate(1).toLocalDate(), rs.getString(2)));
  }

  public void saveHoliday(Holiday h) {
    if (jdbc.update(
            "UPDATE company_holidays SET name=? WHERE holiday_date=?",
            h.name(),
            java.sql.Date.valueOf(h.date()))
        == 0)
      jdbc.update(
          "INSERT INTO company_holidays(holiday_date,name) VALUES (?,?)",
          java.sql.Date.valueOf(h.date()),
          h.name());
  }

  public void deleteHoliday(LocalDate date) {
    jdbc.update("DELETE FROM company_holidays WHERE holiday_date=?", java.sql.Date.valueOf(date));
  }
}
