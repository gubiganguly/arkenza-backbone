import { NextResponse } from 'next/server';
import { getWordFrequency } from '@/app/utils/wordFrequency';

export async function POST(request: Request) {
  try {
    const { word } = await request.json();
    
    if (!word) {
      return NextResponse.json(
        { error: "Word is required" },
        { status: 400 }
      );
    }

    const frequency = getWordFrequency(word);

    return NextResponse.json({ frequency }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 