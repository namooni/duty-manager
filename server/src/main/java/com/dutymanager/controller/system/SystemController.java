package com.dutymanager.controller.system;

import com.dutymanager.dto.system.SystemResponse;
import com.dutymanager.service.system.SystemService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SystemController {
  private final SystemService service;

  public SystemController(SystemService service) {
    this.service = service;
  }

  @GetMapping("/health")
  public SystemResponse health() {
    return SystemResponse.from(service.getInfo());
  }
}
