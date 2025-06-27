import { useEffect, useState } from 'react';

const IOSInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = 'standalone' in window.navigator && window.navigator.standalone;

    if (isIOS && !isInStandaloneMode) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="">
      {/* 📲 iOS users: Tap the <strong>Share</strong> icon → <strong>Add to Home Screen</strong> to install this app. */}
    </div>
  );
};

export default IOSInstallPrompt;