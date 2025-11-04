import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get call details
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: true,
        participants: {
          include: {
            user: true
          }
        },
        conversation: {
          include: {
            users: true
          }
        }
      }
    });
    
    if (!call) {
      return new NextResponse("Call not found", { status: 404 });
    }
    
    // Check if call is in INCOMING status
    if (call.status !== 'INCOMING') {
      return new NextResponse("Call is not in incoming status", { status: 400 });
    }
    
    // Check if user is part of the conversation
    const isUserInConversation = call.conversation.users.some(
      user => user.id === currentUser.id
    );
    
    if (!isUserInConversation) {
      return new NextResponse("Not authorized for this call", { status: 403 });
    }
    
    // Check if user is not the caller
    if (call.callerId === currentUser.id) {
      return new NextResponse("Caller cannot reject their own call", { status: 400 });
    }
    
    // Update call status to REJECTED
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: 'REJECTED',
        endedAt: new Date()
      },
      include: {
        caller: true,
        participants: {
          include: {
            user: true
          }
        },
        conversation: {
          include: {
            users: true
          }
        }
      }
    });
    
    // Notify all participants about call rejection
    call.conversation.users.forEach((user) => {
      if (user.email) {
        pusherServer.trigger(user.email, 'call:rejected', updatedCall);
      }
    });
    
    return NextResponse.json(updatedCall);
  } catch (error) {
    console.error('REJECT_CALL_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
