package com.dutymanager.common.crypto;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;

public final class ConfirmationToken {
  private ConfirmationToken() {}

  public static String of(Object... values) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(Arrays.deepToString(values).getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
