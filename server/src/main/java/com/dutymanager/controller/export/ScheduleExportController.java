package com.dutymanager.controller.export;

import com.dutymanager.dto.export.ScheduleExportInput;
import com.dutymanager.service.export.ScheduleExportService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/automatic-duties/{id}/export")
public class ScheduleExportController {
  private final ScheduleExportService service;

  public ScheduleExportController(ScheduleExportService service) {
    this.service = service;
  }

  @PostMapping
  public ResponseEntity<byte[]> export(
      @PathVariable long id, @Valid @RequestBody ScheduleExportInput input) {
    var bytes =
        service.export(id, input.from(), input.to(), input.format(), input.includeUndated());
    return ResponseEntity.ok()
        .contentType(
            MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment()
                .filename(
                    "duty-"
                        + id
                        + "_"
                        + input.format().name().toLowerCase()
                        + "_"
                        + input.from()
                        + "_"
                        + input.to()
                        + ".xlsx")
                .build()
                .toString())
        .cacheControl(CacheControl.noStore())
        .body(bytes);
  }
}
