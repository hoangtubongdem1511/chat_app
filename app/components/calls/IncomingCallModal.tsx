'use client';

import { useState, useEffect } from "react";
import { HiPhone, HiVideoCamera, HiXMark } from "react-icons/hi2";
import Modal from "../Modal";
import Avatar from "../Avatar";
import axios from "axios";
import { useRouter } from "next/navigation";
import { CallType } from "@/app/types/call";
import toast from "react-hot-toast";

interface IncomingCallModalProps {
  call: CallType | null;
  onClose: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ 
  call, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds timeout
  const router = useRouter();
  
  // Auto-close after 30 seconds
  useEffect(() => {
    if (call) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleReject(); // Auto reject after timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [call]);
  
  const handleAccept = async () => {
    if (!call) return;
    
    try {
      setIsLoading(true);
      console.log('Accepting call:', call.id);
      
      const acceptResponse = await axios.post(`/api/calls/${call.id}/accept`);
      console.log('Accept response:', acceptResponse.data);
      
      // Navigate to call interface
      console.log('Navigating to call page:', `/calls/${call.id}`);
      router.push(`/calls/${call.id}`);
      
      toast.success('Call accepted');
    } catch (error: any) {
      console.error('Accept call failed:', error);
      
      if (error.response?.status === 400) {
        toast.error('Call is no longer available');
      } else {
        toast.error('Failed to accept call. Please try again.');
      }
      
      onClose();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async () => {
    if (!call) return;
    
    try {
      await axios.post(`/api/calls/${call.id}/reject`);
      toast.success('Call rejected');
    } catch (error: any) {
      console.error('Reject call failed:', error);
      toast.error('Failed to reject call');
    } finally {
      onClose();
    }
  };
  
  if (!call) return null;
  
  const Icon = call.type === 'VIDEO' ? HiVideoCamera : HiPhone;
  
  return (
    <Modal isOpen={!!call} onClose={onClose}>
      <div className="text-center p-8 max-w-sm mx-auto bg-white rounded-lg">
        {/* Caller Avatar */}
        <div className="mb-6">
          <Avatar user={call.caller as any} />
        </div>
        
        {/* Call Info */}
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          Incoming {call.type.toLowerCase()} call
        </h3>
        
        <p className="text-gray-600 mb-2">
          {call.caller.name || call.caller.email}
        </p>
        
        {/* Timer */}
        <p className="text-sm text-gray-500 mb-6">
          {timeLeft > 0 ? `${timeLeft}s remaining` : 'Call expired'}
        </p>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={isLoading || timeLeft === 0}
            className={`
              bg-green-500 hover:bg-green-600 text-white p-4 rounded-full 
              transition-colors duration-200 flex items-center justify-center
              ${isLoading || timeLeft === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
            `}
            title="Accept call"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon size={24} />
            )}
          </button>
          
          {/* Reject Button */}
          <button
            onClick={handleReject}
            disabled={isLoading}
            className={`
              bg-red-500 hover:bg-red-600 text-white p-4 rounded-full 
              transition-colors duration-200 flex items-center justify-center
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
            `}
            title="Reject call"
          >
            <HiXMark size={24} />
          </button>
        </div>
        
        {/* Conversation Info (if group) */}
        {call.conversation?.isGroup && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Group: {call.conversation.name || 'Unnamed group'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default IncomingCallModal;
