package com.dutymanager.controller.schedule;

import com.dutymanager.dto.schedule.AssignmentChangeInput;
import com.dutymanager.dto.schedule.AssignmentChangeResponses;
import com.dutymanager.service.schedule.AssignmentChangeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assignment-changes")
public class AssignmentChangeController {
  private final AssignmentChangeService service;

  public AssignmentChangeController(AssignmentChangeService service) {
    this.service = service;
  }

  public record Confirm(@NotNull @Valid AssignmentChangeInput input, @NotBlank String token) {}

  @GetMapping("/duties/{id}")
  public AssignmentChangeResponses.Context context(@PathVariable long id) {
    return AssignmentChangeResponses.Context.from(service.context(id));
  }

  @PostMapping("/preview")
  public AssignmentChangeResponses.Result preview(@Valid @RequestBody AssignmentChangeInput input) {
    return AssignmentChangeResponses.Result.from(service.preview(input.command()));
  }

  @PostMapping("/confirm")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void confirm(@Valid @RequestBody Confirm input) {
    service.confirm(input.input().command(), input.token());
  }
}
