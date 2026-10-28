package com.dutymanager.common.jdbc;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class JdbcPlanningLock {
  private final JdbcTemplate jdbc;

  public JdbcPlanningLock(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void lock() {
    jdbc.queryForList("SELECT id FROM planning_mutex WHERE id=1 FOR UPDATE", Integer.class);
  }
}
