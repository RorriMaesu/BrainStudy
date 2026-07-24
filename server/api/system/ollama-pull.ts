export async function handleOllamaPullRequest(req: Request): Promise<Response> {
  try {
    const { model } = (await req.json()) as { model?: string };
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Failed to communicate with local Ollama service: ${message}`, {
      status: 503,
    });
  }
}
