package com.dutymanager.model.schedule;

import com.dutymanager.model.duty.Strategy;
import java.util.*;

public record AssignmentPlan(
    long id,
    long dutyId,
    int startIndex,
    int assigneeCount,
    Strategy strategy,
    long seed,
    long nextRound,
    List<Long> members,
    List<Long> initialQueue,
    Set<Long> eligible,
    String reason,
    java.time.LocalDate membersFrom) {
  public AssignmentPlan(
      long id,
      long dutyId,
      int startIndex,
      int count,
      Strategy strategy,
      long seed,
      long nextRound,
      List<Long> members,
      List<Long> initial,
      Set<Long> eligible,
      String reason) {
    this(
        id,
        dutyId,
        startIndex,
        count,
        strategy,
        seed,
        nextRound,
        members,
        initial,
        eligible,
        reason,
        null);
  }

  public AssignmentPlan {
    members = List.copyOf(members);
    initialQueue = List.copyOf(initialQueue);
    eligible = Set.copyOf(eligible);
  }
}
