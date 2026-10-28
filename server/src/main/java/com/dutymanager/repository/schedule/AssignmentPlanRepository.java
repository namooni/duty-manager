package com.dutymanager.repository.schedule;

import com.dutymanager.model.schedule.*;
import java.util.*;

public interface AssignmentPlanRepository {
  void lock();

  List<AssignmentPlan> plans(long dutyId);

  void save(AssignmentPlan plan);

  boolean hasPlans(long dutyId);

  boolean requiresReview(long employeeId);

  String historyStamp();

  List<AssignmentReview.History> history(long dutyId);

  void apply(AssignmentChange command, List<AssignmentReview.Row> rows);
}
