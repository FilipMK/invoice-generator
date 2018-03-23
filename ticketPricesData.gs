function createTicketPricesData(shouldIncludeLoggedHours) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Processed Data");
  var rows = [
    {
      "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Ticket'),
      "showTotals": true,
      "sortOrder": "ASCENDING",
    },
    {
      "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Full Name'),
      "showTotals": true,
      "sortOrder": "ASCENDING",
    }
  ]

  var values = [];
  if (shouldIncludeLoggedHours) {
    values = [
      {
        "summarizeFunction": "SUM",
        "name": "Bill Hours",
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Billable Hours')
      },
      {
        "summarizeFunction": "SUM",
        "name": "Tracked Hours",
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Logged Hours')
      },
      {
        "summarizeFunction": "AVERAGE",
        "name": 'Hourly Rate',
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Rate')
      },
      {
        "summarizeFunction": "SUM",
        "name": "Total Payable",
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Value')
      },
      {
        "summarizeFunction": "SUM",
        "name": "Written Off",
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Write Off')
      }
    ]
  } else {
    values = [
      {
        "summarizeFunction": "SUM",
        "name": "Bill Hours",
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Billable Hours')
      },
      {
        "summarizeFunction": "AVERAGE",
        "name": 'Hourly Rate',
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Rate')
      },
      {
        "summarizeFunction": "SUM",
        "name": "Total Payable",
        "sourceColumnOffset": getColumnIndexByName(sourceSheet, 'Value')
      },
    ]
  }
  return { 'rows': rows, 'values': values }
}

