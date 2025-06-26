import React, { useEffect } from "react";
import { BASE_URL } from "./lib/baseUrl";

const VAPID_PUBLIC_KEY = "BDs2YmG0xLakKCCZgi7I2PJI-vtchE4PL_InPDAj9s4Sv23oUp0x4Qh7x-w9hk14f4S6W8FXMauQkBxwSJ9nh2c"; // From your .env, copied into frontend

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const PushNotifications: React.FC = () => {
  useEffect(() => {
    async function subscribeToPush() {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });

          await fetch(`${BASE_URL}subscribe`, {
            method: "POST",
            body: JSON.stringify(subscription),
            headers: { "Content-Type": "application/json" },
          });

          console.log("✅ Push subscription sent to server");
        } catch (error) {
          console.error("❌ Failed to subscribe", error);
        }
      }
    }

    subscribeToPush();
  }, []);

  return null; // No UI, purely functional
};

export default PushNotifications;