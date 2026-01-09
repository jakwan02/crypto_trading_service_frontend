type GoogleCredentialResponse = {
  credential: string;
};

type GooglePromptMomentNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services";
let scriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;

function getClientId(): string {
  return String(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
}

function ensureScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services is not available on the server."));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed to load.")));
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function requestGoogleIdToken(): Promise<string> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing.");
  }

  await ensureScript();

  const google = window.google?.accounts?.id;
  if (!google) {
    throw new Error("Google Identity Services is not available.");
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    if (initializedClientId !== clientId) {
      initializedClientId = clientId;
    }

    google.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response?.credential) return;
        resolved = true;
        resolve(response.credential);
      }
    });

    google.prompt((notification) => {
      if (resolved) return;
      if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
        const reason =
          notification.getNotDisplayedReason?.() ||
          notification.getSkippedReason?.() ||
          notification.getDismissedReason?.() ||
          "Google login was cancelled.";
        reject(new Error(reason));
      }
    });
  });
}
