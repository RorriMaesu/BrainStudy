export async function POST(req: Request) {
  try {
    const { model } = await req.json();
    const defaultHost = "http://127.0.0.1:11434";

    const ollamaResponse = await fetch(`${defaultHost}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: true }),
    });

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      return new Response(`Ollama pull error (${ollamaResponse.status}): ${errText}`, {
        status: ollamaResponse.status,
      });
    }

    return new Response(ollamaResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return new Response(`Failed to communicate with local Ollama service: ${err.message}`, {
      status: 503,
    });
  }
}
