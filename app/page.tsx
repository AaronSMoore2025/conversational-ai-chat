// app/page.tsx

"use client"; //marking the file as a client componenet

import { useState } from "react";
import ReactMarkdown from "react-markdown"

type Message = { role: "user" | "assistant"; content: string}; // define the shape of the message

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");

  async function handleSend() {
    //guards. bails out on empty whitespace message or if a response is already streaming. preventing double submits
    if (!input.trim() || isStreaming) return;

    //new array with the user message appended
    const newMessages: Message[] = [...messages, {role: "user", content: input}];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingText("");
    
    //send message to fetch, not message state to avoid React trap. setMessages is async so messages wont be updated yet on the next line
    //using the local newMessages variable guarantees Ollama receives the message the user just typed
    const response = await fetch ("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const reader = response.body!.getReader(); //grabs stream reader off the respnse
    const decoder = new TextDecoder(); //TextDecoder keeps internal state to handle multi-byte characters that get split across reads
    let buffer = ""; //carry-over buffer of partial reads
    let assistantText = ""; //local accumulator for reply... full string built in here

    while (true) {
      const { value, done } = await reader.read(); //pulls next clup of bytes
      if (done) break; //reader signaling the stream is closed

      buffer += decoder.decode(value, { stream: true }); //appending most recent chunk of bytes and appending to buffer
      const lines = buffer.split("\n"); //split everything accumulated on new lines. Each new line is a complet JSON object
      buffer = lines.pop() ?? ""; //removes and returns the last element of lines and puts it back into buffer. Getting rid of the maybe partial tail in buffer so that it waits for the next lines
      
      // itreate the guaranteed completed lines
      for (const line of lines) {
        if (!line.trim()) continue; //empty line guard
        const paresd = JSON.parse(line); //JSON to object
        const token = paresd.message?.content ?? "";

        //appending the token to the accumulator, then push the whole accumulated string into state. Bubble grows by one token... live typwriter effect
        assistantText += token;
        setStreamingText(assistantText);
      }
    }
    //commit the finished reply to history
    setMessages((prev) => [...prev, { role: "assistant", content: assistantText}]); //assistantText holds the finished reply. commits it into messages, clear Streaming test, drop is streaming. CLEANUP
    setStreamingText("");
    setIsStreaming(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((m, i) => (
          <div 
            key={i}
            className={m.role === "user" ? "text-right" : "text-left"}
          >
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

        {isStreaming && (
          <div className="text-left">
            <span className="inline-block px-3 py-2 rounded-lg bg-gray-200 text-gray-900">
              <ReactMarkdown>{streamingText}</ReactMarkdown>
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isStreaming}
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          disabled={isStreaming}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}