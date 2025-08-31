'use client';

import { HiPhone, HiVideoCamera } from "react-icons/hi2";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ApiError {
  response?: {
    status?: number;
    data?: unknown;
  };
}

interface CallButtonProps {
  conversationId: string;
  type: 'video' | 'voice';
  disabled?: boolean;
  className?: string;
}

const CallButton: React.FC<CallButtonProps> = ({ 
  conversationId, 
  type, 
  disabled = false,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleCall = async () => {
    try {
      setIsLoading(true);
      
      const response = await axios.post('/api/calls', {
        conversationId,
        type: type.toUpperCase()
      });
      
      // Navigate to call interface
      router.push(`/calls/${response.data.id}`);
      
      toast.success(`${type === 'video' ? 'Video' : 'Voice'} call initiated`);
    } catch (error: unknown) {
      console.error('Call creation failed:', error);
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 409) {
        // Ask user if they want to cleanup old calls
        if (confirm('There\'s already an active call in this conversation. Do you want to end it and start a new call?')) {
          try {
            await axios.post('/api/calls/cleanup', { conversationId });
            toast.success('Old calls cleaned up. Please try again.');
            // Retry the call creation
            setTimeout(() => {
              handleCall();
            }, 1000);
          } catch {
            toast.error('Failed to cleanup old calls');
          }
        }
      } else if (apiError.response?.status === 403) {
        toast.error('You are not authorized for this conversation');
      } else {
        toast.error('Failed to start call. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const Icon = type === 'video' ? HiVideoCamera : HiPhone;
  
  const getButtonStyles = () => {
    const baseStyles = "rounded-full p-2 transition-all duration-200 flex items-center justify-center";
    
    if (type === 'video') {
      return `${baseStyles} bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
      }`;
    } else {
      return `${baseStyles} bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
      }`;
    }
  };
  
  return (
    <button
      onClick={handleCall}
      disabled={disabled || isLoading}
      className={`${getButtonStyles()} ${className}`}
      title={`Start ${type} call`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon size={20} />
      )}
    </button>
  );
};

export default CallButton;
