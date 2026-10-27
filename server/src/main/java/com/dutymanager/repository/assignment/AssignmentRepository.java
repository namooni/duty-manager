package com.dutymanager.repository.assignment;

import com.dutymanager.model.assignment.Assignment;
import com.dutymanager.model.assignment.Change;
import com.dutymanager.model.assignment.Replacement;
import com.dutymanager.model.planning.Period;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AssignmentRepository {
  List<Assignment> findAll(LocalDate from, LocalDate to);

  Optional<Assignment> findById(long id);

  List<Change> findChanges(long id);

  void savePeriod(long dutyId, Period period);

  void replace(Assignment current, Replacement replacement);
}
