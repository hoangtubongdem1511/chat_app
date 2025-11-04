import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { conversationId, type } = await request.json();
    
    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    if (!conversationId || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Validate call type
    if (!['VIDEO', 'VOICE'].includes(type)) {
      return new NextResponse("Invalid call type", { status: 400 });
    }
    
    // Check if conversation exists and user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: true
      }
    });
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }
    
    const isUserInConversation = conversation.users.some(
      user => user.id === currentUser.id
    );
    
    if (!isUserInConversation) {
      return new NextResponse("Not authorized for this conversation", { status: 403 });
    }
    
    // Check if there's already an active call in this conversation
    const activeCall = await prisma.call.findFirst({
      where: {
        conversationId,
        status: {
          in: ['INCOMING', 'ONGOING']
        }
      }
    });
    
    if (activeCall) {
      return new NextResponse("There's already an active call in this conversation", { status: 409 });
    }
    
    // Generate unique room name
    const roomName = `call_${conversationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create call record
    const call = await prisma.call.create({
      data: {
        roomName,
        type,
        status: 'INCOMING',
        conversationId,
        callerId: currentUser.id,
        participants: {
          create: {
            userId: currentUser.id,
            role: 'CALLER'
          }
        }
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
    
    // Notify other users in conversation
    conversation.users.forEach((user) => {
      if (user.id !== currentUser.id && user.email) {
        pusherServer.trigger(user.email, 'call:incoming', {
          ...call,
          conversation: call.conversation
        });
      }
    });
    
    return NextResponse.json(call);
  } catch (error) {
    console.error('CREATE_CALL_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    
    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }
    
    const calls = await prisma.call.findMany({
      where: {
        conversationId,
        OR: [
          { callerId: currentUser.id },
          { participants: { some: { userId: currentUser.id } } }
        ]
      },
      include: {
        caller: true,
        participants: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 20 // Limit to last 20 calls
    });
    
    return NextResponse.json(calls);
  } catch (error) {
    console.error('GET_CALLS_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
