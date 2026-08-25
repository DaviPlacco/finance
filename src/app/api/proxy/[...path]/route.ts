import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleProxy(req: NextRequest, pathArray: string[]) {
  const path = pathArray.join('/');
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  const targetUrl = `${API_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;
  
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  const headers = new Headers();
  
  const incomingContentType = req.headers.get('content-type');
  if (incomingContentType) {
    headers.set('content-type', incomingContentType);
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      return new NextResponse(text, { 
        status: response.status,
        headers: { 'Content-Type': contentType || 'text/plain' }
      });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Gateway Timeout / Backend indisponível',
      details: error instanceof Error ? error.message : String(error)
    }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return handleProxy(req, resolvedParams.path);
}
