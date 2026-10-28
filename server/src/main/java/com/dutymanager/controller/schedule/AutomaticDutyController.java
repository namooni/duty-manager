package com.dutymanager.controller.schedule;

import com.dutymanager.dto.assignment.ReplaceInput;
import com.dutymanager.dto.common.IdResponse;
import com.dutymanager.dto.schedule.*;
import com.dutymanager.dto.schedule.AutomaticResponses.*;
import com.dutymanager.model.schedule.Holiday;
import com.dutymanager.service.schedule.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/automatic-duties")
public class AutomaticDutyController {
  private final AutomaticDutyService service;

  private final LiveScheduleService live;
  private final MeetingScheduleService meetings;
  private final RotationSlotService slots;
  private final CompanyCalendarService calendar;
  private final ScheduleAllocationService allocations;

  public AutomaticDutyController(
      AutomaticDutyService service,
      LiveScheduleService live,
      MeetingScheduleService meetings,
      RotationSlotService slots,
      CompanyCalendarService calendar,
      ScheduleAllocationService allocations) {
    this.service = service;
    this.live = live;
    this.meetings = meetings;
    this.slots = slots;
    this.calendar = calendar;
    this.allocations = allocations;
  }

  @PostMapping("/preview")
  public Preview preview(@Valid @RequestBody AutomaticInput input) {
    return Preview.from(service.preview(input.toDefinition()));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public IdResponse activate(@Valid @RequestBody ActivateInput input) {
    return new IdResponse(service.activate(input.draft().toDefinition(), input.token()));
  }

  @GetMapping
  public List<DutyView> catalog() {
    return service.catalog().stream().map(DutyView::from).toList();
  }

  @PostMapping("/schedule")
  public Result schedule(@Valid @RequestBody ScheduleQuery query) {
    return Result.from(live.schedule(query.from(), query.to()));
  }

  @PostMapping("/{id}/schedule")
  public Result dutySchedule(@PathVariable long id, @Valid @RequestBody ScheduleQuery query) {
    return Result.from(live.schedule(id, query.from(), query.to()));
  }

  @PutMapping("/{id}/meetings/{sequence}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void meeting(
      @PathVariable long id, @PathVariable int sequence, @RequestBody MeetingInput input) {
    meetings.updateMeeting(id, sequence, input.date());
  }

  @PatchMapping("/slots/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void replace(@PathVariable long id, @Valid @RequestBody ReplaceInput input) {
    slots.replace(id, input.employeeId(), input.reason(), input.from());
  }

  @PostMapping("/{id}/allocations/preview")
  public Preview allocationPreview(
      @PathVariable long id, @Valid @RequestBody AllocationExtensionInput input) {
    return Preview.from(allocations.preview(id, input.command()));
  }

  @PostMapping("/{id}/allocations")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void allocate(
      @PathVariable long id, @Valid @RequestBody AllocationExtensionInput.Confirm input) {
    allocations.confirm(id, input.input().command(), input.token());
  }

  @GetMapping("/slots/{id}/choices")
  public List<com.dutymanager.dto.employee.EmployeeResponse> choices(
      @PathVariable long id, @RequestParam(required = false) LocalDate from) {
    return slots.choices(id, from).stream()
        .map(com.dutymanager.dto.employee.EmployeeResponse::from)
        .toList();
  }

  @GetMapping("/slots/{id}/changes")
  public List<Change> changes(@PathVariable long id) {
    return slots.changes(id).stream().map(Change::from).toList();
  }

  @GetMapping("/holidays")
  public List<HolidayView> holidays() {
    return calendar.holidays().stream().map(HolidayView::from).toList();
  }

  @PutMapping("/holidays")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void holiday(@Valid @RequestBody HolidayInput input) {
    calendar.saveHoliday(new Holiday(input.date(), input.name()));
  }

  @DeleteMapping("/holidays/{date}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeHoliday(@PathVariable LocalDate date) {
    calendar.deleteHoliday(date);
  }
}
