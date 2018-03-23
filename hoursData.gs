function createHoursData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Processed Data");
  var rows = [
    {
      "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Full Name'),
      "showTotals": true,
      "sortOrder": "ASCENDING",
    }
  ]
  var values = [{
    "summarizeFunction": "SUM",
    "name": "Billable Hours",
    "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Billable Hours')
  }]
  
  return { 'rows': rows, 'values': values }
}
