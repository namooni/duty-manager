package com.dutymanager.common.validation;

import com.dutymanager.exception.BadRequestException;

public final class Checks {
  private Checks() {}

  public static void require(boolean condition, String message) {
    if (!condition) throw new BadRequestException(message);
  }
}
