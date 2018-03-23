function createInvoiceData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Processed Data");
  var rows = [];
  var values = [];
  rows = [{
    "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Full Name'),
    "showTotals": true,
    "sortOrder": "ASCENDING",
  }];

  values = [
    {
      "summarizeFunction": "SUM",
      "name": "Billable Hours",
      "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Billable Hours')
    },
    {
      "summarizeFunction": "AVERAGE",
      "name": 'Rates',
      "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Rate')
    },
    {
      "summarizeFunction": "SUM",
      "name": "Total Payable",
      "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Value')
    }
  ]

  return { 'rows': rows, 'values': values }
}
