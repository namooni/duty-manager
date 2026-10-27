package com.dutymanager.common.time;

import com.dutymanager.exception.BadRequestException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class DateRangeValidator {
  private DateRangeValidator() {}

  public static void validate(LocalDate from, LocalDate to) {
    if (from.isAfter(to) || ChronoUnit.DAYS.between(from, to) > 366)
      throw new BadRequestException("表示期間は最大367日です。終了日は開始日以降を指定してください。");
    if (from.getYear() < 1900 || to.getYear() > 2199)
      throw new BadRequestException("日付は1900年から2199年の範囲で指定してください。");
  }
}
