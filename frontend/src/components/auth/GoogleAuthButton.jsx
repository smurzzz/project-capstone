import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let googleScriptPromise;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

export default function GoogleAuthButton({
  disabled = false,
  onError,
  onSuccess,
  text = "continue_with",
}) {
  const buttonRef = useRef(null);
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {

    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!clientId || disabled) {
      return undefined;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onSuccessRef.current?.(response.credential);
              return;
            }

            onErrorRef.current?.("Google did not return a sign-in credential");
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          shape: "pill",
          size: "large",
          text,
          theme: "outline",
          width: 340,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          onErrorRef.current?.("Could not load Google sign-in");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, text]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm text-gray-500"
      >
        Google sign-in is not configured
      </button>
    );
  }

  return (
    <div className="flex justify-center">
      <div
        ref={buttonRef}
        className={disabled || !ready ? "pointer-events-none opacity-60" : ""}
      />
    </div>
  );
}
