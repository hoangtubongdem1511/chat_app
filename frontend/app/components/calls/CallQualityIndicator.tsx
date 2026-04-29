'use client';

import { useState, useEffect } from "react";
import { HiSignal, HiSignalSlash } from "react-icons/hi2";
import { Room } from "livekit-client";

interface CallQualityIndicatorProps {
  room: Room | null;
  className?: string;
}

const CallQualityIndicator: React.FC<CallQualityIndicatorProps> = ({
  room,
  className = ""
}) => {
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('good');
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!room) {
      setQuality('disconnected');
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const updateQuality = () => {
      const participantsMap = (room as unknown as { participants?: Map<string, unknown> })?.participants;
      const size = typeof participantsMap?.size === 'number' ? participantsMap.size : 0;
      const participantCount = size + 1;
      if (participantCount <= 2) {
        setQuality('excellent');
      } else if (participantCount <= 4) {
        setQuality('good');
      } else {
        setQuality('poor');
      }
    };

    const interval = setInterval(updateQuality, 5000);
    updateQuality();

    return () => clearInterval(interval);
  }, [room]);
  
  const getQualityStyles = () => {
    switch (quality) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-yellow-500';
      case 'poor':
        return 'text-orange-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getQualityText = () => {
    switch (quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'poor':
        return 'Poor';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {quality === 'disconnected' ? (
        <HiSignalSlash size={16} className={getQualityStyles()} />
      ) : (
        <HiSignal size={16} className={getQualityStyles()} />
      )}
      
      <span className={`text-xs font-medium ${getQualityStyles()}`}>
        {getQualityText()}
      </span>
    </div>
  );
};

export default CallQualityIndicator;
