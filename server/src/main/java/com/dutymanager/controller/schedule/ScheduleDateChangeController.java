package com.dutymanager.controller.schedule;

import com.dutymanager.dto.schedule.*;
import com.dutymanager.service.schedule.ScheduleDateChangeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/automatic-duties/{id}/date-changes")
public class ScheduleDateChangeController {
  private final ScheduleDateChangeService service;

  public ScheduleDateChangeController(ScheduleDateChangeService service) {
    this.service = service;
  }

  @GetMapping("/{key}")
  public ScheduleDateResponses.Context context(@PathVariable long id, @PathVariable String key) {
    return ScheduleDateResponses.Context.from(service.context(id, key));
  }

  @GetMapping("/{key}/history")
  public java.util.List<ScheduleDateResponses.History> history(
      @PathVariable long id, @PathVariable String key) {
    return service.history(id, key).stream().map(ScheduleDateResponses.History::from).toList();
  }

  @PostMapping("/preview")
  public ScheduleDateResponses.Result preview(
      @PathVariable long id, @Valid @RequestBody ScheduleDateChangeInput input) {
    return ScheduleDateResponses.Result.from(service.preview(id, input.command()));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void confirm(
      @PathVariable long id, @Valid @RequestBody ScheduleDateChangeInput.Confirm input) {
    service.confirm(id, input.input().command(), input.token());
  }
}
