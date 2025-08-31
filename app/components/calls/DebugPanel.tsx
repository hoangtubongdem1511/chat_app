'use client';

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface DebugPanelProps {
  conversationId: string;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ conversationId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkActiveCalls = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/calls/check-active?conversationId=${conversationId}`);
      setDebugInfo(response.data);
      toast.success(`Found ${response.data.count} active calls`);
    } catch (error) {
      console.error('Check active calls failed:', error);
      toast.error('Failed to check active calls');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupCalls = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/calls/cleanup', { conversationId });
      setDebugInfo(response.data);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Failed to cleanup calls');
    } finally {
      setIsLoading(false);
    }
  };

  const debugAllCalls = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/calls/debug');
      setDebugInfo(response.data);
      toast.success(`Found ${response.data.totalCalls} total calls`);
    } catch (error) {
      console.error('Debug failed:', error);
      toast.error('Failed to debug calls');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mb-4">
      <h3 className="text-lg font-semibold mb-4">Debug Panel</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={checkActiveCalls}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Check Active Calls
        </button>
        
        <button
          onClick={cleanupCalls}
          disabled={isLoading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          Cleanup Calls
        </button>
        
        <button
          onClick={debugAllCalls}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Debug All Calls
        </button>
      </div>
      
      {debugInfo && (
        <div className="bg-white p-4 rounded border">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
