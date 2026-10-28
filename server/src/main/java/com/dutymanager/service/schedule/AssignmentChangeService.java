package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.engine.rotation.*;
import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.schedule.*;
import com.dutymanager.model.schedule.AssignmentReview.*;
import com.dutymanager.repository.duty.*;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.*;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignmentChangeService {
  private final DutyRepository duties;
  private final EmployeeRepository employees;
  private final ScheduleRepository schedules;
  private final ExclusionRepository exclusions;
  private final AssignmentPlanRepository plans;
  private final AssignmentProjectionService projection;
  private final AssignmentEngine periods;
  private final Clock clock;
  private final HandoverRepository handovers;
  private final CurrentHandoverService currentHandover;
  private final com.dutymanager.repository.schedule.ScheduleRangeRepository ranges;

  public AssignmentChangeService(
      DutyRepository duties,
      EmployeeRepository employees,
      ScheduleRepository schedules,
      ExclusionRepository exclusions,
      AssignmentPlanRepository plans,
      AssignmentProjectionService projection,
      AssignmentEngine periods,
      Clock clock,
      HandoverRepository handovers,
      CurrentHandoverService currentHandover,
      com.dutymanager.repository.schedule.ScheduleRangeRepository ranges) {
    this.duties = duties;
    this.employees = employees;
    this.schedules = schedules;
    this.exclusions = exclusions;
    this.plans = plans;
    this.projection = projection;
    this.periods = periods;
    this.clock = clock;
    this.handovers = handovers;
    this.currentHandover = currentHandover;
    this.ranges = ranges;
  }

  private Duty duty(long id) {
    return duties.findById(id).orElseThrow(() -> new NotFoundException("当番が見つかりません。"));
  }

  private Set<LocalDate> holidays() {
    var days = new HashSet<LocalDate>();
    schedules.holidays().forEach(h -> days.add(h.date()));
    return days;
  }

  private LocalDate horizon(long id) {
    LocalDate to = LocalDate.now(clock).plusDays(366);
    for (var slot : schedules.slots(id))
      if (slot.periodEnd() != null && slot.periodEnd().isAfter(to)) to = slot.periodEnd();
    for (var m : schedules.meetings(id))
      if (m.date() != null && m.date().isAfter(to)) to = m.date();
    return to;
  }

  private AssignmentProjectionService.Projection project(
      Duty d,
      ScheduleRule rule,
      List<Employee> people,
      LocalDate to,
      int index,
      List<AssignmentPlan> versions) {
    return project(d, rule, people, to, index, versions, schedules.meetings(d.id()));
  }

  private AssignmentProjectionService.Projection project(
      Duty d,
      ScheduleRule rule,
      List<Employee> people,
      LocalDate to,
      int index,
      List<AssignmentPlan> versions,
      List<Meeting> planningMeetings) {
    return projection.project(
        d,
        rule,
        planningMeetings,
        people,
        exclusions.findByDutyId(d.id()),
        holidays(),
        to,
        index,
        versions);
  }

  private int firstFuture(List<RotationTurn> turns) {
    LocalDate today = LocalDate.now(clock);
    return turns.stream()
        .filter(t -> t.start() == null || t.start().isAfter(today))
        .mapToInt(RotationTurn::sequence)
        .findFirst()
        .orElseThrow(() -> new ValidationException());
  }

  private static class ValidationException extends BadRequestException {
    ValidationException() {
      super("今後の担当期間・開催回がありません。");
    }
  }

  @Transactional
  public Context context(long id) {
    plans.lock();
    var d = duty(id);
    var rule = schedules.rules().get(id);
    require(rule != null, "以前の形式の当番は、この編集に対応していません。");
    var people = employees.findAll();
    var versions = plans.plans(id);
    var range = ranges.find(id).orElseThrow();
    require(
        range.endDate() == null || !range.endDate().isBefore(LocalDate.now(clock)),
        "終了した当番の担当ルールは変更できません。");
    var turns =
        project(d, rule, people, range.plannedThrough(), -1, versions).turns().stream()
            .filter(range::includes)
            .toList();
    var currentAssignments = currentHandover.current(id, rule, people);
    var calculation = project(d, rule, people, horizon(id), -1, versions).turns();
    int next = firstFuture(calculation);
    var shown = turns.stream().filter(t -> t.sequence() >= next).toList();
    if (shown.isEmpty()) {
      require(!currentAssignments.isEmpty(), "変更できる担当予定がありません。先に担当予定を追加してください。");
      shown = List.of(calculation.get(next));
    }
    var queue = project(d, rule, people, horizon(id), next, versions).queue().remaining();
    var current = projection.definition(d, projection.at(id, next));
    return new Context(
        current,
        shown.stream().limit(100).map(t -> new Boundary(t.sequence(), t.start(), t.end())).toList(),
        people,
        plans.history(id),
        currentAssignments,
        java.util.stream.Stream.concat(queue.stream(), current.memberIds().stream())
            .distinct()
            .toList(),
        LocalDate.now(clock));
  }

  private record Prepared(Result result, List<AssignmentPlan> versions) {}

  @Transactional
  public Result preview(AssignmentChange c) {
    plans.lock();
    return prepare(c).result();
  }

  @Transactional
  public void confirm(AssignmentChange c, String token) {
    plans.lock();
    var prepared = prepare(c);
    if (!prepared.result().token().equals(token))
      throw new ConflictException("予定やメンバー情報が更新されています。変更内容をもう一度確認してください。");
    require(prepared.result().canApply(), "未解決の担当・警告を確認してください。");
    for (var p : prepared.versions()) plans.save(p);
    plans.apply(c, prepared.result().rows());
    for (var row : prepared.result().currentRows())
      if (row.key().contains(":H:")
          && row.before() != null
          && row.after() != null
          && row.before().id() != row.after().id())
        handovers.save(
            Long.parseLong(row.key().substring(row.key().lastIndexOf(':') + 1)),
            row.start(),
            row.before().id(),
            row.after().id(),
            c.reason().trim());
    if (c.kind().equals("STATUS")) employees.updateActive(c.employeeId(), c.active());
  }

  private Prepared prepare(AssignmentChange c) {
    require(Set.of("DUTY", "STATUS").contains(c.kind()), "変更種別を確認してください。");
    require(
        c.reason() != null && !c.reason().isBlank() && c.reason().length() <= 300,
        "変更理由を300文字以内で入力してください。");
    require(c.handovers().isEmpty() || c.kind().equals("DUTY"), "現在の担当の引継ぎは当番の参加メンバー編集から指定してください。");
    var people = employees.findAll();
    var byId = new HashMap<Long, Employee>();
    people.forEach(e -> byId.put(e.id(), e));
    if (c.kind().equals("STATUS")) {
      require(c.employeeId() != null && c.active() != null, "メンバーと状態を指定してください。");
      var target = byId.get(c.employeeId());
      if (target == null) throw new NotFoundException("メンバーが見つかりません。");
      require(target.active() != c.active(), "メンバーの状態が変わっています。一覧を更新してください。");
    } else
      require(
          c.dutyId() != null
              && c.effectiveIndex() != null
              && c.effectiveIndex() >= 0
              && c.strategy() != null
              && c.assigneeCount() != null
              && c.assigneeCount() >= 1
              && c.assigneeCount() <= 20,
          "適用開始と担当ルールを確認してください。");
    var targetDuties =
        c.kind().equals("DUTY")
            ? List.of(duty(c.dutyId()))
            : duties.findAll().stream()
                .filter(
                    d ->
                        d.memberIds().contains(c.employeeId())
                            || plans.plans(d.id()).stream()
                                .anyMatch(p -> p.members().contains(c.employeeId())))
                .sorted(Comparator.comparingLong(Duty::id))
                .toList();
    var rows = new ArrayList<Row>();
    var currentRows = new ArrayList<Row>();
    var warnings = new ArrayList<String>();
    var summaries = new ArrayList<String>();
    var save = new ArrayList<AssignmentPlan>();
    var source =
        new StringBuilder(c.toString())
            .append(people)
            .append(schedules.holidays())
            .append(plans.historyStamp());
    for (var d : targetDuties) {
      duties.lockById(d.id());
      var rule = schedules.rules().get(d.id());
      source
          .append(d)
          .append(rule)
          .append(schedules.meetings(d.id()))
          .append(schedules.slots(d.id()))
          .append(exclusions.findByDutyId(d.id()))
          .append(handovers.find(d.id()));
      if (rule == null) {
        warnings.add(d.name() + "：以前の形式の担当は先に個別に整理してください。");
        continue;
      }
      var allocationRange = ranges.find(d.id()).orElseThrow();
      source.append(allocationRange);
      if (c.kind().equals("STATUS")
          && allocationRange.endDate() != null
          && allocationRange.endDate().isBefore(LocalDate.now(clock))) continue;
      var registeredMeetings = schedules.meetings(d.id());
      var planningMeetings = new ArrayList<>(registeredMeetings);
      // Preserve a future cursor even when every explicit meeting has already taken place.
      // This virtual boundary is never saved as a meeting or an assignment.
      if (c.kind().equals("STATUS")
          && rule.recurrence() == Recurrence.EXPLICIT_DATES
          && planningMeetings.stream()
              .noneMatch(m -> m.date() == null || m.date().isAfter(LocalDate.now(clock))))
        planningMeetings.add(new Meeting(planningMeetings.size(), null));
      var old = plans.plans(d.id());
      source.append(old);
      LocalDate to = horizon(d.id());
      var original = project(d, rule, people, to, -1, old, planningMeetings).turns();
      if (c.kind().equals("STATUS")
          && original.stream()
              .noneMatch(t -> t.start() == null || t.start().isAfter(LocalDate.now(clock))))
        continue;
      int next = firstFuture(original);
      int cut = c.kind().equals("DUTY") ? c.effectiveIndex() : next;
      require(cut >= next && cut < original.size(), "過去・進行中の担当は変更できません。今後の担当開始を選択してください。");
      if (c.kind().equals("DUTY") && old.stream().anyMatch(p -> p.startIndex() > cut)) {
        warnings.add(d.name() + "：後の変更予定があります。その適用開始以降を選択してください。");
        continue;
      }
      if (c.kind().equals("STATUS") && !c.active()) {
        var today = LocalDate.now(clock);
        boolean currentAssignee =
            currentHandover.current(d.id(), rule, people).stream()
                .anyMatch(person -> person.employee().id() == c.employeeId());
        if (handovers.find(d.id()).stream()
            .anyMatch(h -> h.date().isAfter(today) && h.employeeId() == c.employeeId()))
          warnings.add(d.name() + "：このメンバーは引継ぎ予定の担当者です。先にその担当者を変更してください。");
        if (currentAssignee) warnings.add(d.name() + "：このメンバーは現在の担当です。進行中の担当の扱いを先に確認してください。");
      }
      var before = project(d, rule, people, to, cut, old, planningMeetings);
      var current = projection.definition(d, before.definition());
      List<Long> requestedMembers = c.kind().equals("DUTY") ? c.memberIds() : current.memberIds();
      var restorations =
          c.kind().equals("DUTY")
              ? currentHandover.restorations(
                  d.id(), rule, current.memberIds(), requestedMembers, people)
              : List.<CurrentHandoverService.Restoration>of();
      var effectiveHandovers = new TreeMap<Long, Long>(c.handovers());
      for (var restoration : restorations) {
        require(
            !effectiveHandovers.containsKey(restoration.slotId())
                || effectiveHandovers.get(restoration.slotId()) == restoration.original(),
            "元の担当への復元と別の引継ぎを同時には指定できません。");
        effectiveHandovers.put(restoration.slotId(), restoration.original());
      }
      List<Long> members = currentHandover.restoreOrder(requestedMembers, restorations);
      Strategy strategy = c.kind().equals("DUTY") ? c.strategy() : current.strategy();
      int count = c.kind().equals("DUTY") ? c.assigneeCount() : current.assigneeCount();
      require(
          !members.isEmpty()
              && members.size() <= 200
              && new HashSet<>(members).size() == members.size()
              && members.stream().allMatch(byId::containsKey),
          "重複のない参加メンバーを1〜200人選択してください。");
      require(
          members.stream()
              .allMatch(id -> byId.get(id).active() || current.memberIds().contains(id)),
          "新規参加者は有効なメンバーを選択してください。");
      if (!effectiveHandovers.isEmpty()) {
        require(cut == next, "現在の担当を引き継ぐ場合は、次の担当からルールを適用してください。");
        require(c.firstEmployeeId() == null, "引継ぎ後の順番は自動で引き継ぎます。先頭候補の指定を解除してください。");
      }
      if (c.kind().equals("DUTY")
          && handovers.find(d.id()).stream()
              .anyMatch(
                  h -> h.date().isAfter(LocalDate.now(clock)) && !members.contains(h.employeeId())))
        warnings.add(d.name() + "：除外するメンバーに引継ぎ予定があります。先に引継ぎ先を変更してください。");
      var ordered = new ArrayList<>(members);
      if (strategy == Strategy.EMPLOYEE_NUMBER
          && (c.kind().equals("DUTY") || before.definition() == null))
        ordered.sort(
            Comparator.comparing((Long id) -> byId.get(id).employeeNumber())
                .thenComparingLong(Long::longValue));
      var eligible = new LinkedHashSet<Long>();
      for (long id : ordered) {
        boolean active =
            c.kind().equals("STATUS") && id == c.employeeId() ? c.active() : byId.get(id).active();
        if (active) eligible.add(id);
      }
      var currentReview =
          currentHandover.review(
              current, rule, members, eligible, c.withHandovers(effectiveHandovers), people);
      currentRows.addAll(currentReview.rows());
      summaries.addAll(currentReview.summaries());
      var remaining = before.queue().remaining();
      Long first = c.kind().equals("DUTY") ? c.firstEmployeeId() : null;
      if (first == null)
        first = remaining.stream().filter(eligible::contains).findFirst().orElse(null);
      require(eligible.size() >= count, "有効な参加メンバーが担当人数より少なくなります。担当人数や参加者を見直してください。");
      if (first == null) {
        var cycle = new ArrayList<>(ordered);
        if (strategy == Strategy.SHUFFLED_ROUND)
          Collections.shuffle(
              cycle, new Random(d.randomSeed() * 1000003L + before.queue().round() + 1));
        first =
            cycle.stream()
                .filter(eligible::contains)
                .filter(id -> c.kind().equals("STATUS") || current.memberIds().contains(id))
                .findFirst()
                .orElse(null);
      }
      if (first == null && !effectiveHandovers.isEmpty())
        first = effectiveHandovers.values().iterator().next();
      require(first != null && eligible.contains(first), "引き継ぐ先頭の担当者を選択してください。");
      var initial = new ArrayList<Long>();
      if (c.kind().equals("STATUS")) {
        remaining.stream().filter(ordered::contains).forEach(initial::add);
      } else if (strategy == Strategy.SHUFFLED_ROUND && strategy == current.strategy()) {
        remaining.stream().filter(ordered::contains).forEach(initial::add);
        var added = ordered.stream().filter(id -> !current.memberIds().contains(id)).toList();
        var shuffled = new ArrayList<>(added);
        Collections.shuffle(shuffled, new Random(d.randomSeed() + cut));
        initial.addAll(shuffled);
        if (c.kind().equals("DUTY") && c.firstEmployeeId() != null) {
          int at = initial.indexOf(first);
          if (at < 0) {
            initial.clear();
            initial.addAll(ordered);
            Collections.shuffle(
                initial, new Random(d.randomSeed() * 1000003L + before.queue().round() + 1));
            at = initial.indexOf(first);
          }
          Collections.rotate(initial, -at);
        }
      } else if (strategy == Strategy.SHUFFLED_ROUND) {
        initial.addAll(ordered);
        Collections.shuffle(initial, new Random(d.randomSeed() + cut));
        Collections.rotate(initial, -initial.indexOf(first));
      } else {
        int at = ordered.indexOf(first);
        initial.addAll(ordered.subList(at, ordered.size()));
      }
      if (c.kind().equals("STATUS")
          || (strategy == Strategy.SHUFFLED_ROUND
              && strategy == current.strategy()
              && c.firstEmployeeId() == null)) {
        first = initial.stream().filter(eligible::contains).findFirst().orElse(null);
        if (first == null) {
          var cycle = new ArrayList<>(ordered);
          if (strategy == Strategy.SHUFFLED_ROUND)
            Collections.shuffle(
                cycle, new Random(d.randomSeed() * 1000003L + before.queue().round() + 1));
          first = cycle.stream().filter(eligible::contains).findFirst().orElseThrow();
        }
      }
      if (!restorations.isEmpty()) {
        var returned =
            restorations.stream()
                .map(CurrentHandoverService.Restoration::displaced)
                .filter(eligible::contains)
                .distinct()
                .toList();
        initial.removeAll(returned);
        initial.addAll(0, returned);
        summaries.add(d.name() + "：元の担当者を本日から復元し、引継ぎ先は次の自動担当に戻します。");
      }
      initial.removeIf(effectiveHandovers.values()::contains);
      if (!effectiveHandovers.isEmpty()) {
        first = initial.stream().filter(eligible::contains).findFirst().orElse(null);
        if (first == null) {
          var cycle = new ArrayList<>(ordered);
          if (strategy == Strategy.SHUFFLED_ROUND)
            Collections.shuffle(
                cycle, new Random(d.randomSeed() * 1000003L + before.queue().round() + 1));
          first = cycle.stream().filter(eligible::contains).findFirst().orElseThrow();
        }
      }
      // Status restoration preserves inactive placeholders in the first queue; actual assignments
      // remain compact.
      var newPlan =
          new AssignmentPlan(
              0,
              d.id(),
              cut,
              count,
              strategy,
              d.randomSeed(),
              before.queue().round() + 1,
              ordered,
              initial,
              eligible,
              c.reason().trim(),
              c.kind().equals("DUTY")
                  ? LocalDate.now(clock)
                  : (before.definition() == null ? null : before.definition().membersFrom()));
      var candidate = new ArrayList<>(old.stream().filter(p -> p.startIndex() < cut).toList());
      candidate.add(newPlan);
      save.add(newPlan);
      if (c.kind().equals("STATUS"))
        for (var future : old)
          if (future.startIndex() > cut) {
            var flags = new LinkedHashSet<>(future.eligible());
            if (future.members().contains(c.employeeId())) {
              if (c.active()) flags.add(c.employeeId());
              else flags.remove(c.employeeId());
            }
            var adapted =
                new AssignmentPlan(
                    0,
                    d.id(),
                    future.startIndex(),
                    future.assigneeCount(),
                    future.strategy(),
                    future.seed(),
                    future.nextRound(),
                    future.members(),
                    future.initialQueue(),
                    flags,
                    c.reason().trim(),
                    future.membersFrom());
            candidate.add(adapted);
            save.add(adapted);
          }
      var projected = project(d, rule, people, to, -1, candidate, planningMeetings).turns();
      summaries.add(d.name() + "：第" + (cut + 1) + "担当から変更。先頭候補：" + byId.get(first).name());
      var excludedForDuty = exclusions.findByDutyId(d.id());
      var stored = schedules.slots(d.id());
      var range = ranges.find(d.id()).orElseThrow();
      source.append(range);
      for (var rawTurn : projected) {
        if (rule.recurrence() == Recurrence.EXPLICIT_DATES
            && rawTurn.sequence() >= registeredMeetings.size()) continue;
        if (!range.includes(rawTurn)) continue;
        var turn = range.trim(rawTurn);
        if (turn.sequence() < cut) continue;
        if (turn.warning() != null)
          warnings.add(d.name() + " · 第" + (turn.sequence() + 1) + "担当：" + turn.warning());
        var actual = stored.stream().filter(slot -> slot.rotationKey().equals(turn.key())).toList();
        int size =
            Math.max(
                actual.stream().mapToInt(RotationSlot::slotIndex).max().orElse(-1) + 1,
                turn.assignees().size());
        var chosen = new HashSet<Long>();
        for (int slotIndex = 0; slotIndex < size; slotIndex++) {
          final int slotNo = slotIndex;
          String key = d.id() + ":" + turn.key() + ":" + slotIndex;
          var prev =
              actual.stream().filter(slot -> slot.slotIndex() == slotNo).findFirst().orElse(null);
          Employee automatic =
              slotIndex < turn.assignees().size()
                  ? byId.get(turn.assignees().get(slotIndex).id())
                  : null;
          Employee after = automatic;
          boolean manual = prev != null && prev.manualOverride();
          String message = "";
          boolean conflict = false;
          var activePlan =
              candidate.stream()
                  .filter(p -> p.startIndex() <= turn.sequence())
                  .reduce((a, b) -> b)
                  .orElseThrow();
          var choices =
              people.stream()
                  .filter(e -> activePlan.eligible().contains(e.id()))
                  .filter(
                      e ->
                          turn.start() == null
                              || !periods.excluded(
                                  e.id(), turn.start(), turn.end(), excludedForDuty))
                  .toList();
          if (manual) {
            Employee preserved = byId.get(prev.employeeId());
            boolean valid =
                automatic != null && choices.stream().anyMatch(e -> e.id() == preserved.id());
            if (valid) after = preserved;
            else {
              after = preserved;
              conflict = true;
              message =
                  automatic == null
                      ? "人数変更で手動の担当枠がなくなります。担当人数を見直してください。"
                      : "手動指定の担当者を引き継げません。代わりの担当者を選択してください。";
            }
          }
          if (c.replacements().containsKey(key)) {
            Long replacement = c.replacements().get(key);
            require(
                automatic != null && choices.stream().anyMatch(e -> e.id() == replacement),
                "適格な変更後の担当者を選択してください。");
            after = byId.get(replacement);
            manual = true;
            conflict = false;
            message = "検討画面で担当者を指定";
          }
          if (after != null && !chosen.add(after.id())) {
            conflict = true;
            message = "同じ回の担当者が重複しています。担当者を選び直してください。";
          }
          Employee previous = prev == null ? null : byId.get(prev.employeeId());
          rows.add(
              new Row(
                  key,
                  d.id(),
                  d.name(),
                  turn.sequence(),
                  slotIndex,
                  turn.start(),
                  turn.end(),
                  previous,
                  after,
                  manual,
                  conflict,
                  choices,
                  message));
        }
      }
    }
    // Unknown replacement keys are stale input, never silently accepted.
    require(
        c.replacements().keySet().stream()
            .allMatch(key -> rows.stream().anyMatch(row -> row.key().equals(key))),
        "担当の選択が古くなっています。再確認してください。");
    boolean canApply = warnings.isEmpty() && rows.stream().noneMatch(Row::conflict);
    String token = hash(source.append(rows).append(save).toString());
    return new Prepared(
        new Result(
            token,
            List.copyOf(rows),
            warnings.stream().distinct().toList(),
            canApply,
            List.copyOf(summaries),
            List.copyOf(currentRows)),
        save);
  }

  private String hash(String value) {
    return com.dutymanager.common.crypto.ConfirmationToken.of(value);
  }
}
