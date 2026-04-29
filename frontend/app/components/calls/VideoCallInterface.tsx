'use client';

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useRouter } from "next/navigation";
import apiClient from "@/app/lib/api-client";
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
      await apiClient.post(`/calls/${callId}/end`);
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
    // Attach debug listeners for camera publish failures & media device errors
    const onLocalTrackPublished = () => {
      console.log('[LiveKit] Local track published');
    };
    const onMediaDevicesError = (error: unknown) => {
      console.error('[LiveKit] Media devices error:', error);
    };

    room.on(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);

    // Optional: log camera permission state if supported
    try {
      const permissions: unknown = (navigator as unknown as { permissions?: unknown }).permissions;
      if (permissions && typeof permissions === 'object') {
        const perms = permissions as { query?: (arg: unknown) => Promise<unknown> };
        if (typeof perms.query === 'function') {
          perms.query({ name: 'camera' as unknown }).then((p: unknown) => {
          if (p && typeof p === 'object' && 'state' in p) {
            console.log('[Permissions] camera:', (p as { state?: string }).state);
          }
          }).catch(() => {});
        }
      }
    } catch {}

    return () => {
      room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room]);

  return null;
};

export default VideoCallInterface;
