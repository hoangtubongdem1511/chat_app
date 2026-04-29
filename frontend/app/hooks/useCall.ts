'use client';

import { useEffect, useState } from "react";
import { pusherClient } from "@/app/libs/pusher";
import { CallType } from "@/app/types/call";

const useCall = (conversationId: string) => {
  const [incomingCall, setIncomingCall] = useState<CallType | null>(null);
  const [activeCall, setActiveCall] = useState<CallType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!conversationId) return;
    
    // Subscribe to conversation channel for call events
    pusherClient.subscribe(conversationId);
    
    const incomingCallHandler = (call: CallType) => {
      console.log('Incoming call received:', call);
      setIncomingCall(call);
    };
    
    const callAcceptedHandler = (call: CallType) => {
      console.log('Call accepted:', call);
      setIncomingCall(null);
      setActiveCall(call);
    };
    
    const callEndedHandler = (call: CallType) => {
      console.log('Call ended:', call);
      setIncomingCall(null);
      setActiveCall(null);
    };
    
    const callRejectedHandler = (call: CallType) => {
      console.log('Call rejected:', call);
      setIncomingCall(null);
      setActiveCall(null);
    };
    
    // Bind event handlers
    pusherClient.bind('call:incoming', incomingCallHandler);
    pusherClient.bind('call:accepted', callAcceptedHandler);
    pusherClient.bind('call:ended', callEndedHandler);
    pusherClient.bind('call:rejected', callRejectedHandler);
    
    return () => {
      pusherClient.unsubscribe(conversationId);
      pusherClient.unbind('call:incoming', incomingCallHandler);
      pusherClient.unbind('call:accepted', callAcceptedHandler);
      pusherClient.unbind('call:ended', callEndedHandler);
      pusherClient.unbind('call:rejected', callRejectedHandler);
    };
  }, [conversationId]);
  
  const clearIncomingCall = () => {
    setIncomingCall(null);
  };
  
  const clearActiveCall = () => {
    setActiveCall(null);
  };
  
  return {
    incomingCall,
    activeCall,
    isLoading,
    setIsLoading,
    setIncomingCall,
    setActiveCall,
    clearIncomingCall,
    clearActiveCall
  };
};

export default useCall;
