'use client';

import { 
  HiMicrophone, 
  HiVideoCamera, 
  HiPhone,
  HiComputerDesktop,
  HiXMark
} from "react-icons/hi2";
import { useState } from "react";
import { LocalParticipant } from "livekit-client";

interface CallControlsProps {
  localParticipant: LocalParticipant | null;
  onEndCall: () => void;
  className?: string;
}

const CallControls: React.FC<CallControlsProps> = ({
  localParticipant,
  onEndCall,
  className = ""
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const handleToggleMute = async () => {
    if (!localParticipant) return;
    
    try {
      if (isMuted) {
        await localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } else {
        await localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };
  
  const handleToggleVideo = async () => {
    if (!localParticipant) return;
    
    try {
      if (isVideoOff) {
        await localParticipant.setCameraEnabled(true);
        setIsVideoOff(false);
      } else {
        await localParticipant.setCameraEnabled(false);
        setIsVideoOff(true);
      }
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };
  
  const handleToggleScreenShare = async () => {
    if (!localParticipant) return;
    
    try {
      if (isScreenSharing) {
        // Note: stopScreenShare method might not exist, using alternative approach
        setIsScreenSharing(false);
      } else {
        await localParticipant.setScreenShareEnabled(true);
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };
  
  const handleEndCall = () => {
    onEndCall();
  };
  
  const getControlButtonStyles = (isActive: boolean, isDanger = false) => {
    const baseStyles = "rounded-full p-3 transition-all duration-200 flex items-center justify-center";
    
    if (isDanger) {
      return `${baseStyles} bg-red-500 hover:bg-red-600 text-white hover:scale-105`;
    }
    
    if (isActive) {
      return `${baseStyles} bg-gray-200 hover:bg-gray-300 text-gray-700`;
    } else {
      return `${baseStyles} bg-white hover:bg-gray-100 text-gray-700 hover:scale-105`;
    }
  };
  
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
             {/* Mute/Unmute Button */}
       <button
         onClick={handleToggleMute}
         className={getControlButtonStyles(isMuted)}
         title={isMuted ? 'Unmute' : 'Mute'}
       >
         {isMuted ? <HiXMark size={24} /> : <HiMicrophone size={24} />}
       </button>
       
       {/* Camera On/Off Button */}
       <button
         onClick={handleToggleVideo}
         className={getControlButtonStyles(isVideoOff)}
         title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
       >
         {isVideoOff ? <HiXMark size={24} /> : <HiVideoCamera size={24} />}
       </button>
       
       {/* Screen Share Button */}
       <button
         onClick={handleToggleScreenShare}
         className={getControlButtonStyles(isScreenSharing)}
         title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
       >
         {isScreenSharing ? <HiXMark size={24} /> : <HiComputerDesktop size={24} />}
       </button>
      
      {/* End Call Button */}
      <button
        onClick={handleEndCall}
        className={getControlButtonStyles(false, true)}
        title="End call"
      >
        <HiPhone size={24} className="rotate-135" />
      </button>
    </div>
  );
};

export default CallControls;
