"use client";

import { useEffect, useRef } from "react";

interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cloudflare-turnstile";

function loadScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const existing = document.getElementById(SCRIPT_ID);
    const script =
      existing ??
      Object.assign(document.createElement("script"), {
        id: SCRIPT_ID,
        src: SCRIPT_URL,
        async: true,
      });
    script.addEventListener("load", () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      }
    });
    script.addEventListener("error", () => {
      reject(new Error("The spam check could not be loaded."));
    });
    if (!existing) {
      document.head.append(script);
    }
  });
}

interface TurnstileProps {
  /** The public site key. Without one (local development) nothing is shown and no token is needed. */
  siteKey: string | undefined;
  onToken: (token: string | undefined) => void;
  /** Change this number to ask for a new check, for example after a failed submit (a token works once). */
  resetKey: number;
}

/** Cloudflare Turnstile, the spam check. The token it gives is sent with the form and verified on the server. */
export function Turnstile({ siteKey, onToken, resetKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const container = containerRef.current;
    if (!siteKey || !container) {
      return;
    }
    let isCancelled = false;
    void loadScript().then((turnstile) => {
      if (isCancelled) {
        return;
      }
      widgetId.current = turnstile.render(container, {
        sitekey: siteKey,
        callback: (token) => {
          onTokenRef.current(token);
        },
        "expired-callback": () => {
          onTokenRef.current(undefined);
        },
        "error-callback": () => {
          onTokenRef.current(undefined);
        },
      });
    });
    return () => {
      isCancelled = true;
      if (widgetId.current) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = undefined;
      }
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current) {
      onTokenRef.current(undefined);
      window.turnstile?.reset(widgetId.current);
    }
  }, [resetKey]);

  return siteKey ? <div ref={containerRef} aria-label="Spam check" /> : null;
}
