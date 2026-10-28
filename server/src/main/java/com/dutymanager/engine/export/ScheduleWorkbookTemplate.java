package com.dutymanager.engine.export;

import com.dutymanager.model.export.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;

/** Shared typography, metadata, cell styles and print settings for both export layouts. */
public final class ScheduleWorkbookTemplate {
  public static final int HEADER = 8, FIRST_DATA = 9;
  private final XSSFWorkbook book;

  private record TableLayout(int header, int columns, boolean compact) {}

  private final Map<Sheet, TableLayout> tables = new IdentityHashMap<>();
  private final CellStyle title, caption, header, body, alternate, holiday, pending, notice;
  private final Map<CellStyle, CellStyle> dateStyles = new IdentityHashMap<>();

  public ScheduleWorkbookTemplate(XSSFWorkbook book) {
    this.book = book;
    body = style("FFFFFF", "27313C", 10, false);
    alternate = style("F5F6F7", "27313C", 10, false);
    holiday = style("ECEEF0", "68717C", 10, false);
    pending = style("FFF4D8", "665021", 10, false);
    title = style("FFFFFF", "20252B", 20, true);
    caption = style("FFFFFF", "68717C", 10, false);
    header = style("303740", "FFFFFF", 10, true);
    notice = style("FFF4D8", "665021", 10, false);
  }

  private CellStyle style(String background, String foreground, int size, boolean bold) {
    var font = book.createFont();
    font.setFontName("Yu Gothic");
    font.setFontHeightInPoints((short) size);
    font.setBold(bold);
    font.setColor(color(foreground));
    var s = book.createCellStyle();
    s.setFont(font);
    s.setFillForegroundColor(color(background));
    s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    s.setVerticalAlignment(VerticalAlignment.CENTER);
    s.setWrapText(true);
    s.setIndention((short) 1);
    s.setBorderBottom(BorderStyle.HAIR);
    s.setBottomBorderColor(color("DFE3E7"));
    return s;
  }

  private XSSFColor color(String rgb) {
    return new XSSFColor(java.util.HexFormat.of().parseHex(rgb), new DefaultIndexedColorMap());
  }

  public Sheet sheet(
      ScheduleExport data, String name, String kind, String[] headings, int[] widths) {
    var sheet = book.createSheet(name);
    boolean compact = data.format() == ExportFormat.PERIOD && name.equals("期間別担当表");
    int headerIndex = compact ? 5 : HEADER;
    tables.put(sheet, new TableLayout(headerIndex, headings.length, compact));
    sheet.setDisplayGridlines(false);
    sheet.setPrintGridlines(false);
    sheet.setDefaultRowHeightInPoints(27);
    for (int i = 0; i < widths.length; i++) sheet.setColumnWidth(i, widths[i] * 256);
    if (compact) {
      merged(sheet, 0, data.config().duty().name(), title, 42);
      merged(
          sheet,
          1,
          data.from().getYear()
              + "年"
              + (data.from().getYear() == data.to().getYear()
                  ? ""
                  : "～" + data.to().getYear() + "年"),
          caption,
          24);
      merged(
          sheet, 2, "対象期間  " + ScheduleExportRows.periodRange(data.from(), data.to()), caption, 24);
      merged(sheet, 3, "実施日  " + ScheduleExportRows.rule(data.config().schedule()), caption, 24);
      if (!data.notices().isEmpty())
        merged(
            sheet,
            4,
            String.join("\n", data.notices()),
            notice,
            Math.max(26, data.notices().size() * 18));
    } else {
      merged(sheet, 0, "DUTY SCHEDULE  /  " + kind, caption, 22);
      merged(sheet, 1, data.config().duty().name(), title, 38);
      merged(sheet, 2, kind, caption, 23);
      merged(
          sheet,
          3,
          "対象期間  "
              + ScheduleExportRows.date(data.from())
              + " ～ "
              + ScheduleExportRows.date(data.to()),
          caption,
          24);
      merged(sheet, 4, "実施ルール  " + ScheduleExportRows.rule(data.config().schedule()), caption, 25);
      merged(
          sheet,
          5,
          "出力  "
              + data.generatedAt().format(DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm"))
              + "（日本時間）  ·  保存済みの担当予定",
          caption,
          23);
      merged(
          sheet,
          6,
          data.notices().isEmpty()
              ? "休業日は実施しません。表示する日付は対象期間内の実施日です。"
              : String.join("\n", data.notices()),
          data.notices().isEmpty() ? caption : notice,
          Math.max(26, data.notices().size() * 18));
    }
    var row = sheet.createRow(headerIndex);
    row.setHeightInPoints(29);
    for (int i = 0; i < headings.length; i++) cell(row, i, headings[i], header);
    sheet.createFreezePane(0, headerIndex + 1);
    sheet.setRepeatingRows(new CellRangeAddress(compact ? 0 : headerIndex, headerIndex, -1, -1));
    sheet.setFitToPage(true);
    sheet.setHorizontallyCenter(true);
    var print = sheet.getPrintSetup();
    print.setPaperSize(PrintSetup.A4_PAPERSIZE);
    print.setLandscape(data.format() == ExportFormat.PERIOD && !compact);
    print.setFitWidth((short) 1);
    print.setFitHeight((short) 0);
    sheet.setMargin(Sheet.LeftMargin, 0.3);
    sheet.setMargin(Sheet.RightMargin, 0.3);
    sheet.setMargin(Sheet.TopMargin, 0.45);
    sheet.setMargin(Sheet.BottomMargin, 0.45);
    sheet.getFooter().setLeft("当番表");
    sheet.getFooter().setRight("&P / &N");
    return sheet;
  }

  public void finish(Sheet sheet, int last) {
    var table = tables.get(sheet);
    if (!table.compact())
      sheet.setAutoFilter(
          new CellRangeAddress(
              table.header(), Math.max(table.header(), last), 0, table.columns() - 1));
    book.setPrintArea(
        book.getSheetIndex(sheet), 0, table.columns() - 1, 0, Math.max(firstData(sheet), last));
  }

  private void merged(Sheet sheet, int index, String text, CellStyle style, float height) {
    var row = sheet.createRow(index);
    row.setHeightInPoints(height);
    int columns = tables.get(sheet).columns();
    for (int i = 0; i < columns; i++) cell(row, i, i == 0 ? text : "", style);
    sheet.addMergedRegion(new CellRangeAddress(index, index, 0, columns - 1));
  }

  public int firstData(Sheet sheet) {
    return tables.get(sheet).header() + 1;
  }

  public void year(Sheet sheet, int index, int year) {
    merged(sheet, index, year + "年", caption, 26);
  }

  public CellStyle rowStyle(int index, boolean off, boolean undecided) {
    return off ? holiday : undecided ? pending : index % 2 == 0 ? body : alternate;
  }

  public void cell(Row row, int index, Object value, CellStyle style) {
    var cell = row.createCell(index);
    cell.setCellStyle(style);
    if (value instanceof Number n) cell.setCellValue(n.doubleValue());
    else if (value instanceof java.time.LocalDate date) {
      cell.setCellValue(date);
      cell.setCellStyle(
          dateStyles.computeIfAbsent(
              style,
              s -> {
                var result = book.createCellStyle();
                result.cloneStyleFrom(s);
                result.setDataFormat(book.createDataFormat().getFormat("yyyy/mm/dd"));
                return result;
              }));
    } else {
      var text = Objects.toString(value, "");
      cell.setCellValue(text.length() > 32767 ? text.substring(0, 32767) : text);
    }
  }

  public void empty(Sheet sheet) {
    merged(sheet, firstData(sheet), "対象期間に保存済みの予定はありません。", caption, 36);
  }
}
