import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { conversationId } = await request.json();

    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }

    // End all active calls in this conversation
    const updatedCalls = await prisma.call.updateMany({
      where: {
        conversationId,
        status: {
          in: ['INCOMING', 'ONGOING']
        }
      },
      data: {
        status: 'CANCELLED',
        endedAt: new Date()
      }
    });

    return NextResponse.json({
      message: `Cleaned up ${updatedCalls.count} active calls`,
      updatedCount: updatedCalls.count
    });

  } catch (error) {
    console.error('CLEANUP_CALLS_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
