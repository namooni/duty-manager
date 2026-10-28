package com.dutymanager.engine.export;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.model.duty.*;
import com.dutymanager.model.export.*;
import com.dutymanager.model.schedule.*;
import java.io.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

class ScheduleWorkbookWriterTest {
  final ScheduleWorkbookWriter writer = new ScheduleWorkbookWriter();
  final LocalDate start = LocalDate.of(2026, 10, 5);

  WorkOccurrence event(int day, boolean holiday, String person) {
    return new WorkOccurrence(
        1,
        "朝会の進行",
        day,
        start.plusDays(day),
        RotationMode.CALENDAR,
        "C:0",
        start,
        start.plusDays(6),
        List.of(new WorkAssignee(1, 1, "001", person)),
        null,
        holiday,
        false,
        false);
  }

  ScheduleExport data(ExportFormat format, List<WorkOccurrence> events) {
    var duty = new Duty(1, "朝会の進行", "", start, 1, Unit.WEEK, Strategy.CUSTOM, 1, List.of(1L, 2L));
    var config =
        new AutomaticDuty(
            duty,
            new ScheduleRule(
                Recurrence.WORKDAYS, RotationMode.CALENDAR, List.of(1, 2, 3, 4, 5), 1, 1, 1, 1),
            List.of(),
            new ScheduleRange(null, start.plusDays(27)));
    return new ScheduleExport(
        config,
        start,
        start.plusDays(27),
        format,
        ZonedDateTime.of(2026, 10, 28, 12, 0, 0, 0, ZoneId.of("Asia/Tokyo")),
        events,
        List.of(new Holiday(start.plusDays(1), "会社休業日")),
        List.of());
  }

  @Test
  void periodTemplateGroupsActualWeekdaysAndHasUsablePrintAndDetailSettings() throws Exception {
    var events = new ArrayList<WorkOccurrence>();
    for (int i = 0; i < 5; i++) events.add(event(i, i == 1, "山田 太郎"));
    try (var book =
        new XSSFWorkbook(
            new ByteArrayInputStream(writer.write(data(ExportFormat.PERIOD, events))))) {
      var sheet = book.getSheetAt(0);
      assertThat(book.getNumberOfSheets()).isEqualTo(2);
      assertThat(sheet.getSheetName()).isEqualTo("期間別担当表");
      assertThat(sheet.getRow(6).getCell(0).getStringCellValue()).isEqualTo("10月5日～10月9日");
      assertThat(sheet.getRow(5).getLastCellNum()).isEqualTo((short) 2);
      assertThat(sheet.getRow(6).getCell(1).getStringCellValue()).contains("山田 太郎");
      assertThat(sheet.getRow(1).getCell(0).getStringCellValue()).isEqualTo("2026年");
      assertThat(sheet.getLastRowNum()).isEqualTo(6);
      assertThat(sheet.getPaneInformation().isFreezePane()).isTrue();
      assertThat(sheet.getRepeatingRows().getFirstRow()).isZero();
      assertThat(sheet.getPrintSetup().getLandscape()).isFalse();
      assertThat(sheet.getPrintSetup().getFitWidth()).isEqualTo((short) 1);
      assertThat(book.getPrintArea(0)).contains("$A$1:$B$7");
      var detail = book.getSheet("実施日一覧");
      assertThat(detail.getRow(10).getCell(3).getStringCellValue()).isEqualTo("実施なし（休業日）");
      assertThat(DateUtil.isCellDateFormatted(detail.getRow(9).getCell(0))).isTrue();
      assertThat(detail.getRow(9).getCell(4).getStringCellValue()).contains("2026-10-11");
      for (var row : sheet)
        for (var cell : row)
          if (cell.getCellType() == CellType.STRING)
            assertThat(cell.getStringCellValue())
                .doesNotContain("出力  ", "DUTY SCHEDULE", "実施回数", "備考", "期間別担当表");
    }
  }

  @Test
  void meetingTemplateHasNativeDatesPendingRowsAndLiteralUserText() throws Exception {
    var first = event(0, false, "=HYPERLINK(\"https://example.invalid\")");
    var pending =
        new WorkOccurrence(
            1,
            "会議",
            1,
            null,
            RotationMode.OCCURRENCE,
            "E:1",
            null,
            null,
            first.assignees(),
            null,
            false,
            false,
            false);
    try (var book =
        new XSSFWorkbook(
            new ByteArrayInputStream(
                writer.write(data(ExportFormat.MEETING, List.of(first, pending)))))) {
      var sheet = book.getSheetAt(0);
      assertThat(sheet.getSheetName()).isEqualTo("開催日一覧");
      assertThat(sheet.getRow(9).getCell(1).getLocalDateTimeCellValue().toLocalDate())
          .isEqualTo(start);
      assertThat(sheet.getRow(9).getCell(3).getCellType()).isEqualTo(CellType.STRING);
      assertThat(sheet.getRow(10).getCell(1).getStringCellValue()).isEqualTo("未定");
      assertThat(sheet.getRow(10).getCell(4).getStringCellValue()).isEqualTo("開催日未登録");
      assertThat(sheet.getRow(10).getCell(1).getCellStyle().getFillForegroundColor()).isNotNull();
    }
  }

  @Test
  void handoverSegmentsAndAllHolidayRowsAreNeverMergedOrCountedAsExecutions() {
    var old = event(0, false, "山田");
    var next =
        new WorkOccurrence(
            1,
            old.dutyName(),
            2,
            start.plusDays(2),
            old.rotationMode(),
            old.rotationKey(),
            start.plusDays(2),
            old.periodEnd(),
            List.of(new WorkAssignee(1, 2, "002", "佐藤")),
            null,
            false,
            false,
            true);
    var rows = ScheduleExportRows.rows(data(ExportFormat.PERIOD, List.of(old, next)));
    assertThat(rows).hasSize(2);
    assertThat(rows.get(1).people()).contains("佐藤");
    var holiday =
        ScheduleExportRows.rows(data(ExportFormat.PERIOD, List.of(event(0, true, "山田"))))
            .getFirst();
    assertThat(holiday.count()).isZero();
    assertThat(holiday.holiday()).isTrue();
    assertThat(holiday.from()).isNull();
  }

  @Test
  void emptyExportsStayReadable() throws Exception {
    try (var book =
        new XSSFWorkbook(
            new ByteArrayInputStream(writer.write(data(ExportFormat.PERIOD, List.of()))))) {
      assertThat(book.getSheetAt(0).getRow(6).getCell(0).getStringCellValue()).contains("予定はありません");
    }
  }

  @Test
  void generatesReviewableSamplesWithTheProductionWriter() throws Exception {
    var sample = new ArrayList<WorkOccurrence>();
    var names = List.of("山田 太郎", "佐藤 花子", "鈴木 一郎", "田中 美咲", "高橋 健");
    for (int i = 0; i < 27; i++) {
      var date = start.plusDays(i);
      if (date.getDayOfWeek().getValue() > 5) continue;
      int week = i / 7;
      int person = week == 2 && date.getDayOfWeek().getValue() >= 3 ? 3 : week == 3 ? 4 : week;
      var periodStart = start.plusDays(week * 7);
      var periodEnd = periodStart.plusDays(6);
      if (week == 2) {
        if (person == 2) periodEnd = periodStart.plusDays(1);
        else periodStart = periodStart.plusDays(2);
      }
      sample.add(
          new WorkOccurrence(
              1,
              "朝会の進行",
              i,
              date,
              RotationMode.CALENDAR,
              "C:" + week,
              periodStart,
              periodEnd,
              List.of(new WorkAssignee(week + 1, person + 1, "10" + person, names.get(person))),
              null,
              i == 7,
              false,
              week == 2));
    }
    var directory = Path.of("build", "export-samples");
    Files.createDirectories(directory);
    Files.write(
        directory.resolve("weekly-duty-sample.xlsx"),
        writer.write(data(ExportFormat.PERIOD, sample)));
    var meetings = new ArrayList<WorkOccurrence>();
    for (int i = 0; i < 12; i++) {
      var date = i >= 10 ? null : LocalDate.of(2026, 11, 20).plusMonths(i).plusDays(i % 3);
      meetings.add(
          new WorkOccurrence(
              2,
              "定例会の議事録",
              i,
              date,
              RotationMode.OCCURRENCE,
              "E:" + i,
              date,
              date,
              List.of(new WorkAssignee(i + 10, i % 5 + 1, "10" + (i % 5), names.get(i % 5))),
              null,
              false,
              false,
              false));
    }
    var original = data(ExportFormat.MEETING, meetings);
    var duty =
        new Duty(
            2,
            "定例会の議事録",
            "",
            LocalDate.of(2026, 11, 1),
            1,
            Unit.MONTH,
            Strategy.CUSTOM,
            1,
            List.of(1L, 2L, 3L, 4L, 5L));
    var config =
        new AutomaticDuty(
            duty,
            new ScheduleRule(
                Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE, List.of(), 1, 1, 1, 1),
            List.of(),
            new ScheduleRange(null, LocalDate.of(2027, 10, 31)));
    Files.write(
        directory.resolve("meeting-duty-sample.xlsx"),
        writer.write(
            new ScheduleExport(
                config,
                LocalDate.of(2026, 11, 1),
                LocalDate.of(2027, 10, 31),
                ExportFormat.MEETING,
                original.generatedAt(),
                meetings,
                List.of(),
                List.of("開催日未定の2回を含みます。対象年は未確定です。"))));
  }

  @Test
  void crossYearPeriodExportsHaveYearSectionsAndUnambiguousBoundaryDates() throws Exception {
    var events =
        List.of(
            new WorkOccurrence(
                1,
                "朝会",
                0,
                LocalDate.of(2026, 12, 28),
                RotationMode.CALENDAR,
                "C:0",
                LocalDate.of(2026, 12, 28),
                LocalDate.of(2027, 1, 3),
                List.of(new WorkAssignee(1, 1, "001", "山田")),
                null,
                false,
                false,
                false),
            new WorkOccurrence(
                1,
                "朝会",
                1,
                LocalDate.of(2027, 1, 1),
                RotationMode.CALENDAR,
                "C:0",
                LocalDate.of(2026, 12, 28),
                LocalDate.of(2027, 1, 3),
                List.of(new WorkAssignee(1, 1, "001", "山田")),
                null,
                false,
                false,
                false),
            new WorkOccurrence(
                1,
                "朝会",
                2,
                LocalDate.of(2027, 1, 4),
                RotationMode.CALENDAR,
                "C:1",
                LocalDate.of(2027, 1, 4),
                LocalDate.of(2027, 1, 10),
                List.of(new WorkAssignee(2, 2, "002", "佐藤")),
                null,
                false,
                false,
                false));
    var original = data(ExportFormat.PERIOD, events);
    var export =
        new ScheduleExport(
            original.config(),
            LocalDate.of(2026, 12, 28),
            LocalDate.of(2027, 1, 10),
            ExportFormat.PERIOD,
            original.generatedAt(),
            events,
            List.of(),
            List.of());
    try (var book = new XSSFWorkbook(new ByteArrayInputStream(writer.write(export)))) {
      var sheet = book.getSheetAt(0);
      assertThat(sheet.getRow(6).getCell(0).getStringCellValue()).isEqualTo("2026年");
      assertThat(sheet.getRow(7).getCell(0).getStringCellValue())
          .isEqualTo("2026年12月28日～2027年1月1日");
      assertThat(sheet.getRow(8).getCell(0).getStringCellValue()).isEqualTo("2027年");
      assertThat(sheet.getRow(9).getCell(0).getStringCellValue()).isEqualTo("1月4日");
    }
  }
}
