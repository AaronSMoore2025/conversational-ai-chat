# Conversational AI Chat

A learning project — a streaming chat UI built with Next.js, React, and a local LLM via Ollama.

## What it does

- Send messages to a local `llama3.2` model running via [Ollama](https://ollama.com)
- Replies stream in token by token (typewriter effect)
- Full conversation history is sent with each request so the model has context
- Stop button cancels a response mid-stream using `AbortController`
- Markdown in responses renders properly (bold, code blocks, lists, etc.)

## How it works

**`app/page.tsx`** — the entire frontend. A React client component that manages conversation state, sends messages to the API route, and reads the streaming response chunk by chunk using the browser's `ReadableStream` API.

**`app/api/chat/route.ts`** — a thin Next.js API route that receives the message history, forwards it to the local Ollama API with `stream: true`, and pipes the response straight back to the browser.

## Stack

- [Next.js 16](https://nextjs.org) — framework
- [React 19](https://react.dev) — UI
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- [react-markdown](https://github.com/remarkjs/react-markdown) — renders LLM markdown output
- [Ollama](https://ollama.com) — runs the LLM locally

## Getting started

1. Install and run Ollama, then pull the model:
   ```bash
   ollama pull llama3.2
   ```

2. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Concepts covered so far

- Next.js App Router and API routes
- React state (`useState`) and refs (`useRef`)
- Streaming HTTP responses with `ReadableStream` and `TextDecoder`
- NDJSON parsing (Ollama streams one JSON object per line)
- `AbortController` for cancelling in-flight requests
- Client vs. server components (`"use client"`)
