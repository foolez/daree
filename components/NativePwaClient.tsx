"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Hides the native Capacitor splash when the web app has finished its first load
 * and registers the PWA service worker in production.
 */
export function NativePwaClient() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

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
