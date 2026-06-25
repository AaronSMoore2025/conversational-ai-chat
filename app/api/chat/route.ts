// app/api/chat/route.ts

export const runtime = "nodejs";

export async function POST(request: Request) {
    const {messages} = await request.json();

    //The system prompt: instructions that shape how the model behaves
    // lives here on the server, prepended to every request. The user never sees it
    const systemPrompt = {
        role: "system",
        content: "You are a helpful assistant. Keep your answers concise and friendly."
    };

    // Buiild the array the model actually sees: system message first, then the
    // full conversation history from the browser. The model reads top to bottom
    const messageWithSystem = [systemPrompt, ...messages];

    const ollamaResponse = await fetch("http://localhost:11434/api/chat",  {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama3.2",
            messages: messageWithSystem, // send the version WITH the system prompt
            stream: true, //critical flag. When flagged, Ollama sends back many small JSOn chunks as it generates each token
            // without it, Ollama buffers the entire answer and sends one blob at the end -- no live streaming
        }),

    });

    //Creating the readable stream. Handing the stream directly to a new response, piping Ollama's output to the browser as it arrives without buffering or re-parsing
    return new Response(ollamaResponse.body, {
        headers: { "Content-Type": "text/event-stream"}, //telling browser that this is a streaming response and shouldn't be buffered
    });
}