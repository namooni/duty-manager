package com.dutymanager.controller.employee;

import com.dutymanager.dto.common.IdResponse;
import com.dutymanager.dto.employee.ActiveInput;
import com.dutymanager.dto.employee.EmployeeInput;
import com.dutymanager.dto.employee.EmployeeResponse;
import com.dutymanager.service.employee.EmployeeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
  private final EmployeeService service;

  public EmployeeController(EmployeeService service) {
    this.service = service;
  }

  @GetMapping
  public List<EmployeeResponse> findAll() {
    return service.findAll().stream().map(EmployeeResponse::from).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse create(@Valid @RequestBody EmployeeInput input) {
    return new IdResponse(service.create(input.toDefinition()));
  }

  @PatchMapping("/{id}/active")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void updateActive(@PathVariable long id, @RequestBody ActiveInput input) {
    service.updateActive(id, input.active());
  }
}
