import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * OpenAI API Proxy - Serverless Function (Catch-all route)
 *
 * Purpose: Routes browser OpenAI API calls through serverless backend to avoid CORS restrictions
 *
 * Flow:
 * 1. Browser makes POST request to /api/openai-proxy/chat/completions (or any sub-path)
 * 2. This function forwards request to OpenAI API (server-side, no CORS)
 * 3. OpenAI streams response back
 * 4. Function pipes stream back to browser
 *
 * Security:
 * - API key comes from client (stored in localStorage)
 * - No API keys stored on server
 * - Only POST method allowed
 * - Authorization header required
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
  }

  // Extract Authorization header from client request
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  // Log proxy request (without exposing API key)
  console.log('🔄 [OPENAI PROXY] Forwarding request to OpenAI API');

  try {
    // Extract the path from the query parameter (Vercel's catch-all route)
    // req.query.path can be a string or string[] depending on Vercel's routing
    const pathParam = req.query.path;
    let subPath = '/chat/completions'; // default
    
    if (pathParam) {
      if (Array.isArray(pathParam)) {
        // If it's an array: ['chat', 'completions']
        subPath = '/' + pathParam.join('/');
      } else if (typeof pathParam === 'string') {
        // If it's a string: 'chat/completions'
        subPath = '/' + pathParam;
      }
    }

    // Build the target OpenAI URL
    const targetUrl = `https://api.openai.com/v1${subPath}`;

    console.log('🔄 [OPENAI PROXY] Path param:', pathParam, 'Type:', typeof pathParam);
    console.log('🔄 [OPENAI PROXY] Sub-path:', subPath);
    console.log('🔄 [OPENAI PROXY] Target URL:', targetUrl);

    // Forward request to actual OpenAI API
    const openaiResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(req.body),
    });

    // Get response headers
    const contentType = openaiResponse.headers.get('content-type') || 'application/json';

    // Check if response is streaming (Server-Sent Events)
    const isStreaming = contentType.includes('text/event-stream') ||
                        contentType.includes('application/x-ndjson');

    if (isStreaming && openaiResponse.body) {
      // Handle streaming response
      console.log('📡 [OPENAI PROXY] Streaming response from OpenAI');

      // Set streaming headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Pipe the stream directly to the client
      const reader = openaiResponse.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            res.end();
            break;
          }

          // Write chunk to response
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (streamError) {
        console.error('❌ [OPENAI PROXY] Stream error:', streamError);
        res.end();
      }
    } else {
      // Handle non-streaming (regular JSON) response
      console.log('📦 [OPENAI PROXY] Non-streaming response from OpenAI');

      const data = await openaiResponse.json();
      res.status(openaiResponse.status).json(data);
    }

    console.log('✅ [OPENAI PROXY] Request completed successfully');

  } catch (error) {
    console.error('❌ [OPENAI PROXY] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Proxy error',
      details: errorMessage
    });
  }
}
