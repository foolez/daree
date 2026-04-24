"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Hides the native Capacitor splash when the web app has finished its first load.
 * Unregisters any legacy service workers and clears our caches so users never need
 * to manually clear Safari / site data after a bad deploy.
 */
export function NativePwaClient() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    void (async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        await r.unregister();
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const k of keys) {
          if (k.startsWith("daree-")) {
            await caches.delete(k);
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    void StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: "#0A0A0A" }).catch(() => {});

    const hide = () => {
      window.setTimeout(() => {
        void SplashScreen.hide({ fadeOutDuration: 280 }).catch(() => {});
      }, 80);
    };

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
    }
  }, []);

  return null;
}
