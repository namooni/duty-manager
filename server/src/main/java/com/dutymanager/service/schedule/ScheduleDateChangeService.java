package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.common.crypto.ConfirmationToken;
import com.dutymanager.engine.rotation.AssignmentEngine;
import com.dutymanager.exception.*;
import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.schedule.*;
import com.dutymanager.model.schedule.ScheduleDateReview.*;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.*;
import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleDateChangeService {
  private final ScheduleAccess access;
  private final ScheduleRepository schedules;
  private final ScheduleRangeRepository ranges;
  private final ScheduleDateRepository dates;
  private final EmployeeRepository employees;
  private final ExclusionRepository exclusions;
  private final AssignmentEngine periods;
  private final Clock clock;

  public ScheduleDateChangeService(
      ScheduleAccess access,
      ScheduleRepository schedules,
      ScheduleRangeRepository ranges,
      ScheduleDateRepository dates,
      EmployeeRepository employees,
      ExclusionRepository exclusions,
      AssignmentEngine periods,
      Clock clock) {
    this.access = access;
    this.schedules = schedules;
    this.ranges = ranges;
    this.dates = dates;
    this.employees = employees;
    this.exclusions = exclusions;
    this.periods = periods;
    this.clock = clock;
  }

  private record Target(
      Duty duty,
      ScheduleRule rule,
      ScheduleRange range,
      List<RotationSlot> slots,
      List<Employee> people,
      Context context) {}

  private int sequence(String key) {
    require(key != null && key.matches("[CE]:[0-9]{1,5}"), "担当期間・開催回を確認してください。");
    return Integer.parseInt(key.substring(2));
  }

  private Period group(String key, List<RotationSlot> all, List<Employee> people) {
    var slots =
        all.stream()
            .filter(s -> s.rotationKey().equals(key))
            .sorted(Comparator.comparingInt(RotationSlot::slotIndex))
            .toList();
    if (slots.isEmpty()) throw new NotFoundException("保存済みの担当予定が見つかりません。");
    var first = slots.getFirst();
    require(
        slots.stream()
            .allMatch(
                s ->
                    Objects.equals(s.periodStart(), first.periodStart())
                        && Objects.equals(s.periodEnd(), first.periodEnd())),
        "担当期間が一致しません。管理者に確認してください。");
    return new Period(
        key,
        first.periodStart(),
        first.periodEnd(),
        slots.stream()
            .map(
                slot ->
                    people.stream()
                        .filter(e -> e.id() == slot.employeeId())
                        .findFirst()
                        .orElseThrow())
            .toList());
  }

  private Target target(long id, String key) {
    access.lock(id);
    int seq = sequence(key);
    var duty = access.duty(id);
    var rule = access.rule(id);
    require(rule.rotationMode() == RotationMode.OCCURRENCE, "担当期間の日付変更には対応していません。担当者の変更をご利用ください。");
    require(key.startsWith("E:"), "担当形式が一致しません。");
    var range = ranges.find(id).orElseThrow();
    var all = schedules.slots(id);
    var people = employees.findAll();
    var selected = group(key, all, people);
    var today = LocalDate.now(clock);
    require(selected.start() == null || selected.start().isAfter(today), "過去・進行中の担当予定の日付は変更できません。");
    require(range.endDate() == null || !range.endDate().isBefore(today), "終了した当番は変更できません。");
    LocalDate min = today.plusDays(selected.start() == null ? 0 : 1), max = range.plannedThrough();
    if (duty.anchorDate().isAfter(min)) min = duty.anchorDate();
    for (var slot : all) {
      if (slot.periodStart() == null) continue;
      int other = sequence(slot.rotationKey());
      if (other < seq && slot.periodStart().plusDays(1).isAfter(min))
        min = slot.periodStart().plusDays(1);
      if (other > seq && slot.periodStart().minusDays(1).isBefore(max))
        max = slot.periodStart().minusDays(1);
    }
    if (range.endDate() != null && max.isAfter(range.endDate())) max = range.endDate();
    require(!min.isAfter(max), "変更できる日付がありません。");
    var affected = List.of(selected);
    var history =
        dates.history(id).stream()
            .filter(h -> affected.stream().anyMatch(a -> a.rotationKey().equals(h.rotationKey())))
            .limit(20)
            .toList();
    var context =
        new Context(
            duty.name(),
            rule.rotationMode(),
            min,
            max,
            selected.start(),
            List.copyOf(affected),
            history);
    return new Target(duty, rule, range, all, people, context);
  }

  @Transactional(readOnly = true)
  public List<History> history(long id, String key) {
    sequence(key);
    access.duty(id);
    return dates.history(id).stream().filter(h -> h.rotationKey().equals(key)).toList();
  }

  @Transactional
  public Context context(long id, String key) {
    return target(id, key).context();
  }

  private Result prepare(long id, ScheduleDateChange input) {
    var t = target(id, input.rotationKey());
    require(input.date() != null, "変更後の日付を指定してください。");
    require(
        input.reason() != null && !input.reason().isBlank() && input.reason().length() <= 300,
        "変更理由を300文字以内で入力してください。");
    var context = t.context();
    require(
        !input.date().isBefore(context.minimum()) && !input.date().isAfter(context.maximum()),
        "前後の開催順と、担当予定の範囲内の日付を指定してください。");
    require(!Objects.equals(input.date(), context.currentDate()), "現在と異なる日付を指定してください。");
    var rows = new ArrayList<Row>();
    for (int i = 0; i < context.periods().size(); i++) {
      var before = context.periods().get(i);
      var after = new Period(before.rotationKey(), input.date(), input.date(), before.assignees());
      for (var person : after.assignees())
        require(
            !periods.excluded(person.id(), after.start(), after.end(), exclusions.findByDutyId(id)),
            person.name() + "の対象外期間に当たります。先に担当者を変更してください。");
      rows.add(new Row(before, after));
    }
    var warnings = new ArrayList<String>();
    if (t.rule().rotationMode() == RotationMode.OCCURRENCE
        && access.holidayDates().contains(input.date()))
      warnings.add("変更後の開催日は会社休業日です。実施なしとして表示されます。");
    String token =
        ConfirmationToken.of(
            id,
            input,
            t.duty(),
            t.rule(),
            t.range(),
            t.slots(),
            t.people(),
            dates.history(id),
            exclusions.findByDutyId(id),
            access.holidayDates(),
            rows);
    return new Result(token, List.copyOf(rows), List.copyOf(warnings));
  }

  @Transactional
  public Result preview(long id, ScheduleDateChange input) {
    return prepare(id, input);
  }

  @Transactional
  public void confirm(long id, ScheduleDateChange input, String token) {
    Result result;
    try {
      result = prepare(id, input);
    } catch (BadRequestException cause) {
      throw new ConflictException("担当予定の状態が変わっています。変更内容を再確認してください。");
    }
    if (!result.token().equals(token))
      throw new ConflictException("予定や担当者が更新されています。変更内容を再確認してください。");
    var rule = access.rule(id);
    for (var row : result.rows()) {
      var before = row.before();
      var after = row.after();
      if (rule.recurrence() == Recurrence.EXPLICIT_DATES)
        schedules.updateMeeting(id, sequence(after.rotationKey()), after.start());
      else dates.updatePeriod(id, after.rotationKey(), after.start(), after.end());
      dates.record(
          id,
          after.rotationKey(),
          before.start(),
          before.end(),
          after.start(),
          after.end(),
          input.reason().trim());
    }
  }
}
