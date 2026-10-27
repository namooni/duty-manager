package com.dutymanager.repository.duty;

import com.dutymanager.common.jdbc.JdbcInsertSupport;
import com.dutymanager.model.duty.Exclusion;
import com.dutymanager.model.duty.ExclusionDefinition;
import java.sql.Date;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcExclusionRepository implements ExclusionRepository {
  private final JdbcTemplate jdbc;
  private final JdbcInsertSupport inserts;

  public JdbcExclusionRepository(JdbcTemplate jdbc, JdbcInsertSupport inserts) {
    this.jdbc = jdbc;
    this.inserts = inserts;
  }

  public List<Exclusion> findByDutyId(long id) {
    return jdbc.query(
        "SELECT * FROM exclusions WHERE duty_id=? ORDER BY start_date,id",
        (rs, n) ->
            new Exclusion(
                rs.getLong("id"),
                rs.getLong("duty_id"),
                rs.getLong("employee_id"),
                rs.getDate("start_date").toLocalDate(),
                rs.getDate("end_date").toLocalDate(),
                rs.getString("reason")),
        id);
  }

  public void save(long dutyId, ExclusionDefinition x) {
    inserts.insert(
        "INSERT INTO exclusions(duty_id,employee_id,start_date,end_date,reason) VALUES (?,?,?,?,?)",
        dutyId,
        x.employeeId(),
        Date.valueOf(x.startDate()),
        Date.valueOf(x.endDate()),
        x.reason().trim());
  }
}
