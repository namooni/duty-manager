package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.SlotHandover;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcHandoverRepository implements HandoverRepository {
  private final JdbcTemplate jdbc;

  public JdbcHandoverRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public List<SlotHandover> find(long dutyId) {
    return jdbc.query(
        "SELECT h.* FROM duty_slot_handovers h JOIN duty_rotation_slots s ON"
            + " s.id=h.rotation_slot_id WHERE s.duty_id=? AND s.retired=FALSE ORDER BY"
            + " h.effective_date,h.id",
        (rs, n) ->
            new SlotHandover(
                rs.getLong("id"),
                rs.getLong("rotation_slot_id"),
                rs.getDate("effective_date").toLocalDate(),
                rs.getLong("employee_id"),
                rs.getString("reason")),
        dutyId);
  }

  public void save(long slotId, LocalDate date, long previous, long employee, String reason) {
    var sqlDate = java.sql.Date.valueOf(date);
    if (jdbc.update(
            "UPDATE duty_slot_handovers SET employee_id=?,reason=? WHERE rotation_slot_id=? AND"
                + " effective_date=?",
            employee,
            reason,
            slotId,
            sqlDate)
        == 0)
      jdbc.update(
          "INSERT INTO duty_slot_handovers(rotation_slot_id,effective_date,employee_id,reason)"
              + " VALUES (?,?,?,?)",
          slotId,
          sqlDate,
          employee,
          reason);
    jdbc.update(
        "INSERT INTO"
            + " duty_rotation_changes(rotation_slot_id,previous_employee_id,new_employee_id,reason)"
            + " VALUES (?,?,?,?)",
        slotId,
        previous,
        employee,
        date + "からの引継ぎ：" + reason);
  }
}
