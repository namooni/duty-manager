package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.ScheduleRange;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcScheduleRangeRepository implements ScheduleRangeRepository {
  private final JdbcTemplate jdbc;

  public JdbcScheduleRangeRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Optional<ScheduleRange> find(long id) {
    return jdbc
        .query(
            "SELECT end_date,planned_through FROM duty_schedule_ranges WHERE duty_id=?",
            (rs, n) ->
                new ScheduleRange(
                    rs.getDate(1) == null ? null : rs.getDate(1).toLocalDate(),
                    rs.getDate(2).toLocalDate()),
            id)
        .stream()
        .findFirst();
  }

  public void save(long id, ScheduleRange range) {
    if (jdbc.update(
            "UPDATE duty_schedule_ranges SET end_date=?,planned_through=? WHERE duty_id=?",
            date(range.endDate()),
            date(range.plannedThrough()),
            id)
        == 0)
      jdbc.update(
          "INSERT INTO duty_schedule_ranges(duty_id,end_date,planned_through) VALUES (?,?,?)",
          id,
          date(range.endDate()),
          date(range.plannedThrough()));
  }

  private java.sql.Date date(java.time.LocalDate d) {
    return d == null ? null : java.sql.Date.valueOf(d);
  }
}
