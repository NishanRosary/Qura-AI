const API_ROOT = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (response.ok) {
    if (isJson) {
      return response.json();
    }

    const text = await response.text();
    throw new Error(
      text.startsWith("<!DOCTYPE")
        ? "Backend returned HTML instead of JSON. Make sure the API is running on port 8000."
        : "Backend returned an unexpected response."
    );
  }

  let message = "Request failed.";

  try {
    if (isJson) {
      const data = await response.json();
      message = data.detail || message;
    } else {
      const text = await response.text();
      message = text.startsWith("<!DOCTYPE")
        ? "Backend is unavailable or the frontend is pointing to the wrong server."
        : response.statusText || message;
    }
  } catch (error) {
    message = response.statusText || message;
  }

  throw new Error(message);
}

export async function fetchDocuments() {
  const response = await fetch(`${API_ROOT}/api/documents`);
  return parseResponse(response);
}

export async function uploadDocuments(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_ROOT}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
}

export async function queryDocuments(question) {
  const response = await fetch(`${API_ROOT}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return parseResponse(response);
}

export async function clearDocuments() {
  const response = await fetch(`${API_ROOT}/api/documents`, {
    method: "DELETE",
  });

  return parseResponse(response);
}
