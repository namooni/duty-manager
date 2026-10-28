package com.dutymanager.controller.duty;

import com.dutymanager.dto.common.IdResponse;
import com.dutymanager.dto.duty.DutyDetailsInput;
import com.dutymanager.dto.duty.DutyInput;
import com.dutymanager.dto.duty.DutyResponse;
import com.dutymanager.dto.duty.ExclusionInput;
import com.dutymanager.dto.duty.ExclusionResponse;
import com.dutymanager.service.duty.DutyService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/duties")
public class DutyController {
  private final DutyService service;

  public DutyController(DutyService service) {
    this.service = service;
  }

  @GetMapping
  public List<DutyResponse> findAll() {
    return service.findAll().stream().map(DutyResponse::from).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse create(@Valid @RequestBody DutyInput input) {
    return new IdResponse(service.create(input.toDefinition()));
  }

  @GetMapping("/{id}")
  public DutyResponse findById(@PathVariable long id) {
    return DutyResponse.from(service.findById(id));
  }

  @PatchMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void updateDetails(@PathVariable long id, @Valid @RequestBody DutyDetailsInput input) {
    service.updateDetails(
        id, input.name(), input.description(), input.expectedName(), input.expectedDescription());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    service.delete(id);
  }

  @GetMapping("/{id}/exclusions")
  public List<ExclusionResponse> exclusions(@PathVariable long id) {
    return service.findExclusions(id).stream().map(ExclusionResponse::from).toList();
  }

  @PostMapping("/{id}/exclusions")
  @ResponseStatus(HttpStatus.CREATED)
  public void addExclusion(@PathVariable long id, @Valid @RequestBody ExclusionInput input) {
    service.addExclusion(id, input.toDefinition());
  }
}
