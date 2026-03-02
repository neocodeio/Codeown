import { useState, useEffect } from "react";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // #region agent log
      fetch('http://127.0.0.1:7640/ingest/89c68152-25b3-4fee-b263-e17685f6697b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '4181a1',
        },
        body: JSON.stringify({
          sessionId: '4181a1',
          runId: 'pre-fix',
          hypothesisId: 'H1',
          location: 'hooks/useWindowSize.ts:handleResize',
          message: 'window resized',
          data: { width: window.innerWidth, height: window.innerHeight },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
