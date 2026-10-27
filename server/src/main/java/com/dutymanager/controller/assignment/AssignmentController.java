package com.dutymanager.controller.assignment;

import com.dutymanager.dto.assignment.AssignmentResponse;
import com.dutymanager.dto.assignment.ChangeResponse;
import com.dutymanager.dto.assignment.ReplaceInput;
import com.dutymanager.service.assignment.AssignmentService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
  private final AssignmentService service;

  public AssignmentController(AssignmentService service) {
    this.service = service;
  }

  @GetMapping
  public List<AssignmentResponse> findAll(
      @RequestParam LocalDate from, @RequestParam LocalDate to) {
    return service.findAll(from, to).stream().map(AssignmentResponse::from).toList();
  }

  @PatchMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void replace(@PathVariable long id, @Valid @RequestBody ReplaceInput input) {
    service.replace(id, input.toDefinition());
  }

  @GetMapping("/{id}/changes")
  public List<ChangeResponse> changes(@PathVariable long id) {
    return service.findChanges(id).stream().map(ChangeResponse::from).toList();
  }
}
