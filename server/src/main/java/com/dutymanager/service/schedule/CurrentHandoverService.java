package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.engine.rotation.AssignmentEngine;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.schedule.*;
import com.dutymanager.model.schedule.AssignmentReview.*;
import com.dutymanager.repository.duty.ExclusionRepository;
import com.dutymanager.repository.schedule.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class CurrentHandoverService {
  private final ScheduleRepository schedules;
  private final HandoverRepository handovers;
  private final ExclusionRepository exclusions;
  private final AssignmentEngine periods;
  private final Clock clock;

  public CurrentHandoverService(
      ScheduleRepository schedules,
      HandoverRepository handovers,
      ExclusionRepository exclusions,
      AssignmentEngine periods,
      Clock clock) {
    this.schedules = schedules;
    this.handovers = handovers;
    this.exclusions = exclusions;
    this.periods = periods;
    this.clock = clock;
  }

  public List<Current> current(long id, ScheduleRule rule, List<Employee> people) {
    if (rule.rotationMode() != RotationMode.CALENDAR) return List.of();
    var today = LocalDate.now(clock);
    var changes = handovers.find(id);
    return schedules.slots(id).stream()
        .filter(
            slot ->
                slot.periodStart() != null
                    && !slot.periodStart().isAfter(today)
                    && !slot.periodEnd().isBefore(today))
        .map(
            slot -> {
              var segment =
                  com.dutymanager.engine.schedule.SlotAssignmentResolver.at(slot, changes, today);
              var person =
                  people.stream()
                      .filter(e -> e.id() == segment.employeeId())
                      .findFirst()
                      .orElseThrow();
              return new Current(
                  slot.id(),
                  slot.slotIndex(),
                  segment.start(),
                  segment.end(),
                  person,
                  slot.employeeId());
            })
        .toList();
  }

  public record Restoration(long slotId, long original, long displaced) {}

  public List<Restoration> restorations(
      long id, ScheduleRule rule, List<Long> previous, List<Long> members, List<Employee> people) {
    return current(id, rule, people).stream()
        .filter(
            a ->
                a.originalEmployeeId() != null
                    && a.originalEmployeeId() != a.employee().id()
                    && !previous.contains(a.originalEmployeeId())
                    && members.contains(a.originalEmployeeId()))
        .map(a -> new Restoration(a.slotId(), a.originalEmployeeId(), a.employee().id()))
        .toList();
  }

  public List<Long> restoreOrder(List<Long> members, List<Restoration> restorations) {
    var ordered = new ArrayList<>(members);
    for (var restoration : restorations) {
      ordered.remove(restoration.original());
      int at = ordered.indexOf(restoration.displaced());
      ordered.add(at < 0 ? 0 : at, restoration.original());
    }
    return List.copyOf(ordered);
  }

  public record Review(List<Row> rows, List<String> summaries) {}

  public Review review(
      Duty d,
      ScheduleRule rule,
      List<Long> members,
      Set<Long> eligible,
      AssignmentChange c,
      List<Employee> people) {
    var currentRows = new ArrayList<Row>();
    var summaries = new ArrayList<String>();
    var byId = new HashMap<Long, Employee>();
    people.forEach(e -> byId.put(e.id(), e));
    var currentPeople = current(d.id(), rule, people);
    var removedCurrent =
        c.kind().equals("DUTY")
            ? currentPeople.stream()
                .filter(
                    a ->
                        !members.contains(a.employee().id())
                            || c.handovers().containsKey(a.slotId()))
                .toList()
            : List.<Current>of();
    require(
        c.handovers().keySet().stream()
            .allMatch(slotId -> removedCurrent.stream().anyMatch(a -> a.slotId() == slotId)),
        "引継ぎ対象の担当が変わっています。編集画面を開き直してください。");

    var today = LocalDate.now(clock);
    var handoverData = handovers.find(d.id());
    var unchangedToday =
        schedules.slots(d.id()).stream()
            .filter(
                slot ->
                    slot.periodStart() != null
                        && !slot.periodStart().isAfter(today)
                        && !slot.periodEnd().isBefore(today)
                        && !c.handovers().containsKey(slot.id()))
            .map(
                slot ->
                    com.dutymanager.engine.schedule.SlotAssignmentResolver.at(
                            slot, handoverData, today)
                        .employeeId())
            .collect(java.util.stream.Collectors.toSet());
    var chosenHandover = new HashSet<Long>();
    for (var active : removedCurrent) {
      var replacement = c.handovers().get(active.slotId());
      if (replacement == null) {
        currentRows.add(
            new Row(
                d.id() + ":K:" + active.slotId(),
                d.id(),
                d.name(),
                Integer.parseInt(
                    schedules.slot(active.slotId()).orElseThrow().rotationKey().substring(2)),
                active.slotIndex(),
                active.start(),
                active.end(),
                active.employee(),
                active.employee(),
                false,
                false,
                List.of(),
                "今回の担当のみ継続。参加メンバーからは除外します。"));
        continue;
      }
      require(active.end() != null && !active.end().isBefore(today), "この担当期間には引き継ぐ日が残っていません。");
      require(replacement != active.employee().id(), "現在と異なる担当者を選択してください。");
      require(eligible.contains(replacement), "引継ぎ先には変更後の有効な参加メンバーを選択してください。");
      require(
          chosenHandover.add(replacement) && !unchangedToday.contains(replacement),
          "同じ期間の担当者が重複しています。別の引継ぎ先を選択してください。");
      require(
          !periods.excluded(replacement, today, active.end(), exclusions.findByDutyId(d.id())),
          "引継ぎ先のメンバーが対象外期間に当たります。");
      int seq =
          Integer.parseInt(
              schedules.slot(active.slotId()).orElseThrow().rotationKey().substring(2));
      if (active.start().isBefore(today))
        currentRows.add(
            new Row(
                d.id() + ":P:" + active.slotId(),
                d.id(),
                d.name(),
                seq,
                active.slotIndex(),
                active.start(),
                today.minusDays(1),
                active.employee(),
                active.employee(),
                false,
                false,
                List.of(),
                "昨日までの担当は維持します。"));
      currentRows.add(
          new Row(
              d.id() + ":H:" + active.slotId(),
              d.id(),
              d.name(),
              seq,
              active.slotIndex(),
              today,
              active.end(),
              active.employee(),
              byId.get(replacement),
              false,
              false,
              List.of(),
              "本日から残りの担当を引き継ぎ、次の自動担当順に反映します。"));
      summaries.add(
          d.name()
              + "："
              + active.employee().name()
              + "から"
              + byId.get(replacement).name()
              + "が"
              + today
              + "から引き継ぎます。");
    }

    return new Review(List.copyOf(currentRows), List.copyOf(summaries));
  }
}
