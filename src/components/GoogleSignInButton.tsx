"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void | Promise<void>;
  }) => void;
  renderButton: (
    container: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
      locale?: string;
    }
  ) => void;
};

const GOOGLE_SCRIPT_ID = "google-identity-services";
let scriptPromise: Promise<void> | null = null;

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

function normalizeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Google login failed.";
}

export function GoogleSignInButton({
  onIdToken,
  onError,
  disabled,
  showInlineError = true
}: {
  onIdToken: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  showInlineError?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onIdTokenRef = useRef(onIdToken);
  const onErrorRef = useRef(onError);
  const [error, setError] = useState("");

  const clientId = useMemo(() => getClientId(), []);

  useEffect(() => {
    onIdTokenRef.current = onIdToken;
  }, [onIdToken]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!clientId) {
      const message = "NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing.";
      setError(message);
      onErrorRef.current?.(message);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await ensureScript();
        if (cancelled) return;

        const googleId = window.google?.accounts?.id as unknown as GoogleAccountsId | undefined;
        if (!googleId) {
          throw new Error("Google Identity Services is not available.");
        }

        googleId.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response?.credential) return;
            try {
              await onIdTokenRef.current(response.credential);
            } catch (err) {
              const message = normalizeErrorMessage(err);
              setError(message);
              onErrorRef.current?.(message);
            }
          }
        });

        const width = Math.floor(containerRef.current.getBoundingClientRect().width || 0);
        containerRef.current.innerHTML = "";
        // # 변경 이유: 전환율을 위해 인지성이 높은 기본 테마(blue) + Continue UX 유지
        googleId.renderButton(containerRef.current, {
          type: "standard",
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: width > 0 ? width : undefined,
          logo_alignment: "left"
        });
      } catch (err) {
        if (cancelled) return;
        const message = normalizeErrorMessage(err);
        setError(message);
        onErrorRef.current?.(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div
      aria-disabled={disabled ? "true" : undefined}
      className={disabled ? "pointer-events-none opacity-70" : undefined}
    >
      <div ref={containerRef} className="w-full" />
      {showInlineError && error ? <p className="mt-3 text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
