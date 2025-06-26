import API from "@/lib/axios";

const VAPID_PUBLIC_KEY = "BDs2YmG0xLakKCCZgi7I2PJI-vtchE4PL_InPDAj9s4Sv23oUp0x4Qh7x-w9hk14f4S6W8FXMauQkBxwSJ9nh2c"; 

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function registerPush(userId: string): Promise<void> {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      await API.post('api/save-subscription', {
        userId,
        subscription
      });
      

      console.log("✅ Push subscription saved to backend.");
    } catch (err) {
      console.error("🔴 Push registration error:", err);
    }
  } else {
    console.warn('Push notifications not supported in this browser');
  }
}
