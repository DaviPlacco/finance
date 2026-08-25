import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    
    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      (await cookies()).set({
        name: 'token',
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      return NextResponse.json({ success: true, ...data });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('ERRO NO LOGIN (BFF):', error);
    return NextResponse.json({ 
      error: 'Erro no servidor de autenticação',
      detalhe: error?.message || String(error),
      apiUrl: API_URL
    }, { status: 500 });
  }
}
