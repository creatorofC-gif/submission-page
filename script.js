const form = document.getElementById("submission-form");
const teamNameInput = document.getElementById("teamName");
const fileInput = document.getElementById("submissionFile");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");
const submissionTarget = document.getElementById("submissionTarget");

let pendingSubmission = false;
let submissionTimeoutId = null;
let messageReceived = false;
const SUBMISSION_LIMIT_MESSAGE = "This team has already reached the maximum of 3 submissions.";

function setMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = "form-message";

  if (type) {
    formMessage.classList.add(`is-${type}`);
  }
}

function setLoadingState(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("is-loading", isLoading);
}

function normalizeServerMessage(message) {
  const normalizedMessage = String(message || "").trim();

  if (normalizedMessage === SUBMISSION_LIMIT_MESSAGE) {
    return SUBMISSION_LIMIT_MESSAGE;
  }

  return normalizedMessage;
}

function clearHiddenPayloadFields() {
  form.querySelectorAll("[data-payload-field='true']").forEach((field) => field.remove());
}

function appendHiddenField(name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  input.dataset.payloadField = "true";
  form.appendChild(input);
}

function finishSubmission(message, type) {
  pendingSubmission = false;
  messageReceived = false;
  window.clearTimeout(submissionTimeoutId);
  submissionTimeoutId = null;
  clearHiddenPayloadFields();
  setLoadingState(false);
  setMessage(message, type);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result);
      const [, base64Content = ""] = result.split(",");

      resolve(base64Content);
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected file."));
    };

    reader.readAsDataURL(file);
  });
}

async function submitForm(event) {
  event.preventDefault();

  const teamName = teamNameInput.value.trim();
  const file = fileInput.files[0];
  const endpoint = window.APPS_SCRIPT_URL;

  if (!teamName) {
    setMessage("Please enter your team name.", "error");
    teamNameInput.focus();
    return;
  }

  if (!file) {
    setMessage("Please choose a file to upload.", "error");
    fileInput.focus();
    return;
  }

  if (!endpoint || endpoint.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE")) {
    setMessage("Set your Google Apps Script Web App URL before submitting.", "error");
    return;
  }

  try {
    setLoadingState(true);
    setMessage("Uploading submission...");

    const base64File = await fileToBase64(file);
    clearHiddenPayloadFields();
    appendHiddenField("teamName", teamName);
    appendHiddenField("fileName", file.name);
    appendHiddenField("mimeType", file.type || "application/octet-stream");
    appendHiddenField("fileData", base64File);
    appendHiddenField("responseMode", "iframe");

    form.method = "POST";
    form.action = endpoint;
    form.target = submissionTarget.name;

    pendingSubmission = true;
    messageReceived = false;
    submissionTimeoutId = window.setTimeout(() => {
      if (pendingSubmission) {
        finishSubmission("Submission timed out. Check your Apps Script deployment access and try again.", "error");
      }
    }, 30000);

    form.submit();
  } catch (error) {
    finishSubmission(error.message || "Something went wrong while submitting.", "error");
  }
}

window.addEventListener("message", (event) => {
  const data = event.data;

  if (!data || data.type !== "submission-result") {
    return;
  }

  if (!pendingSubmission) {
    return;
  }

  messageReceived = true;

  if (data.success) {
    form.reset();
    finishSubmission("Submission Successful", "success");
    return;
  }

  finishSubmission(
    normalizeServerMessage(data.message) || "Submission failed. Please try again.",
    "error"
  );
});

submissionTarget.addEventListener("load", () => {
  if (!pendingSubmission) {
    return;
  }

  window.setTimeout(() => {
    if (pendingSubmission && !messageReceived) {
      finishSubmission("Submission could not be confirmed. Please check your Apps Script deployment and try again.", "error");
    }
  }, 3000);
});

form.addEventListener("submit", submitForm);
