package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.engine.rotation.AssignmentEngine;
import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.*;
import com.dutymanager.repository.schedule.ScheduleRepository;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MeetingScheduleService {
  private final ExclusionRepository exclusions;
  private final ScheduleRepository schedules;
  private final AssignmentEngine periodEngine;
  private final Clock clock;
  private final ScheduleAccess access;

  public MeetingScheduleService(
      ExclusionRepository exclusions,
      ScheduleRepository schedules,
      AssignmentEngine periodEngine,
      Clock clock,
      ScheduleAccess access) {
    this.exclusions = exclusions;
    this.schedules = schedules;
    this.periodEngine = periodEngine;
    this.clock = clock;
    this.access = access;
  }

  @Transactional
  public void updateMeeting(long id, int sequence, LocalDate date) {
    access.lock(id);
    var d = access.duty(id);
    require(access.rule(id).recurrence() == Recurrence.EXPLICIT_DATES, "個別開催日の当番ではありません。");
    var meetings = schedules.meetings(id);
    var current =
        meetings.stream()
            .filter(m -> m.sequence() == sequence)
            .findFirst()
            .orElseThrow(() -> new NotFoundException("開催回が見つかりません。"));
    require(
        current.date() == null || !current.date().isBefore(LocalDate.now(clock)),
        "過去の開催日は変更できません。");
    require(date != null, "開催日を選択してください。");
    require(
        !date.isBefore(LocalDate.now(clock)) && !date.isBefore(d.anchorDate()),
        "開催日は今日以降かつ担当開始日以降で指定してください。");
    require(
        meetings.stream()
            .filter(m -> m.sequence() != sequence && m.date() != null)
            .allMatch(
                m -> m.sequence() < sequence ? m.date().isBefore(date) : m.date().isAfter(date)),
        "前後の開催回の順番を保つ日付を指定してください。");
    require(
        schedules.slots(id).stream()
            .filter(slot -> slot.rotationKey().equals("E:" + sequence))
            .noneMatch(
                slot ->
                    periodEngine.excluded(
                        slot.employeeId(), date, date, exclusions.findByDutyId(id))),
        "担当者の対象外期間に当たります。先に担当者を変更してください。");
    schedules.updateMeeting(id, sequence, date);
    if (sequence == meetings.size() - 1) schedules.saveMeeting(id, sequence + 1, null);
  }
}
