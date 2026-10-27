package com.dutymanager.dto.schedule;

import com.dutymanager.dto.duty.DutyResponse;
import com.dutymanager.dto.employee.EmployeeResponse;
import com.dutymanager.model.schedule.*;
import java.time.LocalDate;
import java.util.List;

public final class AutomaticResponses {
  private AutomaticResponses() {}

  public record Rule(
      Recurrence recurrence,
      RotationMode rotationMode,
      List<Integer> weekdays,
      int everyDays,
      int monthDay,
      int monthOrdinal,
      int weekday) {
    static Rule from(ScheduleRule r) {
      return new Rule(
          r.recurrence(),
          r.rotationMode(),
          r.weekdays(),
          r.everyDays(),
          r.monthDay(),
          r.monthOrdinal(),
          r.weekday());
    }
  }

  public record Turn(
      String key,
      int sequence,
      LocalDate start,
      LocalDate end,
      List<EmployeeResponse> assignees,
      String warning) {
    static Turn from(RotationTurn t) {
      return new Turn(
          t.key(),
          t.sequence(),
          t.start(),
          t.end(),
          t.assignees().stream().map(EmployeeResponse::from).toList(),
          t.warning());
    }
  }

  public record Preview(String token, List<Turn> turns) {
    public static Preview from(RotationPreview p) {
      return new Preview(p.token(), p.turns().stream().map(Turn::from).toList());
    }
  }

  public record MeetingView(int sequence, LocalDate date) {
    static MeetingView from(Meeting m) {
      return new MeetingView(m.sequence(), m.date());
    }
  }

  public record DutyView(DutyResponse duty, Rule schedule, List<MeetingView> meetings) {
    public static DutyView from(AutomaticDuty d) {
      return new DutyView(
          DutyResponse.from(d.duty()),
          Rule.from(d.schedule()),
          d.meetings().stream().map(MeetingView::from).toList());
    }
  }

  public record Assignee(long slotId, long employeeId, String employeeNumber, String name) {
    static Assignee from(WorkAssignee a) {
      return new Assignee(a.slotId(), a.employeeId(), a.employeeNumber(), a.name());
    }
  }

  public record Occurrence(
      long dutyId,
      String dutyName,
      int sequence,
      LocalDate date,
      RotationMode rotationMode,
      String rotationKey,
      LocalDate periodStart,
      LocalDate periodEnd,
      List<Assignee> assignees,
      String warning,
      boolean holiday) {
    static Occurrence from(WorkOccurrence o) {
      return new Occurrence(
          o.dutyId(),
          o.dutyName(),
          o.sequence(),
          o.date(),
          o.rotationMode(),
          o.rotationKey(),
          o.periodStart(),
          o.periodEnd(),
          o.assignees().stream().map(Assignee::from).toList(),
          o.warning(),
          o.holiday());
    }
  }

  public record Result(List<Occurrence> occurrences, List<DutyView> duties) {
    public static Result from(ScheduleResult r) {
      return new Result(
          r.occurrences().stream().map(Occurrence::from).toList(),
          r.duties().stream().map(DutyView::from).toList());
    }
  }

  public record Change(
      long id, String previousName, String newName, String reason, String changedAt) {
    public static Change from(RotationChange c) {
      return new Change(c.id(), c.previousName(), c.newName(), c.reason(), c.changedAt());
    }
  }

  public record HolidayView(LocalDate date, String name) {
    public static HolidayView from(Holiday h) {
      return new HolidayView(h.date(), h.name());
    }
  }
}
