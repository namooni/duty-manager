package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.common.crypto.ConfirmationToken;
import com.dutymanager.exception.BadRequestException;
import com.dutymanager.exception.ConflictException;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleAllocationService {
  private final ScheduleAccess access;
  private final java.time.Clock clock;
  private final ScheduleRangeRepository ranges;
  private final ScheduleRepository schedules;
  private final EmployeeRepository employees;
  private final ExclusionRepository exclusions;
  private final AssignmentProjectionService projection;
  private final AssignmentPlanRepository plans;

  public ScheduleAllocationService(
      ScheduleAccess access,
      ScheduleRangeRepository ranges,
      ScheduleRepository schedules,
      EmployeeRepository employees,
      ExclusionRepository exclusions,
      AssignmentProjectionService projection,
      AssignmentPlanRepository plans,
      java.time.Clock clock) {
    this.access = access;
    this.ranges = ranges;
    this.schedules = schedules;
    this.employees = employees;
    this.exclusions = exclusions;
    this.projection = projection;
    this.plans = plans;
    this.clock = clock;
  }

  private record Prepared(RotationPreview preview, List<Meeting> added) {}

  private Prepared prepare(long id, AllocationExtension input) {
    access.lock(id);
    var duty = access.duty(id);
    var rule = access.rule(id);
    var previous = ranges.find(id).orElseThrow();
    require(
        previous.endDate() == null || !previous.endDate().isBefore(java.time.LocalDate.now(clock)),
        "終了した当番に担当予定は追加できません。");
    require(
        input.plannedThrough() != null
            && !input.plannedThrough().isBefore(previous.plannedThrough()),
        "追加する期間は現在の担当予定の終了日以降を指定してください。");
    require(
        input.plannedThrough().isAfter(previous.plannedThrough()) || input.additionalMeetings() > 0,
        "追加する期間または開催回数を指定してください。");
    require(
        !input.plannedThrough().isAfter(previous.plannedThrough().plusYears(3)),
        "一度に追加できる期間は3年以内です。");
    require(
        previous.endDate() == null || !input.plannedThrough().isAfter(previous.endDate()),
        "当番の終了日を超える予定は追加できません。");
    require(
        input.additionalMeetings() >= 0 && input.additionalMeetings() <= 200, "追加する開催回数は0〜200回です。");
    require(
        input.additionalMeetings() == 0 || rule.recurrence() == Recurrence.EXPLICIT_DATES,
        "開催回の追加は開催日を個別に指定する当番で利用できます。");
    var meetings = new ArrayList<>(schedules.meetings(id));
    var added = new ArrayList<Meeting>();
    require(meetings.size() + input.additionalMeetings() <= 200, "開催回は合計200回まで追加できます。");
    for (int i = 0; i < input.additionalMeetings(); i++) {
      var meeting = new Meeting(meetings.size(), null);
      meetings.add(meeting);
      added.add(meeting);
    }
    var people = employees.findAll();
    var excluded = exclusions.findByDutyId(id);
    var holidays = access.holidayDates();
    var versions = plans.plans(id);
    var projected =
        projection
            .project(
                duty,
                rule,
                meetings,
                people,
                excluded,
                holidays,
                input.plannedThrough(),
                -1,
                versions)
            .turns();
    var through = input.plannedThrough();
    if (rule.rotationMode() == RotationMode.CALENDAR && !projected.isEmpty())
      through = projected.getLast().end();
    if (previous.endDate() != null && through.isAfter(previous.endDate()))
      through = previous.endDate();
    var range = new ScheduleRange(previous.endDate(), through);
    var saved = schedules.slots(id);
    var keys = new HashSet<String>();
    saved.forEach(slot -> keys.add(slot.rotationKey()));
    var turns =
        projected.stream()
            .filter(range::includes)
            .filter(turn -> !keys.contains(turn.key()))
            .map(range::trim)
            .toList();
    require(turns.size() <= 1200, "一度に追加できる担当予定は1,200回までです。");
    var token =
        ConfirmationToken.of(
            id, input, previous, range, meetings, people, excluded, holidays, versions, saved,
            turns);
    return new Prepared(new RotationPreview(token, turns, range), added);
  }

  @Transactional
  public RotationPreview preview(long id, AllocationExtension input) {
    return prepare(id, input).preview();
  }

  @Transactional
  public void confirm(long id, AllocationExtension input, String token) {
    Prepared prepared;
    try {
      prepared = prepare(id, input);
    } catch (BadRequestException cause) {
      throw new ConflictException("担当予定の状態が変わっています。追加内容を再確認してください。");
    }
    var preview = prepared.preview();
    if (!preview.token().equals(token))
      throw new ConflictException("予定やメンバーが更新されています。追加内容を再確認してください。");
    require(preview.turns().stream().noneMatch(t -> t.warning() != null), "担当できるメンバーが不足しています。");
    for (var meeting : prepared.added()) schedules.saveMeeting(id, meeting.sequence(), null);
    for (var turn : preview.turns()) schedules.saveTurn(id, turn);
    ranges.save(id, preview.range());
  }
}
