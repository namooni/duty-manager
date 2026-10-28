package com.dutymanager.repository.schedule;

import static org.assertj.core.api.Assertions.*;

import java.util.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class ScheduleRangeMigrationTest {
  @Test
  void migrationKeepsExistingAssignmentsAndUsesTheLatestStoredDate() {
    var data =
        new DriverManagerDataSource(
            "jdbc:h2:mem:migration"
                + UUID.randomUUID()
                + ";MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
            "sa",
            "");
    Flyway.configure().dataSource(data).target("4").load().migrate();
    var jdbc = new JdbcTemplate(data);
    jdbc.update("INSERT INTO employees(id,employee_number,name) VALUES (1,'OLD1','既存担当')");
    jdbc.update(
        "INSERT INTO"
            + " duties(id,name,description,anchor_date,interval_count,interval_unit,strategy,assignee_count,random_seed)"
            + " VALUES (1,'既存当番','','2026-11-01',1,'WEEK','CUSTOM',1,1234)");
    jdbc.update("INSERT INTO duty_schedules VALUES (1,'EXPLICIT_DATES','OCCURRENCE',0,1,1,1,1)");
    jdbc.update(
        "INSERT INTO"
            + " duty_rotation_slots(duty_id,rotation_key,slot_index,employee_id,period_start,period_end)"
            + " VALUES (1,'E:0',0,1,'2026-11-10','2026-11-10')");
    jdbc.update(
        "INSERT INTO duty_meetings VALUES (1,0,'2026-11-10'),(1,1,'2027-02-20'),(1,2,NULL)");
    Flyway.configure().dataSource(data).load().migrate();
    assertThat(
            jdbc.queryForObject(
                    "SELECT planned_through FROM duty_schedule_ranges WHERE duty_id=1",
                    java.sql.Date.class)
                .toLocalDate())
        .isEqualTo(java.time.LocalDate.of(2027, 2, 20));
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM duty_rotation_slots", Integer.class))
        .isEqualTo(1);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM duty_meetings", Integer.class))
        .isEqualTo(3);
  }
}
