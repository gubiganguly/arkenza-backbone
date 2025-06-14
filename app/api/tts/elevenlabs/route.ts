import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Add aggressive timeout to prevent Vercel function timeout issues
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 seconds to leave buffer for Vercel
    });
    
    const requestPromise = processRequest(request);
    
    return await Promise.race([requestPromise, timeoutPromise]);
  } catch (error) {
    console.error('Unexpected error in TTS API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

async function processRequest(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400 }
      );
    }

    // Limit text length more aggressively for Vercel deployment
    const maxChars = 1000; // Reduced from 2000 to prevent timeouts
    if (text.length > maxChars) {
      return NextResponse.json(
        { error: `Text too long. Maximum ${maxChars} characters allowed.` },
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
    
    console.log('Making request to Eleven Labs API with text length:', text.length);
    
    // Add timeout to the fetch request itself
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 12000); // 12 seconds for the API call
    
    let response;
    try {
      response = await fetch(
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
          signal: controller.signal
        }
      );
      
      clearTimeout(fetchTimeout);
    } catch (error) {
      clearTimeout(fetchTimeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('ElevenLabs API request timed out');
      }
      throw error;
    }

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
        try {
          const errorText = await response.text();
          console.error('Eleven Labs error response (text):', errorText);
          errorDetails = errorText;
        } catch (textError) {
          console.error('Could not parse error response:', textError);
          errorDetails = 'Unknown error format';
        }
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
    console.error('Error in processRequest:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Request timeout') {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            details: 'The speech generation request took too long. Please try with shorter text or try again later.'
          }, 
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}