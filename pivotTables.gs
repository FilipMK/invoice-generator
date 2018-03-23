function updatePivotTable(pivotTableSheetName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Processed Data");
  var destinationSheet = ss.getSheetByName(pivotTableSheetName);

  destinationSheet.getDataRange().setNumberFormat("0.00");
  
  var requests = [{
    "updateCells": {
      "rows": {
        "values": [
          {
            "pivotTable": {
              "source": {
                "sheetId": sourceSheet.getSheetId(),
                "startRowIndex": 0,
                "startColumnIndex": 0,
                "endRowIndex": sourceSheet.getLastRow(),
                "endColumnIndex": sourceSheet.getLastColumn()
              },
              "rows": data.rows,
              "values": data.values,
              "valueLayout": "HORIZONTAL"
            }
          }
        ]
      },
      "start": {
        "sheetId": destinationSheet.getSheetId(),
        "rowIndex": 0,
        "columnIndex": 0
      },
      "fields": "pivotTable"
    }
  }];

  var response = Sheets.Spreadsheets.batchUpdate({'requests': requests}, ss.getId());
  // The Pivot table will appear anchored to cell A50 of the destination sheet.
}