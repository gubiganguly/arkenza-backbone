import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'TTS service is not properly configured' }, 
        { status: 500 }
      );
    }

    // Default voice ID - you can make this configurable if needed
    const voiceId = "EXAVITQu4vr4xnSDxMaL";
    
    console.log('Making request to Eleven Labs API');
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        }),
      }
    );

    console.log('Eleven Labs response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Failed to generate speech';
      let errorDetails = '';
      
      try {
        const errorJson = await response.json();
        console.error('Eleven Labs error response:', errorJson);
        
        // Extract the actual error details
        if (errorJson.detail) {
          if (typeof errorJson.detail === 'object') {
            errorMessage = errorJson.detail.message || errorMessage;
            errorDetails = JSON.stringify(errorJson);
          } else {
            errorMessage = errorJson.detail;
            errorDetails = JSON.stringify(errorJson);
          }
        }
      } catch (e) {
        // If not JSON, get the text response
        const errorText = await response.text();
        console.error('Eleven Labs error response (text):', errorText);
        errorDetails = errorText;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          status: response.status
        }, 
        { status: response.status }
      );
    }

    // Get audio data
    const audioArrayBuffer = await response.arrayBuffer();
    console.log('Successfully received audio data, size:', audioArrayBuffer.byteLength);
    
    return new NextResponse(audioArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioArrayBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('Error in Eleven Labs TTS API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}