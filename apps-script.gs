const SHEET_NAME = "Submissions";
const DRIVE_FOLDER_ID = "179tuQ11EUxIbc5WVeSoORm2kAraxQeKm";
const SPREADSHEET_ID = "1UZe7-SMfuM8ReWnlchMLyGoAUib8E-orzJ0mkzF-tSY";
const MAX_SUBMISSIONS_PER_TEAM = 3;

function doPost(e) {
  try {
    const teamName = ((e.parameter && e.parameter.teamName) || "").trim();
    const fileName = (e.parameter && e.parameter.fileName) || "submission";
    const mimeType = (e.parameter && e.parameter.mimeType) || "application/octet-stream";
    const fileData = (e.parameter && e.parameter.fileData) || "";

    if (!teamName || !fileData) {
      return iframeResponse_({
        success: false,
        message: "Missing required fields.",
      });
    }

    const sheet = getOrCreateSheet_();
    const existingSubmissionCount = getTeamSubmissionCount_(sheet, teamName);

    if (existingSubmissionCount >= MAX_SUBMISSIONS_PER_TEAM) {
      return iframeResponse_({
        success: false,
        message: "This team has already reached the maximum of 3 submissions.",
      });
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const bytes = Utilities.base64Decode(fileData);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const uploadedFile = folder.createFile(blob);

    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    sheet.appendRow([
      new Date(),
      teamName,
      uploadedFile.getUrl(),
    ]);

    return iframeResponse_({
      success: true,
      message: "Submission stored successfully.",
      fileUrl: uploadedFile.getUrl(),
    });
  } catch (error) {
    return iframeResponse_({
      success: false,
      message: error.message,
    });
  }
}

function getOrCreateSheet_() {
  const spreadsheet = !SPREADSHEET_ID || SPREADSHEET_ID === "PASTE_YOUR_GOOGLE_SHEET_ID_HERE"
    ? SpreadsheetApp.getActiveSpreadsheet()
    : SpreadsheetApp.openById(SPREADSHEET_ID);

  if (!spreadsheet) {
    throw new Error("Spreadsheet not found. Set SPREADSHEET_ID or use a Sheet-bound Apps Script project.");
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Team Name", "File URL"]);
  }

  return sheet;
}

function getTeamSubmissionCount_(sheet, teamName) {
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return 0;
  }

  const teamNames = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const normalizedTeamName = teamName.toLowerCase();

  return teamNames.filter(function(row) {
    return String(row[0] || "").trim().toLowerCase() === normalizedTeamName;
  }).length;
}

function iframeResponse_(payload) {
  const serializedPayload = JSON.stringify({
    type: "submission-result",
    success: Boolean(payload.success),
    message: payload.message || "",
    fileUrl: payload.fileUrl || "",
  });

  return HtmlService
    .createHtmlOutput(
      '<script>' +
      'window.parent.postMessage(' + serializedPayload + ', "*");\n' +
      'window.top.postMessage(' + serializedPayload + ', "*");\n' +
      "</script>"
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
