'use client';

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
} from '@livekit/components-react';
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

interface VideoCallInterfaceProps {
  callId: string;
  token: string;
}

const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  callId,
  token
}) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const handleRoomConnected = () => {
    setIsConnecting(false);
    setError(null);
  };
  
  const handleRoomDisconnected = async () => {
    try {
      await axios.post(`/api/calls/${callId}/end`);
      toast.success('Call ended');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && (status === 400 || status === 404)) {
        // Ignore benign errors when call already ended
      } else {
        console.error('End call failed:', error);
        toast.error('Failed to end call properly');
      }
    } finally {
      router.push('/conversations');
    }
  };
  
  const handleConnectionError = () => {
    setError('Failed to connect to call. Please try again.');
    setIsConnecting(false);
    toast.error('Connection failed');
  };
  
  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold mb-4">Connection Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/conversations')}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg transition-colors"
          >
            Back to Conversations
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen bg-black relative">
      <LiveKitRoom
        data-lk-theme="default"
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
        connect={true}
        onConnected={handleRoomConnected}
        onDisconnected={handleRoomDisconnected}
        onError={handleConnectionError}
      >
        <div className="h-full flex flex-col">
          <RoomStateBinder />

          <div className="flex-1 relative">
            <VideoConference />
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg">Connecting to call...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
};

const RoomStateBinder = () => {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;
    // Room is now available for any future use
  }, [room]);

  return null;
};

export default VideoCallInterface;
