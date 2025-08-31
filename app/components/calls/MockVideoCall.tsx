'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface MockVideoCallProps {
  callId: string;
  roomName: string;
}

const MockVideoCall: React.FC<MockVideoCallProps> = ({ callId, roomName }) => {
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  const handleConnect = () => {
    setIsConnected(true);
    toast.success('Connected to mock call!');
  };

  const handleEndCall = async () => {
    try {
      await fetch(`/api/calls/${callId}/end`, { method: 'POST' });
      toast.success('Call ended');
      router.push('/conversations');
    } catch (error) {
      console.error('End call failed:', error);
      toast.error('Failed to end call');
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Mock Video Call</span>
          <span className="text-xs text-gray-300">Room: {roomName}</span>
        </div>
        <button
          onClick={handleEndCall}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-sm"
        >
          End Call
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white">
          {!isConnected ? (
            <div>
              <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">📹</span>
              </div>
              <h2 className="text-xl font-semibold mb-4">Mock Video Call</h2>
              <p className="text-gray-300 mb-6">This is a mock interface for testing</p>
              <button
                onClick={handleConnect}
                className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg"
              >
                Connect to Call
              </button>
            </div>
          ) : (
            <div>
              <div className="w-32 h-32 bg-green-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-xl font-semibold mb-4">Connected!</h2>
              <p className="text-gray-300">Mock video call is active</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/50 flex justify-center gap-4">
        <button className="bg-white/20 hover:bg-white/30 p-3 rounded-full text-white">
          🎤
        </button>
        <button className="bg-white/20 hover:bg-white/30 p-3 rounded-full text-white">
          📹
        </button>
        <button className="bg-white/20 hover:bg-white/30 p-3 rounded-full text-white">
          🖥️
        </button>
        <button
          onClick={handleEndCall}
          className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white"
        >
          📞
        </button>
      </div>
    </div>
  );
};

export default MockVideoCall;
