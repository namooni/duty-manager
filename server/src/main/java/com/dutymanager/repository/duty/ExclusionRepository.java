package com.dutymanager.repository.duty;

import com.dutymanager.model.duty.Exclusion;
import com.dutymanager.model.duty.ExclusionDefinition;
import java.util.List;

public interface ExclusionRepository {
  List<Exclusion> findByDutyId(long dutyId);

  void save(long dutyId, ExclusionDefinition input);
}
