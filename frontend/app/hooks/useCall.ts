'use client';

import { useEffect, useState } from "react";
import getSocket from "@/app/libs/socket";
import { CallType } from "@/app/types/call";

const useCall = (conversationId: string) => {
  const [incomingCall, setIncomingCall] = useState<CallType | null>(null);
  const [activeCall, setActiveCall] = useState<CallType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!conversationId) return;

    // Note: we intentionally do NOT join/leave the conv:<id> room here.
    // Call events are fanned out via `emitToUser` (per-user rooms) on the
    // backend, and joining/leaving the conv room from this hook would tear
    // down the room subscription that <Body /> relies on for messages:new
    // when the user ends a call without leaving the chat.
    const socket = getSocket();

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

    socket.on('call:incoming', incomingCallHandler);
    socket.on('call:accepted', callAcceptedHandler);
    socket.on('call:ended', callEndedHandler);
    socket.on('call:rejected', callRejectedHandler);

    return () => {
      socket.off('call:incoming', incomingCallHandler);
      socket.off('call:accepted', callAcceptedHandler);
      socket.off('call:ended', callEndedHandler);
      socket.off('call:rejected', callRejectedHandler);
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
