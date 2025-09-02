import { NextRequest, NextResponse } from 'next/server';

const HELIUS_API_KEY = '099d5df1-149d-445e-b861-7269571c1804';
const HELIUS_URL = 'https://mainnet.helius-rpc.com';

export async function POST(request: NextRequest) {
  try {
    const { method, params } = await request.json();
    
    const response = await fetch(HELIUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'scope',
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Helius API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Helius' },
      { status: 500 }
    );
  }
}
