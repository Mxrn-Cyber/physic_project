import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's own "Sign in with Google" button via Google Identity
 * Services. Renders nothing until VITE_GOOGLE_CLIENT_ID is configured, so
 * the rest of the auth pages work fine before Google sign-in is set up.
 */
export default function GoogleAuthButton({ onCredential, text = "continue_with" }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;

    let cancelled = false;
    let pollId = null;

    function render() {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 320,
        text,
      });
    }

    if (window.google?.accounts?.id) {
      render();
    } else {
      pollId = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(pollId);
          render();
        }
      }, 200);
      setTimeout(() => pollId && clearInterval(pollId), 10000);
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
    };
  }, [onCredential, text]);

  if (!CLIENT_ID) return null;

  return <div ref={buttonRef} className="flex justify-center" />;
}
