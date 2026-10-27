package com.dutymanager.model.schedule;

import java.util.List;

public record RotationPreview(String token, List<RotationTurn> turns) {}
