package com.dutymanager.engine.export;

import com.dutymanager.model.export.*;
import com.dutymanager.model.schedule.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

public final class ScheduleExportRows {
  private ScheduleExportRows() {}

  public record Row(
      int number,
      LocalDate from,
      LocalDate to,
      String people,
      int count,
      String notes,
      boolean holiday,
      boolean undated) {}

  private record Key(String rotation, LocalDate start, LocalDate end, List<WorkAssignee> people) {}

  public static String people(WorkOccurrence e) {
    return e.assignees().stream()
        .map(p -> p.name() + "（" + p.employeeNumber() + "）")
        .collect(Collectors.joining("\n"));
  }

  public static List<Row> rows(ScheduleExport data) {
    if (data.format() == ExportFormat.MEETING) return individual(data.events());
    var groups = new LinkedHashMap<Object, List<WorkOccurrence>>();
    for (var e : data.events()) {
      Object key =
          e.rotationMode() == RotationMode.CALENDAR
              ? new Key(e.rotationKey(), e.periodStart(), e.periodEnd(), e.assignees())
              : "E:" + e.sequence();
      groups.computeIfAbsent(key, k -> new ArrayList<>()).add(e);
    }
    var rows = new ArrayList<Row>();
    for (var group : groups.values()) {
      var dates =
          group.stream()
              .filter(e -> e.date() != null && !e.holiday())
              .map(WorkOccurrence::date)
              .sorted()
              .toList();
      var notes = new LinkedHashSet<String>();
      for (var e : group) {
        if (e.warning() != null) notes.add(e.warning());
        if (e.holiday()) {
          var name =
              data.holidays().stream()
                  .filter(h -> h.date().equals(e.date()))
                  .map(Holiday::name)
                  .findFirst()
                  .orElse("会社休業日");
          notes.add("休業：" + e.date() + "（" + name + "）");
        }
      }
      var first = group.getFirst();
      if (first.rotationMode() == RotationMode.CALENDAR)
        notes.add("交代の区切り：" + first.periodStart() + " ～ " + first.periodEnd());
      boolean undated = group.stream().allMatch(e -> e.date() == null);
      rows.add(
          new Row(
              first.rotationMode() == RotationMode.OCCURRENCE
                  ? first.sequence() + 1
                  : rows.size() + 1,
              dates.isEmpty() ? null : dates.getFirst(),
              dates.isEmpty() ? null : dates.getLast(),
              people(first),
              dates.size(),
              String.join("\n", notes),
              !undated && dates.isEmpty(),
              undated));
    }
    return List.copyOf(rows);
  }

  public static List<Row> individual(List<WorkOccurrence> events) {
    return events.stream()
        .map(
            e ->
                new Row(
                    e.sequence() + 1,
                    e.date(),
                    e.date(),
                    people(e),
                    e.holiday() ? 0 : 1,
                    e.date() == null
                        ? "開催日未登録"
                        : e.holiday() ? "会社休業日・実施なし" : Objects.toString(e.warning(), ""),
                    e.holiday(),
                    e.date() == null))
        .toList();
  }

  public static String periodRange(LocalDate from, LocalDate to) {
    if (from == null) return "開催日未定";
    var format = DateTimeFormatter.ofPattern(from.getYear() == to.getYear() ? "M月d日" : "yyyy年M月d日");
    return from.format(format) + (from.equals(to) ? "" : "～" + to.format(format));
  }

  public static String date(LocalDate date) {
    return date == null ? "未定" : date.format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
  }

  public static String weekday(LocalDate date) {
    return date == null
        ? "—"
        : List.of("月", "火", "水", "木", "金", "土", "日").get(date.getDayOfWeek().getValue() - 1);
  }

  public static String rule(ScheduleRule r) {
    return switch (r.recurrence()) {
      case WORKDAYS -> "会社の勤務日（月～金・会社休業日を除く）";
      case WEEKLY ->
          "毎週 "
              + r.weekdays().stream()
                  .map(i -> List.of("月", "火", "水", "木", "金", "土", "日").get(i - 1))
                  .collect(Collectors.joining("・"))
              + "曜日";
      case DAILY_INTERVAL -> r.everyDays() + "日おき";
      case MONTHLY_DAY -> r.monthDay() == 0 ? "毎月末日" : "毎月" + r.monthDay() + "日";
      case MONTHLY_NTH_WEEKDAY ->
          "毎月"
              + (r.monthOrdinal() == 0 ? "最終" : "第" + r.monthOrdinal())
              + List.of("月", "火", "水", "木", "金", "土", "日").get(r.weekday() - 1)
              + "曜日";
      case EXPLICIT_DATES -> "開催日を回ごとに指定";
    };
  }
}
