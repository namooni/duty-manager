package com.dutymanager.dto.planning;

import com.dutymanager.model.planning.Preview;
import java.util.List;

public record PreviewResponse(String token, List<PeriodResponse> periods) {
  public static PreviewResponse from(Preview value) {
    return new PreviewResponse(
        value.token(), value.periods().stream().map(PeriodResponse::from).toList());
  }
}
