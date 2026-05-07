const API_ROOT = process.env.REACT_APP_API_URL || "";

async function parseResponse(response) {
  if (response.ok) {
    return response.json();
  }

  let message = "Request failed.";

  try {
    const data = await response.json();
    message = data.detail || message;
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
