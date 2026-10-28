package com.dutymanager.repository.duty;

import com.dutymanager.model.duty.Duty;
import com.dutymanager.model.duty.DutyDefinition;
import java.util.List;
import java.util.Optional;

public interface DutyRepository {
  List<Duty> findAll();

  Optional<Duty> findById(long id);

  default long save(DutyDefinition definition) {
    return save(definition, null);
  }

  long save(DutyDefinition definition, Long randomSeed);

  boolean lockById(long id);

  void lockPlanning();

  void delete(long id);

  void updateDetails(long id, String name, String description);
}
