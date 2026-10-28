package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.ScheduleDateReview.History;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcScheduleDateRepository implements ScheduleDateRepository {
  private final JdbcTemplate jdbc;

  public JdbcScheduleDateRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  private LocalDate local(ResultSet rs, String key) throws SQLException {
    return rs.getDate(key) == null ? null : rs.getDate(key).toLocalDate();
  }

  public List<History> history(long id) {
    return jdbc.query(
        "SELECT * FROM duty_schedule_date_changes WHERE duty_id=? ORDER BY id DESC",
        (rs, n) ->
            new History(
                rs.getLong("id"),
                rs.getString("rotation_key"),
                local(rs, "previous_start"),
                local(rs, "previous_end"),
                local(rs, "new_start"),
                local(rs, "new_end"),
                rs.getString("reason"),
                rs.getTimestamp("created_at").toInstant()),
        id);
  }

  private java.sql.Date date(LocalDate d) {
    return d == null ? null : java.sql.Date.valueOf(d);
  }

  public void updatePeriod(long id, String key, LocalDate start, LocalDate end) {
    jdbc.update(
        "UPDATE duty_rotation_slots SET period_start=?,period_end=? WHERE duty_id=? AND"
            + " rotation_key=? AND retired=FALSE",
        date(start),
        date(end),
        id,
        key);
  }

  public void record(
      long id,
      String key,
      LocalDate oldStart,
      LocalDate oldEnd,
      LocalDate start,
      LocalDate end,
      String reason) {
    jdbc.update(
        "INSERT INTO"
            + " duty_schedule_date_changes(duty_id,rotation_key,previous_start,previous_end,new_start,new_end,reason)"
            + " VALUES (?,?,?,?,?,?,?)",
        id,
        key,
        date(oldStart),
        date(oldEnd),
        date(start),
        date(end),
        reason);
  }
}
