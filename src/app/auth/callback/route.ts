import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/serverClient';

const popupHtmlResponse = ({
  origin,
  ok,
  error,
}: {
  origin: string;
  ok: boolean;
  error?: string;
}) => {
  const payload = JSON.stringify({
    type: 'qchat:oauth',
    ok,
    error: error || null,
  });

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Qchat Login</title>
  </head>
  <body style="font-family: sans-serif; padding: 16px;">
    <p>${ok ? 'Login successful. You can close this window.' : 'Login failed. You can close this window.'}</p>
    <script>
      (function () {
        var payload = ${payload};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, ${JSON.stringify(origin)});
          }
        } catch (_) {}
        window.close();
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const authError = requestUrl.searchParams.get('error_description');
  const isPopupFlow = requestUrl.searchParams.get('popup') === '1';
  const appOrigin = requestUrl.origin;

  if (authError) {
    if (isPopupFlow) {
      return popupHtmlResponse({
        origin: appOrigin,
        ok: false,
        error: authError,
      });
    }
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', authError);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    if (isPopupFlow) {
      return popupHtmlResponse({
        origin: appOrigin,
        ok: false,
        error: 'Missing OAuth code',
      });
    }
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'Missing OAuth code');
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (isPopupFlow) {
      return popupHtmlResponse({
        origin: appOrigin,
        ok: false,
        error: error.message,
      });
    }
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', error.message);
    return NextResponse.redirect(loginUrl);
  }

  if (isPopupFlow) {
    return popupHtmlResponse({
      origin: appOrigin,
      ok: true,
    });
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
