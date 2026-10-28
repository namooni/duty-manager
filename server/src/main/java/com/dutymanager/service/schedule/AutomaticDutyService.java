package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.engine.schedule.AutomaticEngine;
import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.*;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.ScheduleRepository;
import com.dutymanager.service.duty.DutyService;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutomaticDutyService {
  private final DutyRepository duties;
  private final AssignmentProjectionService assignmentProjection;
  private final Clock clock;
  private final com.dutymanager.repository.schedule.ScheduleRangeRepository ranges;
  private final EmployeeRepository employees;
  private final ScheduleRepository schedules;
  private final DutyService dutyService;
  private final AutomaticEngine engine;
  private final ScheduleAccess access;

  public AutomaticDutyService(
      DutyRepository duties,
      EmployeeRepository employees,
      ScheduleRepository schedules,
      DutyService dutyService,
      AutomaticEngine engine,
      ScheduleAccess access,
      AssignmentProjectionService assignmentProjection,
      Clock clock,
      com.dutymanager.repository.schedule.ScheduleRangeRepository ranges) {
    this.duties = duties;
    this.employees = employees;
    this.schedules = schedules;
    this.dutyService = dutyService;
    this.engine = engine;
    this.access = access;
    this.assignmentProjection = assignmentProjection;
    this.clock = clock;
    this.ranges = ranges;
  }

  private Duty draftDuty(AutomaticDefinition d) {
    var v = d.duty();
    return new Duty(
        0,
        v.name(),
        v.description(),
        v.anchorDate(),
        v.intervalCount(),
        v.intervalUnit(),
        v.strategy(),
        v.assigneeCount(),
        v.memberIds(),
        d.seed());
  }

  private List<Meeting> initialMeetings(AutomaticDefinition d) {
    var result = new ArrayList<Meeting>();
    for (int i = 0; i < d.dates().size(); i++) result.add(new Meeting(i, d.dates().get(i)));
    return result;
  }

  private void validate(AutomaticDefinition d) {
    dutyService.validateDefinition(d.duty());
    require(
        d.schedule().recurrence() != Recurrence.WEEKLY || !d.schedule().weekdays().isEmpty(),
        "実施する曜日を1つ以上選択してください。");
    require(
        new HashSet<>(d.schedule().weekdays()).size() == d.schedule().weekdays().size(),
        "曜日が重複しています。");
    require(
        d.schedule().recurrence() != Recurrence.EXPLICIT_DATES
            || d.schedule().rotationMode() == RotationMode.OCCURRENCE,
        "開催日を個別に指定する場合は、1回ごとに担当者を交代してください。");
    require(
        d.schedule().recurrence() == Recurrence.EXPLICIT_DATES || d.dates().isEmpty(),
        "個別開催日以外に日付一覧は指定できません。");
    require(
        d.endDate() == null || !d.endDate().isBefore(d.duty().anchorDate()), "終了日は開始日以降を指定してください。");
    require(
        d.plannedThrough() == null || !d.plannedThrough().isBefore(d.duty().anchorDate()),
        "担当者を決める期間は開始日以降を指定してください。");
    require(
        d.plannedThrough() == null
            || !d.plannedThrough().isAfter(d.duty().anchorDate().plusYears(3)),
        "一度に作成できる担当予定は開始日から3年以内です。");
    require(
        d.endDate() == null
            || d.plannedThrough() == null
            || !d.plannedThrough().isAfter(d.endDate()),
        "担当者を決める期間は当番の終了日までにしてください。");
    LocalDate previous = null;
    for (var date : d.dates()) {
      if (date == null) continue;
      require(!date.isBefore(d.duty().anchorDate()), "開催日は担当開始日以降で指定してください。");
      require(previous == null || date.isAfter(previous), "開催日は重複させず、古い順に指定してください。");
      require(
          d.plannedThrough() == null || !date.isAfter(d.plannedThrough()),
          "開催日は担当者を決める期間内で指定してください。");
      previous = date;
    }
  }

  @Transactional(readOnly = true)
  public RotationPreview preview(AutomaticDefinition d) {
    validate(d);
    int count =
        d.plannedThrough() != null
            ? (d.schedule().recurrence() == Recurrence.EXPLICIT_DATES
                ? Math.max(1, d.dates().size())
                : 0)
            : Math.max(
                (d.duty().memberIds().size() + d.duty().assigneeCount() - 1)
                    / d.duty().assigneeCount(),
                Math.max(d.dates().size(), d.previewCount()));
    LocalDate through =
        d.plannedThrough() == null ? d.duty().anchorDate().plusYears(1) : d.plannedThrough();
    var raw =
        engine.turns(
            draftDuty(d),
            d.schedule(),
            initialMeetings(d),
            employees.findAll(),
            List.of(),
            access.holidayDates(),
            through,
            count);
    if (d.endDate() != null)
      raw = raw.stream().filter(t -> t.start() == null || !t.start().isAfter(d.endDate())).toList();
    if (d.schedule().rotationMode() == RotationMode.CALENDAR && !raw.isEmpty())
      through = raw.getLast().end();
    if (d.endDate() != null && through.isAfter(d.endDate())) through = d.endDate();
    if (d.plannedThrough() == null && d.schedule().rotationMode() == RotationMode.OCCURRENCE)
      through =
          raw.stream()
              .map(RotationTurn::end)
              .filter(Objects::nonNull)
              .max(LocalDate::compareTo)
              .orElse(through);
    var range = new ScheduleRange(d.endDate(), through);
    var turns = raw.stream().map(range::trim).toList();
    require(turns.size() <= 1200, "一度に作成できる担当予定は1,200回までです。期間を短くしてください。");
    return new RotationPreview(hash(d.toString() + turns + range), turns, range);
  }

  @Transactional
  public long activate(AutomaticDefinition d, String token) {
    duties.lockPlanning();
    var preview = preview(d);
    if (!preview.token().equals(token))
      throw new ConflictException("メンバー情報が変更されました。入力に戻って順番を確認してください。");
    require(
        preview.turns().stream().noneMatch(t -> t.warning() != null), "担当者を割り当てられません。設定を確認してください。");
    long id = dutyService.create(d.duty(), d.seed());
    schedules.saveRule(id, d.schedule());
    ranges.save(id, preview.range());
    if (d.schedule().recurrence() == Recurrence.EXPLICIT_DATES) {
      for (var meeting : initialMeetings(d))
        schedules.saveMeeting(id, meeting.sequence(), meeting.date());
      for (var turn : preview.turns())
        if (turn.sequence() >= d.dates().size()) schedules.saveMeeting(id, turn.sequence(), null);
    }
    preview.turns().forEach(t -> schedules.saveTurn(id, t));
    return id;
  }

  @Transactional(readOnly = true)
  public List<AutomaticDuty> catalog() {
    var rules = schedules.rules();
    return duties.findAll().stream()
        .filter(d -> rules.containsKey(d.id()))
        .map(
            d ->
                new AutomaticDuty(
                    assignmentProjection.current(
                        d, rules.get(d.id()), schedules.meetings(d.id()), LocalDate.now(clock)),
                    rules.get(d.id()),
                    schedules.meetings(d.id()),
                    ranges.find(d.id()).orElse(null)))
        .toList();
  }

  private String hash(String value) {
    return com.dutymanager.common.crypto.ConfirmationToken.of(value);
  }
}
