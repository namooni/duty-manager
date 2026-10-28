package com.dutymanager.service.export;

import com.dutymanager.common.time.DateRangeValidator;
import com.dutymanager.engine.export.ScheduleWorkbookWriter;
import com.dutymanager.exception.BadRequestException;
import com.dutymanager.model.export.*;
import com.dutymanager.repository.schedule.ScheduleRepository;
import com.dutymanager.service.schedule.LiveScheduleService;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleExportService {
  private final LiveScheduleService live;
  private final ScheduleRepository schedules;
  private final ScheduleWorkbookWriter writer;
  private final Clock clock;

  public ScheduleExportService(
      LiveScheduleService live,
      ScheduleRepository schedules,
      ScheduleWorkbookWriter writer,
      Clock clock) {
    this.live = live;
    this.schedules = schedules;
    this.writer = writer;
    this.clock = clock;
  }

  @Transactional
  public byte[] export(
      long id, LocalDate from, LocalDate to, ExportFormat format, boolean undated) {
    DateRangeValidator.validate(from, to);
    var result = live.schedule(id, from, to);
    var config =
        result.duties().stream()
            .findFirst()
            .orElseThrow(() -> new BadRequestException("以前の形式の当番はExcel出力に対応していません。"));
    var notices = new ArrayList<String>();
    var range = config.range();
    var effectiveEnd =
        range.endDate() == null || to.isBefore(range.endDate()) ? to : range.endDate();
    if (range.plannedThrough().isBefore(effectiveEnd))
      notices.add("未割当の期間があります。担当予定は" + range.plannedThrough() + "までです。未割当の予定は出力しません。");
    if (from.isBefore(config.duty().anchorDate()))
      notices.add("当番開始前の期間は対象外です（開始：" + config.duty().anchorDate() + "）。");
    if (range.endDate() != null && to.isAfter(range.endDate()))
      notices.add("当番終了後の期間は対象外です（終了：" + range.endDate() + "）。");
    var events = result.occurrences().stream().filter(e -> undated || e.date() != null).toList();
    if (events.stream().anyMatch(e -> e.date() == null))
      notices.add("開催日未定の回は対象年が未確定のため、保存済みの未定回をすべて含めています。");
    return writer.write(
        new ScheduleExport(
            config,
            from,
            to,
            format,
            ZonedDateTime.now(clock).withZoneSameInstant(ZoneId.of("Asia/Tokyo")),
            events,
            schedules.holidays(),
            notices));
  }
}
