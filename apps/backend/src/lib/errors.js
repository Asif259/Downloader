export function classifyBackendError(error, fallbackMessage = "Request failed") {
  const message = String(error?.message || fallbackMessage);
  const lower = message.toLowerCase();

  if (message.includes("spawn yt-dlp ENOENT")) {
    return {
      code: "YTDLP_NOT_FOUND",
      status: 500,
      userMessage: "yt-dlp is unavailable on the backend runtime.",
      message,
    };
  }

  if (message.includes("Sign in to confirm you’re not a bot") || message.includes("Sign in to confirm you're not a bot")) {
    return {
      code: "YOUTUBE_BOT_CHALLENGE",
      status: 502,
      userMessage: "YouTube requires authenticated cookies for this request on the backend.",
      message,
    };
  }

  if (message.includes("Requested format is not available")) {
    return {
      code: "FORMAT_UNAVAILABLE",
      status: 409,
      userMessage: "Selected format is unavailable. Retry with Best Available.",
      message,
    };
  }

  if (
    lower.includes("unsupported url") ||
    lower.includes("http error 404") ||
    lower.includes("unable to download webpage: http error 404") ||
    lower.includes("no video formats found")
  ) {
    return {
      code: "MEDIA_UNAVAILABLE",
      status: 422,
      userMessage: "Media URL is invalid, unavailable, or unsupported.",
      message,
    };
  }

  if (lower.includes("timed out") || lower.includes("timeout") || lower.includes("econnreset") || lower.includes("fetch failed")) {
    return {
      code: "UPSTREAM_TIMEOUT",
      status: 504,
      userMessage: "Upstream service timed out. Please retry in a moment.",
      message,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    status: 500,
    userMessage: fallbackMessage,
    message,
  };
}
