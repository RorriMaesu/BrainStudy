export async function POST(req: Request) {
  try {
    const body = await req.json();
    const defaultHost = "http://127.0.0.1:11434";

    const ollamaResponse = await fetch(`${defaultHost}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      return new Response(`Ollama service error (${ollamaResponse.status}): ${errorText}`, {
        status: ollamaResponse.status,
      });
    }

    // Stream response back to client
    return new Response(ollamaResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Ollama proxy chat endpoint error:", err);
    return new Response(`Failed to communicate with local Ollama service: ${err.message}`, {
      status: 503,
    });
  }
}
