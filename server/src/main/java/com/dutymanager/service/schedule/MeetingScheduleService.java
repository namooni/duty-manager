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
  private final com.dutymanager.repository.schedule.ScheduleRangeRepository ranges;

  public MeetingScheduleService(
      ExclusionRepository exclusions,
      ScheduleRepository schedules,
      AssignmentEngine periodEngine,
      Clock clock,
      ScheduleAccess access,
      com.dutymanager.repository.schedule.ScheduleRangeRepository ranges) {
    this.exclusions = exclusions;
    this.schedules = schedules;
    this.periodEngine = periodEngine;
    this.clock = clock;
    this.access = access;
    this.ranges = ranges;
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
        current.date() == null || current.date().isAfter(LocalDate.now(clock)), "過去の開催日は変更できません。");
    require(current.date() == null, "開催日の変更は、変更内容の確認画面から適用してください。");
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
    var range = ranges.find(id).orElseThrow();
    require(
        !date.isAfter(range.plannedThrough())
            && (range.endDate() == null || !date.isAfter(range.endDate())),
        "担当者を決めた期間外です。先に担当予定を追加してください。");
    schedules.updateMeeting(id, sequence, date);
  }
}
