package com.dutymanager.controller;

import static org.assertj.core.api.Assertions.*;

import java.net.URI;
import java.net.http.*;
import java.time.Clock;
import java.time.LocalDate;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiIntegrationTest {
  @LocalServerPort int port;
  @Autowired Clock clock;
  @Autowired org.springframework.jdbc.core.JdbcTemplate db;
  long createdDuty;
  final java.util.List<Long> createdEmployees = new java.util.ArrayList<>();

  @org.junit.jupiter.api.AfterEach
  void cleanup() {
    if (createdDuty > 0) {
      db.update(
          "DELETE FROM duty_rotation_changes WHERE rotation_slot_id IN (SELECT id FROM"
              + " duty_rotation_slots WHERE duty_id=?)",
          createdDuty);
      for (String table :
          java.util.List.of(
              "duty_rotation_slots", "duty_meetings", "duty_schedule_ranges", "duty_schedules"))
        db.update("DELETE FROM " + table + " WHERE duty_id=?", createdDuty);
      db.update(
          "DELETE FROM assignment_changes WHERE assignment_id IN (SELECT id FROM assignments WHERE"
              + " duty_id=?)",
          createdDuty);
      for (String table : java.util.List.of("assignments", "exclusions", "duty_members"))
        db.update("DELETE FROM " + table + " WHERE duty_id=?", createdDuty);
      db.update("DELETE FROM duties WHERE id=?", createdDuty);
    }
    createdEmployees.forEach(id -> db.update("DELETE FROM employees WHERE id=?", id));
  }

  final HttpClient client = HttpClient.newHttpClient();

  HttpResponse<String> call(String method, String path, String body) throws Exception {
    var builder =
        HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api" + path))
            .header("Content-Type", "application/json");
    builder.method(
        method,
        body == null
            ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(body));
    return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
  }

  String field(String json, String name) {
    var matcher =
        Pattern.compile("\\\"" + name + "\\\"\\s*:\\s*(?:\\\")?([^\\\",}]+)").matcher(json);
    assertThat(matcher.find()).isTrue();
    return matcher.group(1);
  }

  @Test
  void employeeEditValidationConflictAndDeletionWorkOverHttp() throws Exception {
    var created = call("POST", "/employees", "{\"employeeNumber\":\"HTTP_EDIT\",\"name\":\"編集前\"}");
    assertThat(created.statusCode()).isEqualTo(201);
    long id = Long.parseLong(field(created.body(), "id"));
    createdEmployees.add(id);
    String input =
        """
        {"employee":{"employeeNumber":"HTTP_EDIT2","name":"編集後"},"expected":{"employeeNumber":"HTTP_EDIT","name":"編集前"}}
        """;
    assertThat(call("PATCH", "/employees/" + id, input).statusCode()).isEqualTo(204);
    assertThat(call("GET", "/employees", null).body()).contains("HTTP_EDIT2", "編集後");
    assertThat(call("PATCH", "/employees/" + id, input).statusCode()).isEqualTo(409);
    assertThat(
            call(
                    "PATCH",
                    "/employees/" + id,
                    """
                    {"employee":{"employeeNumber":" ","name":"編集後"},"expected":{"employeeNumber":"HTTP_EDIT2","name":"編集後"}}
                    """)
                .statusCode())
        .isEqualTo(400);
    assertThat(call("GET", "/employees/" + id + "/deletion-status", null).body())
        .contains("\"canDelete\":true");
    assertThat(call("DELETE", "/employees/" + id, null).statusCode()).isEqualTo(204);
    assertThat(call("DELETE", "/employees/" + id, null).statusCode()).isEqualTo(404);
    assertThat(call("GET", "/employees/" + id + "/deletion-status", null).statusCode())
        .isEqualTo(404);
  }

  @Test
  void dutyDeletionReturnsNoContentAndMissingDutyReturnsNotFound() throws Exception {
    var employee =
        call("POST", "/employees", "{\"employeeNumber\":\"HTTP_DELETE\",\"name\":\"担当者\"}");
    assertThat(employee.statusCode()).isEqualTo(201);
    String person = field(employee.body(), "id");
    createdEmployees.add(Long.parseLong(person));
    var task =
        call(
            "POST",
            "/duties",
            """
            {"name":"削除対象","description":"","anchorDate":"%s","intervalCount":1,
             "intervalUnit":"WEEK","strategy":"CUSTOM","assigneeCount":1,"memberIds":[%s]}
            """
                .formatted(LocalDate.now(clock), person));
    assertThat(task.statusCode()).isEqualTo(201);
    createdDuty = Long.parseLong(field(task.body(), "id"));
    assertThat(call("GET", "/employees/" + person + "/deletion-status", null).body())
        .contains("\"canDelete\":false");
    assertThat(call("DELETE", "/employees/" + person, null).statusCode()).isEqualTo(409);
    assertThat(call("GET", "/duties/" + createdDuty, null).body()).contains("削除対象");
    String update =
        """
        {"name":"編集後","description":"年間予定","expectedName":"削除対象","expectedDescription":""}
        """;
    assertThat(call("PATCH", "/duties/" + createdDuty, update).statusCode()).isEqualTo(204);
    assertThat(call("GET", "/duties/" + createdDuty, null).body()).contains("編集後", "年間予定");
    assertThat(call("PATCH", "/duties/" + createdDuty, update).statusCode()).isEqualTo(409);
    assertThat(
            call(
                    "PATCH",
                    "/duties/" + createdDuty,
                    """
                    {"name":" ","description":"","expectedName":"編集後","expectedDescription":"年間予定"}
                    """)
                .statusCode())
        .isEqualTo(400);
    assertThat(call("DELETE", "/duties/" + createdDuty, null).statusCode()).isEqualTo(204);
    assertThat(call("DELETE", "/duties/" + createdDuty, null).statusCode()).isEqualTo(404);
    assertThat(call("GET", "/duties/" + createdDuty + "/exclusions", null).statusCode())
        .isEqualTo(404);
  }

  @Test
  void employeeDutyPreviewConfirmAndReplacementWorkOverHttp() throws Exception {
    var first = call("POST", "/employees", "{\"employeeNumber\":\"HTTP001\",\"name\":\"高橋\"}");
    var second = call("POST", "/employees", "{\"employeeNumber\":\"HTTP002\",\"name\":\"山本\"}");
    assertThat(first.statusCode()).isEqualTo(201);
    assertThat(second.statusCode()).isEqualTo(201);
    String one = field(first.body(), "id"), two = field(second.body(), "id");
    createdEmployees.add(Long.parseLong(one));
    createdEmployees.add(Long.parseLong(two));
    String date = LocalDate.now(clock).toString();
    var task =
        call(
            "POST",
            "/duties",
            """
            {"name":"ゴミ出し","description":"金曜の収集","anchorDate":"%s","intervalCount":1,
             "intervalUnit":"WEEK","strategy":"CUSTOM","assigneeCount":1,"memberIds":[%s,%s]}
            """
                .formatted(date, one, two));
    assertThat(task.statusCode()).isEqualTo(201);
    createdDuty = Long.parseLong(field(task.body(), "id"));
    String id = field(task.body(), "id"), query = "?from=" + date + "&to=" + date;
    var preview = call("GET", "/duties/" + id + "/preview" + query, null);
    assertThat(preview.statusCode()).isEqualTo(200);
    assertThat(preview.body()).contains("高橋", "\"confirmed\":false");
    String token = field(preview.body(), "token");
    var confirm =
        call(
            "POST",
            "/duties/" + id + "/confirm",
            """
            {"from":"%s","to":"%s","token":"%s"}
            """
                .formatted(date, date, token));
    assertThat(confirm.statusCode()).isEqualTo(204);
    var assignments = call("GET", "/assignments" + query, null);
    assertThat(assignments.statusCode()).isEqualTo(200);
    String assignmentId = field(assignments.body(), "id");
    var change =
        call(
            "PATCH",
            "/assignments/" + assignmentId,
            """
            {"employeeId":%s,"reason":"今回のみ代理"}
            """
                .formatted(two));
    assertThat(change.statusCode()).isEqualTo(204);
    assertThat(call("GET", "/assignments/" + assignmentId + "/changes", null).body())
        .contains("高橋", "山本", "今回のみ代理");
  }

  @Test
  void draftPreviewDoesNotSaveAndConfirmationPublishesExactlyThePreview() throws Exception {
    var employee = call("POST", "/employees", "{\"employeeNumber\":\"DRAFT001\",\"name\":\"佐藤\"}");
    long employeeId = Long.parseLong(field(employee.body(), "id"));
    createdEmployees.add(employeeId);
    var second = call("POST", "/employees", "{\"employeeNumber\":\"DRAFT002\",\"name\":\"鈴木\"}");
    long secondId = Long.parseLong(field(second.body(), "id"));
    createdEmployees.add(secondId);
    String date = LocalDate.now(clock).toString();
    String end = LocalDate.now(clock).plusDays(20).toString();
    String draft =
        """
        {"duty":{"name":"作成確認テスト","description":"","anchorDate":"%s","intervalCount":1,
        "intervalUnit":"WEEK","strategy":"SHUFFLED_ROUND","assigneeCount":1,"memberIds":[%d,%d]},
        "from":"%s","to":"%s","seed":12345}
        """
            .formatted(date, employeeId, secondId, date, end);
    int before = db.queryForObject("SELECT COUNT(*) FROM duties", Integer.class);
    var preview = call("POST", "/duties/preview", draft);
    assertThat(preview.statusCode()).isEqualTo(200);
    assertThat(db.queryForObject("SELECT COUNT(*) FROM duties", Integer.class)).isEqualTo(before);
    var invalid =
        call("POST", "/duties/create-confirmed", "{\"draft\":" + draft + ",\"token\":\"stale\"}");
    assertThat(invalid.statusCode()).isEqualTo(409);
    assertThat(db.queryForObject("SELECT COUNT(*) FROM duties", Integer.class)).isEqualTo(before);
    String token = field(preview.body(), "token");
    var created =
        call(
            "POST",
            "/duties/create-confirmed",
            "{\"draft\":" + draft + ",\"token\":\"" + token + "\"}");
    assertThat(created.statusCode()).isEqualTo(201);
    createdDuty = Long.parseLong(field(created.body(), "id"));
    assertThat(
            db.queryForObject("SELECT random_seed FROM duties WHERE id=?", Long.class, createdDuty))
        .isEqualTo(12345L);
    var published =
        call("GET", "/duties/" + createdDuty + "/preview?from=" + date + "&to=" + end, null);
    // The record model differs only in the confirmed flag and token.
    assertThat(published.body().substring(published.body().indexOf("\"periods\"")))
        .isEqualTo(
            preview
                .body()
                .substring(preview.body().indexOf("\"periods\""))
                .replace("\"confirmed\":false", "\"confirmed\":true"));
    assertThat(
            db.queryForObject(
                "SELECT COUNT(*) FROM assignments WHERE duty_id=?", Integer.class, createdDuty))
        .isEqualTo(3);
  }

  @Test
  void automaticMeetingCreationSchedulingAndDateRegistrationWorkOverHttp() throws Exception {
    var response = call("POST", "/employees", "{\"employeeNumber\":\"AUTOHTTP\",\"name\":\"担当者\"}");
    long person = Long.parseLong(field(response.body(), "id"));
    createdEmployees.add(person);
    String date = LocalDate.now(clock).toString();
    String draft =
        """
        {"duty":{"name":"定例会","description":"","anchorDate":"%s","intervalCount":1,
        "intervalUnit":"MONTH","strategy":"EMPLOYEE_NUMBER","assigneeCount":1,"memberIds":[%d]},
        "schedule":{"recurrence":"EXPLICIT_DATES","rotationMode":"OCCURRENCE","weekdays":[],"everyDays":1,"monthDay":1,"monthOrdinal":1,"weekday":1},"dates":[],"seed":12345,"plannedThrough":"%s"}
        """
            .formatted(date, person, LocalDate.now(clock).plusDays(60));
    var preview = call("POST", "/automatic-duties/preview", draft);
    assertThat(preview.statusCode()).isEqualTo(200);
    assertThat(preview.body()).contains("\"start\":null");
    var activate =
        call(
            "POST",
            "/automatic-duties",
            "{\"draft\":" + draft + ",\"token\":\"" + field(preview.body(), "token") + "\"}");
    assertThat(activate.statusCode()).isEqualTo(201);
    createdDuty = Long.parseLong(field(activate.body(), "id"));
    String query =
        "{\"from\":\"" + date + "\",\"to\":\"" + LocalDate.now(clock).plusDays(60) + "\"}";
    var schedule = call("POST", "/automatic-duties/schedule", query);
    assertThat(schedule.statusCode()).isEqualTo(200);
    assertThat(schedule.body()).contains("\"date\":null", "担当者");
    String meetingDate = LocalDate.now(clock).plusDays(10).toString();
    assertThat(
            call(
                    "PUT",
                    "/automatic-duties/" + createdDuty + "/meetings/0",
                    "{\"date\":\"" + meetingDate + "\"}")
                .statusCode())
        .isEqualTo(204);
    var dated = call("POST", "/automatic-duties/schedule", query);
    assertThat(dated.statusCode()).isEqualTo(200);
    assertThat(dated.body()).contains("\"date\":\"" + meetingDate + "\"");
    var exportBody =
        "{\"from\":\""
            + date
            + "\",\"to\":\""
            + LocalDate.now(clock).plusDays(60)
            + "\",\"format\":\"MEETING\",\"includeUndated\":true}";
    var request =
        HttpRequest.newBuilder(
                URI.create(
                    "http://127.0.0.1:"
                        + port
                        + "/api/automatic-duties/"
                        + createdDuty
                        + "/export"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(exportBody))
            .build();
    var file = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
    assertThat(file.statusCode()).isEqualTo(200);
    assertThat(file.headers().firstValue("Content-Type").orElseThrow())
        .contains("spreadsheetml.sheet");
    assertThat(file.headers().firstValue("Content-Disposition").orElseThrow())
        .contains("attachment", ".xlsx");
    assertThat(file.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");
    try (var book =
        new org.apache.poi.xssf.usermodel.XSSFWorkbook(
            new java.io.ByteArrayInputStream(file.body()))) {
      assertThat(book.getSheetAt(0).getRow(9).getCell(1).getLocalDateTimeCellValue().toLocalDate())
          .isEqualTo(LocalDate.parse(meetingDate));
    }
    assertThat(
            call("POST", "/automatic-duties/" + createdDuty + "/export", "{\"format\":\"MEETING\"}")
                .statusCode())
        .isEqualTo(400);
    assertThat(call("POST", "/automatic-duties/999999999/export", exportBody).statusCode())
        .isEqualTo(404);
  }

  @Test
  void invalidRequestReturnsJapaneseValidationMessage() throws Exception {
    var response = call("POST", "/employees", "{\"employeeNumber\":\"\",\"name\":\"\"}");
    assertThat(response.statusCode()).isEqualTo(400);
    assertThat(response.body()).contains("入力内容");
  }
}
