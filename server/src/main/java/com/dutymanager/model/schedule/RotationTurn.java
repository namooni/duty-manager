package com.dutymanager.model.schedule;

import com.dutymanager.model.employee.Employee;
import java.time.LocalDate;
import java.util.List;

public record RotationTurn(
    String key,
    int sequence,
    LocalDate start,
    LocalDate end,
    List<Employee> assignees,
    String warning) {}
