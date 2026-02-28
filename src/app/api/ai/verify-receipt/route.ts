import { NextRequest, NextResponse } from 'next/server';

// Vision AI receipt verification endpoint
// Uses OpenAI GPT-4 Vision to analyze receipt images

export async function POST(req: NextRequest) {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      // Fallback: Simple validation without AI (for development)
      return NextResponse.json({
        is_valid: true,
        confidence: 0.7,
        message: 'Receipt uploaded successfully (AI verification skipped in development)',
        details: {
          has_total: true,
          has_date: true,
          has_merchant: true,
          image_quality: 'good'
        }
      });
    }

    // Call OpenAI Vision API to analyze the receipt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a receipt verification expert. Analyze the uploaded image to determine if it is a valid receipt from a restaurant, bar, or nightclub. 
            
            Return a JSON object with:
            - is_valid: boolean (true if it appears to be a real receipt)
            - confidence: number (0-1, how confident you are)
            - message: string (brief explanation)
            - details: object with:
              - has_total: boolean (does it show a total amount)
              - has_date: boolean (does it show a date)
              - has_merchant: boolean (does it show a merchant name/business)
              - image_quality: string (good/medium/poor)
              - items_count: number (approximate number of line items)`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and verify if it is a valid receipt. Return only JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image_url
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      return NextResponse.json({
        is_valid: true,
        confidence: 0.5,
        message: 'Could not verify receipt. Please try again.',
        details: { error: 'AI service temporarily unavailable' }
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({
        is_valid: false,
        confidence: 0,
        message: 'Could not analyze the image',
        details: {}
      });
    }

    // Parse the JSON response from AI
    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json({
        is_valid: false,
        confidence: 0,
        message: 'Could not parse AI response',
        details: {}
      });
    }

    // Determine if receipt is valid based on AI analysis
    const isValidReceipt = 
      parsedResult.is_valid && 
      (parsedResult.details?.has_total || parsedResult.details?.has_merchant) &&
      parsedResult.details?.image_quality !== 'poor';

    return NextResponse.json({
      is_valid: isValidReceipt,
      confidence: parsedResult.confidence || 0.5,
      message: parsedResult.message || (isValidReceipt ? 'Receipt verified!' : 'Could not verify receipt'),
      details: parsedResult.details || {}
    });

  } catch (error) {
    console.error('Receipt verification error:', error);
    
    return NextResponse.json({
      is_valid: false,
      confidence: 0,
      message: 'An error occurred during verification',
      details: { error: 'Server error' }
    });
  }
}
