package com.dutymanager.engine.export;

import com.dutymanager.model.export.*;
import java.io.*;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

@Component
public class ScheduleWorkbookWriter {
  public byte[] write(ScheduleExport data) {
    try (var book = new XSSFWorkbook();
        var bytes = new ByteArrayOutputStream()) {
      book.getProperties().getCoreProperties().setTitle(data.config().duty().name());
      book.getProperties().getCoreProperties().setCreator("Duty Manager");
      var layout = new ScheduleWorkbookTemplate(book);
      boolean period = data.format() == ExportFormat.PERIOD;
      var main =
          layout.sheet(
              data,
              period ? "期間別担当表" : "開催日一覧",
              period ? "期間別担当表" : "開催日一覧",
              period ? new String[] {"実施日", "担当者"} : new String[] {"回", "開催日", "曜日", "担当者", "備考"},
              period ? new int[] {34, 44} : new int[] {7, 18, 8, 32, 42});
      var rows = ScheduleExportRows.rows(data);
      int mainIndex = layout.firstData(main);
      Integer shownYear = null;
      for (int i = 0; i < rows.size(); i++) {
        var item = rows.get(i);
        if (period
            && data.from().getYear() != data.to().getYear()
            && item.from() != null
            && !Objects.equals(shownYear, item.from().getYear())) {
          shownYear = item.from().getYear();
          layout.year(main, mainIndex++, shownYear);
        }
        var row = main.createRow(mainIndex++);
        var style = layout.rowStyle(i, item.holiday(), item.undated());
        if (!period) layout.cell(row, 0, item.number(), style);
        var people = item.people().isEmpty() ? "担当者未定" : item.people();
        if (period) {
          var dates =
              item.undated()
                  ? "開催日未定"
                  : item.holiday()
                      ? "実施なし（会社休業日）"
                      : ScheduleExportRows.periodRange(item.from(), item.to());
          layout.cell(row, 0, dates, style);
          layout.cell(row, 1, people, style);
        } else {
          layout.cell(row, 1, item.undated() ? "未定" : item.from(), style);
          layout.cell(row, 2, ScheduleExportRows.weekday(item.from()), style);
          layout.cell(row, 3, people, style);
        }
        if (!period) layout.cell(row, 4, item.notes(), style);
        height(row, people, period ? "" : item.notes());
      }
      if (rows.isEmpty()) layout.empty(main);
      layout.finish(main, mainIndex - 1);
      var detail =
          layout.sheet(
              data,
              "実施日一覧",
              "実施日一覧",
              new String[] {"実施日", "曜日", "担当者", "実施状況", "備考"},
              new int[] {18, 8, 34, 22, 45});
      var individual = ScheduleExportRows.individual(data.events());
      for (int i = 0; i < individual.size(); i++) {
        var item = individual.get(i);
        var row = detail.createRow(ScheduleWorkbookTemplate.FIRST_DATA + i);
        var style = layout.rowStyle(i, item.holiday(), item.undated());
        layout.cell(row, 0, item.undated() ? "未定" : item.from(), style);
        layout.cell(row, 1, ScheduleExportRows.weekday(item.from()), style);
        layout.cell(row, 2, item.people().isEmpty() ? "担当者未定" : item.people(), style);
        layout.cell(
            row, 3, item.undated() ? "開催日未定" : item.holiday() ? "実施なし（休業日）" : "実施予定", style);
        var holidayName =
            data.holidays().stream()
                .filter(h -> Objects.equals(h.date(), item.from()))
                .map(h -> h.name())
                .findFirst()
                .orElse("");
        var source = data.events().get(i);
        var notes = new LinkedHashSet<String>();
        if (!item.notes().isEmpty()) notes.add(item.notes());
        if (!holidayName.isEmpty()) notes.add(holidayName);
        if (source.warning() != null) notes.add(source.warning());
        if (period && source.periodStart() != null)
          notes.add("交代の区切り：" + source.periodStart() + " ～ " + source.periodEnd());
        var note = String.join("\n", notes);
        layout.cell(row, 4, note, style);
        height(row, item.people(), note);
      }
      if (individual.isEmpty()) layout.empty(detail);
      layout.finish(detail, ScheduleWorkbookTemplate.HEADER + individual.size());
      book.setActiveSheet(0);
      book.write(bytes);
      return bytes.toByteArray();
    } catch (IOException e) {
      throw new IllegalStateException("Excelファイルを作成できませんでした。", e);
    }
  }

  private void height(Row row, String people, String notes) {
    int lines = Math.max(people.split("\n", -1).length, notes.split("\n", -1).length);
    row.setHeightInPoints(Math.min(320, Math.max(30, lines * 17 + 10)));
  }
}
