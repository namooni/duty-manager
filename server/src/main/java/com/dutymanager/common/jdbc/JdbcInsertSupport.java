package com.dutymanager.common.jdbc;

import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Component;

@Component
public class JdbcInsertSupport {
  private final JdbcTemplate jdbc;

  public JdbcInsertSupport(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public long insert(String sql, Object... args) {
    var holder = new GeneratedKeyHolder();
    jdbc.update(
        connection -> {
          var statement = connection.prepareStatement(sql, new String[] {"id"});
          for (int i = 0; i < args.length; i++) statement.setObject(i + 1, args[i]);
          return statement;
        },
        holder);
    return Objects.requireNonNull(holder.getKey()).longValue();
  }
}
