import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenant = request.headers.get('X-Tenant') || '2009_bu02';

  const numericId = parseInt(id);
  if (!id || id === 'undefined' || id === 'null' || isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ success: false, error: `ID BL invalide: ${id}` }, { status: 400 });
  }
  const validId = String(numericId);

  const backendUrl = process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api`
    : 'http://localhost:3005/api';

  try {
    const response = await fetch(`${backendUrl}/pdf/delivery-note-small/${validId}`, {
      headers: { 'X-Tenant': tenant, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.warn(`[pdf/delivery-note-small] Backend ${response.status}, redirect to print page`);
      return NextResponse.redirect(new URL(`/print/bl/${validId}?tenant=${tenant}&size=small`, request.url));
    }

    const pdfBuffer = await response.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="bl_reduit_${validId}.pdf"`,
        'Cache-Control': 'no-cache',
      }
    });
  } catch {
    console.warn(`[pdf/delivery-note-small] Backend inaccessible, redirect to /print/bl/${validId}`);
    return NextResponse.redirect(new URL(`/print/bl/${validId}?tenant=${tenant}&size=small`, request.url));
  }
}
