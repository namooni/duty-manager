package com.dutymanager.service.export;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.exception.BadRequestException;
import com.dutymanager.model.duty.*;
import com.dutymanager.model.employee.*;
import com.dutymanager.model.export.*;
import com.dutymanager.model.schedule.*;
import com.dutymanager.repository.employee.EmployeeRepository;
import com.dutymanager.repository.schedule.*;
import com.dutymanager.service.schedule.AutomaticDutyService;
import java.io.*;
import java.time.*;
import java.util.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ScheduleExportServiceTest {
  @Autowired ScheduleExportService exports;
  @Autowired AutomaticDutyService automatic;
  @Autowired EmployeeRepository employees;
  @Autowired ScheduleRepository schedules;
  @Autowired AssignmentPlanRepository plans;
  @Autowired HandoverRepository handovers;
  final LocalDate anchor = LocalDate.of(2026, 11, 2);
  List<Long> people;

  @BeforeEach
  void setup() {
    people =
        List.of(
            employees.save(new EmployeeDefinition("EXP1", "山田")),
            employees.save(new EmployeeDefinition("EXP2", "佐藤")),
            employees.save(new EmployeeDefinition("EXP3", "鈴木")));
  }

  long create(Recurrence recurrence, RotationMode mode) {
    var draft =
        new AutomaticDefinition(
            new DutyDefinition("出力確認", "", anchor, 1, Unit.WEEK, Strategy.CUSTOM, 1, people),
            new ScheduleRule(recurrence, mode, List.of(1, 3, 5), 3, 20, 2, 3),
            recurrence == Recurrence.EXPLICIT_DATES
                ? Arrays.asList(anchor.plusDays(5), null)
                : List.of(),
            1,
            0,
            null,
            anchor.plusDays(27));
    return automatic.activate(draft, automatic.preview(draft).token());
  }

  @ParameterizedTest
  @EnumSource(Recurrence.class)
  void allSixRecurrenceRulesExportSavedDataWithoutExtendingOrChangingAssignments(
      Recurrence recurrence) throws Exception {
    long id = create(recurrence, RotationMode.OCCURRENCE);
    var before = schedules.slots(id);
    var history = plans.history(id);
    var meetings = schedules.meetings(id);
    for (var format : ExportFormat.values()) {
      var bytes = exports.export(id, anchor, anchor.plusDays(60), format, true);
      try (var book = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
        assertThat(book.getNumberOfSheets()).isEqualTo(2);
        assertThat(
                book.getSheetAt(0)
                    .getRow(format == ExportFormat.PERIOD ? 4 : 6)
                    .getCell(0)
                    .getStringCellValue())
            .contains("未割当");
      }
    }
    assertThat(schedules.slots(id)).isEqualTo(before);
    assertThat(plans.history(id)).isEqualTo(history);
    assertThat(schedules.meetings(id)).isEqualTo(meetings);
  }

  @Test
  void handoversManualOwnersAndHolidayStatusMatchTheSavedSchedule() throws Exception {
    long id = create(Recurrence.WORKDAYS, RotationMode.CALENDAR);
    var first = schedules.slots(id).getFirst();
    schedules.saveHoliday(new Holiday(anchor.plusDays(1), "創立記念日"));
    handovers.save(first.id(), anchor.plusDays(2), people.get(0), people.get(1), "引継ぎ");
    var before = schedules.slots(id);
    var audit = schedules.changes(first.id());
    var bytes = exports.export(id, anchor, anchor.plusDays(6), ExportFormat.PERIOD, false);
    try (var book = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
      var main = book.getSheetAt(0);
      assertThat(main.getRow(6).getCell(1).getStringCellValue()).contains("山田");
      assertThat(main.getRow(7).getCell(1).getStringCellValue()).contains("佐藤");
      assertThat(main.getRow(6).getCell(0).getStringCellValue()).isEqualTo("11月2日");
      assertThat(main.getRow(7).getCell(0).getStringCellValue()).isEqualTo("11月4日～11月6日");
      assertThat(book.getSheet("実施日一覧").getRow(10).getCell(4).getStringCellValue())
          .contains("創立記念日");
    }
    assertThat(schedules.slots(id)).isEqualTo(before);
    assertThat(schedules.changes(first.id())).isEqualTo(audit);
  }

  @Test
  void undatedMeetingsAreOptionalAndAnUnallocatedYearDoesNotCreateSlots() throws Exception {
    long id = create(Recurrence.EXPLICIT_DATES, RotationMode.OCCURRENCE);
    var before = schedules.slots(id);
    for (boolean include : List.of(false, true)) {
      try (var book =
          new XSSFWorkbook(
              new ByteArrayInputStream(
                  exports.export(
                      id, anchor, anchor.plusDays(60), ExportFormat.MEETING, include)))) {
        assertThat(book.getSheetAt(0).getLastRowNum()).isEqualTo(include ? 10 : 9);
      }
    }
    try (var book =
        new XSSFWorkbook(
            new ByteArrayInputStream(
                exports.export(
                    id,
                    anchor.plusYears(1),
                    anchor.plusYears(1).plusDays(30),
                    ExportFormat.PERIOD,
                    false)))) {
      assertThat(book.getSheetAt(0).getRow(6).getCell(0).getStringCellValue()).contains("予定はありません");
    }
    assertThat(schedules.slots(id)).isEqualTo(before);
    assertThatThrownBy(
            () -> exports.export(id, anchor, anchor.plusDays(367), ExportFormat.PERIOD, false))
        .isInstanceOf(BadRequestException.class);
  }
}
