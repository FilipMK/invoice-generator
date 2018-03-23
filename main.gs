function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries = [{ name: "Fetch only billable hours", functionName: "runBillable" },{ name: "Fetch billable and logged hours", functionName: "runBillableAndLogged" }];
  ss.addMenu("JIRA", menuEntries);
}

function runBillable(){
 run(false); 
}

function runBillableAndLogged(){
 run(true); 
}

function run(shouldIncludeLogged) {
  setUpJira();
  importWorklogs(shouldIncludeLogged);
  updatePivotTables(shouldIncludeLogged);
  formatDocument();
  exportSheetsForClient();
  Browser.msgBox("Reports generated");
}

function formatDocument(){
  formatColumnsAsDollars("Processed Data", ["Rate", "Value", "Write Off"]);
  formatColumnsAsDollars("Invoice", ["Rates", "Total Payable"]);
  formatColumnsAsDollars("Ticket Prices", ["Hourly Rate", "Total Payable", "Written Off"]);
  formatColumnsAsDollars("Project Code Split", ["Total Payable"]);
}

function updatePivotTables(shouldIncludeLogged){
  updatePivotTable("Invoice", createInvoiceData());
  updatePivotTable("Hours", createHoursData());
  updatePivotTable("Ticket Prices", createTicketPricesData(shouldIncludeLogged));
  updatePivotTable("Project Code Split", createProjectCodeSplitData());
}

function formatColumnsAsDollars(sheetName, columns){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  columns.forEach(function(column){
    var columnIndex = getColumnIndexByName(sheet, column);
    if(columnIndex >= 0){
      var range = sheet.getRange(1, getColumnIndexByName(sheet, column) + 1, sheet.getLastRow(), 1);
      range.setNumberFormat("$#,##0.00;$(#,##0.00)"); 
    }
  });
}

function exportSheetsForClient(){
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var file = DriveApp.getFileById(ss.getId());
  var parentId = file.getParents().next().getId();
  
  var name = PropertiesService.getUserProperties().getProperty("prefix") + '_' + PropertiesService.getUserProperties().getProperty("startDate") + '_' + PropertiesService.getUserProperties().getProperty("endDate")
  var folderId = parentId
  var resource = {
    title: name,
    mimeType: MimeType.GOOGLE_SHEETS,
    parents: [{ id: folderId }]
  }
  var fileJson = Drive.Files.insert(resource)
  var fileId = fileJson.id
  
  var newSp = SpreadsheetApp.openById(fileId);
  var sheets = ss.getSheets();
  
  for(var i = 5; i < sheets.length; i++){
    var newSheet = newSp.insertSheet(sheets[i].getName());
    var range = sheets[i].getDataRange();
    var values = range.getValues();
    var numberFormats = range.getNumberFormats();
    var backgrounds = range.getBackgrounds();
    var fontColors = range.getFontColors();
    var fontWeights = range.getFontWeights()
    newSheet.getRange(1, 1, values.length, values[0].length).setValues(values).setNumberFormats(numberFormats)
    .setBackgrounds(backgrounds)
    .setFontColors(fontColors)
    .setFontWeights(fontWeights)
    .setBorder(true, true, true, true, true, true);
    newSheet.autoResizeColumns(1, newSheet.getLastColumn());
    //copyTo(newSp).setName(sheets[i].getName());
  }
  newSp.deleteSheet(newSp.getSheetByName("Sheet1"));
}

function getColumnIndexByName(sheet, colName) {
  var data = sheet.getDataRange().getValues();
  var col = data[0].indexOf(colName);
  return col;
}