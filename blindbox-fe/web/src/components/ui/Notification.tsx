import React, { useEffect } from "react";

interface NotificationProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = "info",
  onClose,
}) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  let bg = "bg-blue-100 text-blue-800 border-blue-200";
  if (type === "error") bg = "bg-error-50 text-error-700 border-error-200";
  if (type === "success") bg = "bg-green-50 text-green-700 border-green-200";

  return (
    <div className={`border px-4 py-3 rounded-md mb-4 ${bg}`}>{message}</div>
  );
};

export default Notification;
