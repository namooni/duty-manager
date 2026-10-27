package com.dutymanager.service.schedule;

import static com.dutymanager.common.validation.Checks.require;

import com.dutymanager.exception.*;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.duty.*;
import com.dutymanager.repository.schedule.ScheduleRepository;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyCalendarService {
  private final ScheduleRepository schedules;
  private final Clock clock;

  public CompanyCalendarService(ScheduleRepository schedules, Clock clock) {
    this.schedules = schedules;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public List<Holiday> holidays() {
    return schedules.holidays();
  }

  @Transactional
  public void saveHoliday(Holiday holiday) {
    require(!holiday.date().isBefore(LocalDate.now(clock)), "過去の休業日は変更できません。");
    schedules.saveHoliday(new Holiday(holiday.date(), holiday.name().trim()));
  }

  @Transactional
  public void deleteHoliday(LocalDate date) {
    require(!date.isBefore(LocalDate.now(clock)), "過去の休業日は変更できません。");
    schedules.deleteHoliday(date);
  }
}
