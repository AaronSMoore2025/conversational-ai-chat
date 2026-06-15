// app/page.tsx

"use client"; // Mark this as a Client Component (it uses state and event handlers)

import { useState, useRef } from "react";

// react-markdown converts a markdown STRING into real HTML elements.
// The LLM often replies in markdown (**bold**, lists, `code`, headings), so
// without this the user would see literal asterisks and backticks. We wrap each
// message's content in <ReactMarkdown> so it renders as formatted HTML — and
// because it re-renders whenever streamingText changes, the markdown formats
// live, token by token, as the reply streams in.
import ReactMarkdown from "react-markdown";

// Shape of a single chat message.
type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]); // full conversation history (source of truth)
  const [streamingText, setStreamingText] = useState(""); // the in-progress reply being built
  const [isStreaming, setIsStreaming] = useState(false); // true while a reply is in flight
  const [input, setInput] = useState(""); // controlled value of the text box

  // Holds the active request's AbortController so Stop can reach it. A ref (not
  // state) because we grab it imperatively and changing it shouldn't re-render.
  const abortControllerRef = useRef<AbortController | null>(null);

  async function handleSend() {
    // Bail out on an empty message or if a reply is already streaming (prevents double-submits).
    if (!input.trim() || isStreaming) return;

    // Append the user's message to a NEW array. We send this local variable to
    // the fetch (not the `messages` state) because setMessages is async — the
    // state isn't updated yet on the next line, so the local copy guarantees
    // Ollama receives the message the user just typed.
    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    // Create a fresh controller per send and store it so Stop can abort this request.
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
      signal: controller.signal, // subscribes this fetch to the controller so abort() can cancel it
    });

    // Local accumulator for the full reply. Declared outside the try so the
    // finally block can still read it (e.g. to commit a partial reply on abort).
    let assistantText = "";

    try {
      const reader = response.body!.getReader(); // stream reader for the response body
      const decoder = new TextDecoder(); // decodes byte chunks to text (handles split multi-byte chars)
      let buffer = ""; // holds an incomplete trailing line until the rest of it arrives

      while (true) {
        const { value, done } = await reader.read(); // pull the next chunk of bytes
        if (done) break; // stream closed — exit the loop

        buffer += decoder.decode(value, { stream: true }); // decode and append to the buffer
        const lines = buffer.split("\n"); // each complete line is one JSON object (NDJSON)
        buffer = lines.pop() ?? ""; // last line may be partial — hold it for the next read

        // Process the guaranteed-complete lines.
        for (const line of lines) {
          if (!line.trim()) continue; // skip blank lines (JSON.parse("") would throw)
          const parsed = JSON.parse(line);
          const token = parsed.message?.content ?? "";

          // Append the token and push the whole string to state — the live typewriter effect.
          assistantText += token;
          setStreamingText(assistantText);
        }
      }
    } catch (err) {
      // Aborting throws a DOMException named "AbortError" — that's expected, so
      // swallow it. Any other error is a genuine failure and must not be hidden.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
    } finally {
      // Runs in all three outcomes — stream finished, aborted, or errored — so
      // the same reset happens no matter how the request ended.
      if (assistantText) {
        // Only commit if some text arrived: if the user hits Stop before any
        // token, assistantText is empty and we skip it, avoiding an empty bubble.
        // (This is also why assistantText is declared outside the try block.)
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      }
      setStreamingText("");
      setIsStreaming(false);
      abortControllerRef.current = null; // clear the used controller so no stale one lingers between sends
    }
  }

  // Cancels the active request; the ?. guards against there being no request in flight.
  function handleStop() {
    abortControllerRef.current?.abort();
  }

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-screen">
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </span>
          </div>
        ))}

        {/* The live, in-progress reply */}
        {isStreaming && (
          <div className="text-left">
            <span className="inline-block px-3 py-2 rounded-lg bg-gray-200 text-gray-900">
              <ReactMarkdown>{streamingText}</ReactMarkdown>
            </span>
          </div>
        )}
      </div>

      {/* Input row: text box + Send/Stop button */}
      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isStreaming}
          placeholder="Type a message..."
        />
        {isStreaming ? (
          <button
            onClick={handleStop}
            className="px-4 py-2 rounded-lg bg-red-500 text-white"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
