'use client';

import { useState } from "react";
import CallButton from "./CallButton";
import IncomingCallModal from "./IncomingCallModal";
import { CallType } from "@/app/types/call";

const CallTestComponent = () => {
  const [testCall, setTestCall] = useState<CallType | null>(null);
  
  const createTestCall = () => {
    const mockCall: CallType = {
      id: 'test-call-id',
      roomName: 'test-room',
      type: 'VIDEO',
      status: 'INCOMING',
      startedAt: new Date(),
      conversationId: 'test-conversation',
      callerId: 'test-caller',
      caller: {
        id: 'test-caller',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      participants: [],
      conversation: {
        id: 'test-conversation',
        name: 'Test Conversation',
        isGroup: false,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        users: []
      }
    };
    
    setTestCall(mockCall);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Call Test Component</h3>
      
      <div className="space-y-4">
        {/* Test Call Buttons */}
        <div className="flex gap-2">
          <CallButton 
            conversationId="test-conversation" 
            type="voice" 
          />
          <CallButton 
            conversationId="test-conversation" 
            type="video" 
          />
        </div>
        
        {/* Test Incoming Call Modal */}
        <div>
          <button
            onClick={createTestCall}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Show Test Incoming Call
          </button>
        </div>
        
        {/* Test Modal */}
        <IncomingCallModal 
          call={testCall}
          onClose={() => setTestCall(null)}
        />
      </div>
    </div>
  );
};

export default CallTestComponent;
