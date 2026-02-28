import { NextRequest, NextResponse } from 'next/server';
import { getUserGamification, getLeaderboard, initializeGamification, processReferral } from '@/lib/services/gamification/gamification-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const city = searchParams.get('city');
    const leaderboard = searchParams.get('leaderboard');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user gamification profile
    if (userId) {
      const profile = await getUserGamification(userId);
      return NextResponse.json({ profile });
    }

    // Get leaderboard
    if (leaderboard === 'true') {
      const leaders = await getLeaderboard(city || undefined, limit);
      return NextResponse.json({ leaderboard: leaders });
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  } catch (error) {
    console.error('Gamification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, referralCode } = body;

    // Initialize gamification profile
    if (action === 'init') {
      const profile = await initializeGamification(userId);
      return NextResponse.json({ success: true, profile });
    }

    // Process referral
    if (action === 'referral') {
      if (!referralCode || !userId) {
        return NextResponse.json({ error: 'Missing referralCode or userId' }, { status: 400 });
      }

      const result = await processReferral(referralCode, userId);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Gamification POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
