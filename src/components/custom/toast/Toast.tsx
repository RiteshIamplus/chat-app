// components/Toast.tsx
import  { useEffect } from 'react';

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded shadow-md text-sm animate-fade-in">
      {message}
    </div>
  );
};

export default Toast;