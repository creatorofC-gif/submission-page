# Finovate X 2026 Submission Page

This project includes:

- `index.html` for the submission page markup
- `styles.css` for the FinovateX-inspired neon UI
- `script.js` for the upload flow and Apps Script integration
- `apps-script.gs` for the Google Apps Script backend

## Frontend setup

1. Open `index.html`.
2. Replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your deployed Apps Script Web App URL.
3. Host the files on any static host, or open `index.html` directly for local testing.

## Google Apps Script setup

1. Create a Google Sheet that will store submissions.
2. In the Sheet, open `Extensions` -> `Apps Script`.
3. Paste the contents of `apps-script.gs` into `Code.gs`.
4. Create or choose a Google Drive folder where uploads should be stored.
5. Replace `PASTE_YOUR_DRIVE_FOLDER_ID_HERE` in `apps-script.gs` with that folder's ID.
6. Save the project.

## Deploy Apps Script as a Web App

1. In Apps Script, click `Deploy` -> `New deployment`.
2. Choose `Web app`.
3. Set `Execute as` to `Me`.
4. Set `Who has access` to `Anyone` or `Anyone with the link`.
5. Deploy and authorize the script.
6. Copy the Web App URL and paste it into `index.html`.

## Sheet columns

The backend writes:

- `Timestamp`
- `Team Name`
- `File URL`

## Notes

- The frontend converts the selected file to base64, then posts it to Apps Script through a hidden iframe.
- This avoids the browser CORS issue that often happens with `fetch()` to Google Apps Script Web Apps.
- The Apps Script decodes the base64 payload, saves the file to Drive, and stores the file URL in Sheets.
- For larger uploads, keep Apps Script request limits in mind and prefer zipped submissions.
