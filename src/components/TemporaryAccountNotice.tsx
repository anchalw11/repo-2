import React from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface TemporaryAccountNoticeProps {
  isVisible: boolean;
  onClose: () => void;
}

const TemporaryAccountNotice: React.FC<TemporaryAccountNoticeProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-600/90 backdrop-blur-sm border border-yellow-500 rounded-lg p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <WifiOff className="w-5 h-5 text-yellow-200 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-yellow-100 mb-1">
            Temporary Account Created
          </h4>
          <p className="text-xs text-yellow-200 mb-2">
            Backend temporarily unavailable. Your account will be synced when connection is restored.
          </p>
          <button
            onClick={onClose}
            className="text-xs text-yellow-100 hover:text-white underline"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemporaryAccountNotice;
