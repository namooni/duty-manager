package com.dutymanager.model.planning;

import java.util.List;

public record Preview(String token, List<Period> periods) {
  public Preview {
    periods = List.copyOf(periods);
  }
}
