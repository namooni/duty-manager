package com.dutymanager.dto.system;

import com.dutymanager.model.system.SystemInfo;

public record SystemResponse(String status, String today, String zone) {
  public static SystemResponse from(SystemInfo info) {
    return new SystemResponse(info.status(), info.today(), info.zone());
  }
}
