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
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutomaticDutyService {
  private final DutyRepository duties;
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
      ScheduleAccess access) {
    this.duties = duties;
    this.employees = employees;
    this.schedules = schedules;
    this.dutyService = dutyService;
    this.engine = engine;
    this.access = access;
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
    LocalDate previous = null;
    for (var date : d.dates()) {
      require(date != null, "未定の開催日は日付一覧に含めず、空のまま作成できます。");
      require(!date.isBefore(d.duty().anchorDate()), "開催日は担当開始日以降で指定してください。");
      require(previous == null || date.isAfter(previous), "開催日は重複させず、古い順に指定してください。");
      previous = date;
    }
  }

  @Transactional(readOnly = true)
  public RotationPreview preview(AutomaticDefinition d) {
    validate(d);
    int count =
        (d.duty().memberIds().size() + d.duty().assigneeCount() - 1) / d.duty().assigneeCount();
    count = Math.max(count, Math.max(d.dates().size(), d.previewCount()));
    var turns =
        engine.turns(
            draftDuty(d),
            d.schedule(),
            initialMeetings(d),
            employees.findAll(),
            List.of(),
            access.holidayDates(),
            d.duty().anchorDate(),
            count);
    return new RotationPreview(hash(d.toString() + turns), turns);
  }

  @Transactional
  public long activate(AutomaticDefinition d, String token) {
    var preview = preview(d);
    if (!preview.token().equals(token))
      throw new ConflictException("メンバー情報が変更されました。入力に戻って順番を確認してください。");
    require(
        preview.turns().stream().noneMatch(t -> t.warning() != null), "担当者を割り当てられません。設定を確認してください。");
    long id = dutyService.create(d.duty(), d.seed());
    schedules.saveRule(id, d.schedule());
    if (d.schedule().recurrence() == Recurrence.EXPLICIT_DATES) {
      for (var meeting : initialMeetings(d))
        schedules.saveMeeting(id, meeting.sequence(), meeting.date());
      schedules.saveMeeting(id, d.dates().size(), null);
    }
    preview.turns().forEach(t -> schedules.saveTurn(id, t));
    return id;
  }

  @Transactional(readOnly = true)
  public List<AutomaticDuty> catalog() {
    var rules = schedules.rules();
    return duties.findAll().stream()
        .filter(d -> rules.containsKey(d.id()))
        .map(d -> new AutomaticDuty(d, rules.get(d.id()), schedules.meetings(d.id())))
        .toList();
  }

  private String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
