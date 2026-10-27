package com.dutymanager.controller.planning;

import com.dutymanager.dto.common.IdResponse;
import com.dutymanager.dto.planning.ConfirmInput;
import com.dutymanager.dto.planning.CreateConfirmedInput;
import com.dutymanager.dto.planning.DraftInput;
import com.dutymanager.dto.planning.PreviewResponse;
import com.dutymanager.service.planning.PlanningService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/duties")
public class PlanningController {
  private final PlanningService service;

  public PlanningController(PlanningService service) {
    this.service = service;
  }

  @PostMapping("/preview")
  public PreviewResponse previewDraft(@Valid @RequestBody DraftInput input) {
    return PreviewResponse.from(
        service.previewDraft(input.duty().toDefinition(), input.from(), input.to(), input.seed()));
  }

  @PostMapping("/create-confirmed")
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse createConfirmed(@Valid @RequestBody CreateConfirmedInput input) {
    var draft = input.draft();
    return new IdResponse(
        service.createConfirmed(
            draft.duty().toDefinition(), draft.from(), draft.to(), draft.seed(), input.token()));
  }

  @GetMapping("/{id}/preview")
  public PreviewResponse preview(
      @PathVariable long id, @RequestParam LocalDate from, @RequestParam LocalDate to) {
    return PreviewResponse.from(service.preview(id, from, to));
  }

  @PostMapping("/{id}/confirm")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void confirm(@PathVariable long id, @Valid @RequestBody ConfirmInput input) {
    service.confirm(id, input.from(), input.to(), input.token());
  }
}
