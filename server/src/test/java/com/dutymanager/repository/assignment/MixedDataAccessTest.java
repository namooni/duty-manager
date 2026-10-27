package com.dutymanager.repository.assignment;

import static org.assertj.core.api.Assertions.*;

import com.dutymanager.model.assignment.Assignment;
import com.dutymanager.model.assignment.Replacement;
import com.dutymanager.model.duty.DutyDefinition;
import com.dutymanager.model.duty.Strategy;
import com.dutymanager.model.duty.Unit;
import com.dutymanager.model.employee.Employee;
import com.dutymanager.model.employee.EmployeeDefinition;
import com.dutymanager.model.planning.Period;
import com.dutymanager.repository.duty.DutyRepository;
import com.dutymanager.repository.employee.EmployeeRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
class MixedDataAccessTest {
  @Autowired EmployeeRepository employees;
  @Autowired DutyRepository duties;
  @Autowired AssignmentRepository assignments;
  @Autowired PlatformTransactionManager transactions;
  @Autowired Clock clock;

  record Fixture(long assignmentId, long secondEmployeeId) {}

  Fixture seed() {
    String number = UUID.randomUUID().toString();
    long first = employees.save(new EmployeeDefinition(number.substring(0, 20) + "1", "田中"));
    long second = employees.save(new EmployeeDefinition(number.substring(0, 20) + "2", "佐藤"));
    LocalDate today = LocalDate.now(clock);
    long dutyId =
        duties.save(
            new DutyDefinition(
                "混在テスト", "", today, 1, Unit.WEEK, Strategy.CUSTOM, 1, List.of(first, second)));
    assignments.savePeriod(
        dutyId,
        new Period(
            today,
            today.plusDays(6),
            List.of(new Employee(first, number, "田中", true)),
            false,
            null));
    long assignmentId =
        assignments.findAll(today, today).stream()
            .filter(a -> a.dutyId() == dutyId)
            .findFirst()
            .orElseThrow()
            .id();
    return new Fixture(assignmentId, second);
  }

  @Test
  @Transactional
  void mybatisReadsUncommittedJdbcWritesAndDoesNotReuseStaleResultAfterJdbcUpdate() {
    Fixture fixture = seed();
    Assignment before = assignments.findById(fixture.assignmentId()).orElseThrow();
    assertThat(before.employeeName()).isEqualTo("田中");
    assignments.replace(before, new Replacement(fixture.secondEmployeeId(), "代理"));
    Assignment after = assignments.findById(fixture.assignmentId()).orElseThrow();
    assertThat(after.employeeName()).isEqualTo("佐藤");
    assertThat(assignments.findChanges(after.id()))
        .singleElement()
        .satisfies(
            change -> {
              assertThat(change.previousName()).isEqualTo("田中");
              assertThat(change.newName()).isEqualTo("佐藤");
            });
  }

  @Test
  void failureRollsBackJdbcDataThatWasReadThroughMybatisInTheSameTransaction() {
    long[] assignmentId = {0};
    var template = new TransactionTemplate(transactions);
    assertThatThrownBy(
            () ->
                template.execute(
                    status -> {
                      Fixture fixture = seed();
                      assignmentId[0] = fixture.assignmentId();
                      Assignment current =
                          assignments.findById(fixture.assignmentId()).orElseThrow();
                      assignments.replace(
                          current, new Replacement(fixture.secondEmployeeId(), "取り消し"));
                      assertThat(assignments.findChanges(current.id())).hasSize(1);
                      throw new IllegalStateException("rollback probe");
                    }))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("rollback probe");
    assertThat(assignments.findById(assignmentId[0])).isEmpty();
    assertThat(assignments.findChanges(assignmentId[0])).isEmpty();
  }
}
