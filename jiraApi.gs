// ---------------------------------------------------------------------------------------------------------------------------------------------------
// The MIT License (MIT)
// 
// Copyright (c) 2014 Iain Brown - http://www.littlebluemonkey.com/blog/automatically-import-jira-backlog-into-google-spreadsheet
//
// Inspired by http://gmailblog.blogspot.co.nz/2011/07/gmail-snooze-with-apps-script.html
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


// Maximum results to retrieve per api request:
var C_MAX_RESULTS = 1000;

// Called when the menu option is taken - stores project name, host name, story types and user/password
function setUpJira() {
  ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard");

  var prefix = ss.getRange(3, 1).getValue();
  PropertiesService.getUserProperties().setProperty("prefix", prefix.toUpperCase());

  var host = "montrose.atlassian.net"
  PropertiesService.getUserProperties().setProperty("host", host);

  var startDate = ss.getRange(3, 2).getDisplayValue();
  PropertiesService.getUserProperties().setProperty("startDate", startDate);

  var endDate = ss.getRange(3, 3).getDisplayValue();
  PropertiesService.getUserProperties().setProperty("endDate", endDate);
  
  var jiraUsername = ss.getRange(6, 1).getDisplayValue(); 
  var jiraPassword = Browser.inputBox("Enter your JIRA password (Note: This will be base64 Encoded and saved as a property on the spreadsheet)", "password", Browser.Buttons.OK_CANCEL);
   
  //encoded credentials in username:password format
  var x = Utilities.base64Encode(jiraUsername + ":" + jiraPassword);
  PropertiesService.getUserProperties().setProperty("jiraCredentials", "Basic " + x);

  var tempoAuthToken = "MiZqAs47rf9qwsimyQFgSgwrTQnbOI"
  PropertiesService.getUserProperties().setProperty("tempoCredentials", "Bearer " + tempoAuthToken);
}


// Function to return all the field definitions for the project in a key/value pair
function getWorklogs() {
  return JSON.parse(getWorklogsDataForAPI());
}

// function that actually makes the http request
function getWorklogsDataForAPI() {
  var project = PropertiesService.getUserProperties().getProperty("prefix");
  var startDate = PropertiesService.getUserProperties().getProperty("startDate");
  var endDate = PropertiesService.getUserProperties().getProperty("endDate");
  var tempoURL = "https://api.tempo.io/2/worklogs/project/" + project + "?from=" + startDate + "&to=" + endDate + "&limit=" + C_MAX_RESULTS;
  var tempoToken = PropertiesService.getUserProperties().getProperty("tempoCredentials");

  var headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "method": "GET",
    "headers": { "Authorization": tempoToken },
    "muteHttpExceptions": true
  };

  return getDataForApi(tempoURL, headers);
}

function getIssues(worklogs) {
  var issues = {}

  for (var i = 0; i < worklogs.results.length; i++) {
    if (!issues.hasOwnProperty(worklogs.results[i].issue.key)) {
      var issue = JSON.parse(getIssue(worklogs.results[i].issue.self));
      issues[worklogs.results[i].issue.key] = issue;
    }

  }
  return issues;
}

function getIssue(url) {
  var jiraToken = PropertiesService.getUserProperties().getProperty("jiraCredentials");

  var headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "method": "GET",
    "headers": { "Authorization": jiraToken },
    "muteHttpExceptions": true
  };

  return getDataForApi(url, headers);
}

function getDataForApi(url, headers) {
  var resp = UrlFetchApp.fetch(url, headers);
  if (resp.getResponseCode() != 200) {
    Browser.msgBox("Error retrieving data for url" + url + ":" + resp.getContentText());
    return "";
  }
  else {
    return resp.getContentText();
  }
}


function importWorklogs(includeLoggedHours) {
  var worklogs = getWorklogs();
  var issues = getIssues(worklogs);

  if (worklogs === "") {
    Browser.msgBox("Error pulling data from Jira - aborting now.");
    return;
  }

  var processedWorklogs = getProcessedWorklogs(worklogs, issues, includeLoggedHours);
  clearAndPopulateWorklogsSheet(processedWorklogs, includeLoggedHours);
}

function clearAndPopulateWorklogsSheet(processedWorklogs, includeLoggedHours) {
  ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Processed Data");
  var headers = [['Full Name', 'Project Name', 'Billable Hours', 'Rate', 'Value', 'Ticket']];
  if (includeLoggedHours) {
    headers = [['Full Name', 'Project Name', 'Billable Hours', 'Logged Hours', 'Rate', 'Value', 'Write Off', 'Ticket']];
  }
  ss.clear();
  ss.getRange(1, 1, 1, headers[0].length).setValues(headers);
  if (processedWorklogs.length > 0) {
    ss.getRange(2, 1, processedWorklogs.length, processedWorklogs[0].length).setValues(processedWorklogs);
    ss.getRange(2, 1, processedWorklogs.length, processedWorklogs[0].length).setNumberFormat("0.00");
  }
}


function getRateByUser(username) {
  var rates = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Rates");
  var values = rates.getDataRange().getValues();

  for (var i = 0; i < values.length; i++) {
    if (values[i][1] === username) {
      return values[i][2];
    }
  }
  return "";
}


function getProcessedWorklogs(worklogs, issues,  includeLoggedHours) {
  var processedWorklogs = new Array();
  for (i = 0; i < worklogs.results.length; i++) {
    processedWorklogs.push(getProcessedWorklog(worklogs.results[i], issues[worklogs.results[i].issue.key], i, includeLoggedHours));
  }
  return processedWorklogs;
}


function getProcessedWorklog(data, issue, worklogNum, includeLoggedHours) {
  var rowNum = worklogNum + 2;
  var billableHours = data.billableSeconds / 3600;
  var loggedHours = data.timeSpentSeconds / 3600;
  var rate = getRateByUser(data.author.displayName);
  var worklog = [];

  worklog.push(data.author.displayName);
  worklog.push(issue.fields.project.name);
  worklog.push(billableHours);
  if (includeLoggedHours) { worklog.push(loggedHours); }
  worklog.push(rate);
  worklog.push(rate != "" ? billableHours * rate : "");
  if (includeLoggedHours) { worklog.push((loggedHours - billableHours) * rate); }
  worklog.push(data.issue.key + " : " + issue.fields.summary);

  return worklog;
}
