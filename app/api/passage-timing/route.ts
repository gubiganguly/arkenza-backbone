import { NextResponse } from 'next/server';
import { userModel } from '@/lib/firebase/users/userModel';

export async function POST(request: Request) {
  try {
    const { userId, startTime, endTime } = await request.json();
    
    if (!userId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await userModel.getById(userId);
    if (!user || !user.passageHistory || user.passageHistory.length === 0) {
      return NextResponse.json(
        { error: "No passage history found" },
        { status: 404 }
      );
    }

    // Update the latest passage's timing information
    const updatedPassageHistory = [...user.passageHistory];
    const lastPassage = updatedPassageHistory[updatedPassageHistory.length - 1];
    
    updatedPassageHistory[updatedPassageHistory.length - 1] = {
      ...lastPassage,
      endTime: new Date(endTime),
      timeSpentMs: new Date(endTime).getTime() - new Date(startTime).getTime()
    };

    await userModel.update(userId, {
      passageHistory: updatedPassageHistory
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 