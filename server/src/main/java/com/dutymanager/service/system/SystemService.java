package com.dutymanager.service.system;

import com.dutymanager.model.system.SystemInfo;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.stereotype.Service;

@Service
public class SystemService {
  private final Clock clock;

  public SystemService(Clock clock) {
    this.clock = clock;
  }

  public SystemInfo getInfo() {
    return new SystemInfo("UP", LocalDate.now(clock).toString(), clock.getZone().toString());
  }
}
