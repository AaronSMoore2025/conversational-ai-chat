# Lesson Plan — Conversational AI Chat

**Level:** Intermediate  
**Focus:** AI/LLM integration  
**Pace:** Part-time (~5–10 hrs/week)

You already understand React fundamentals. The goal of this project is to learn how to integrate LLMs into real applications — streaming, prompt design, context management, switching between providers, and eventually more advanced patterns like tool use and RAG.

Each lesson has a concept section (read/understand first) and a build task (what you add to the project). You write all the code yourself.

---

## Lesson 1 — System Prompts and Message Roles ✅ (partially done)
**Concept:** LLMs don't have memory — every request sends the full conversation from scratch. The three message roles (`system`, `user`, `assistant`) shape how the model behaves. A system prompt is the primary lever for controlling personality, tone, and constraints.

**What you'll learn:**
- How the `messages` array works and why order matters
- The difference between `system`, `user`, and `assistant` roles
- How a system prompt changes model behavior

**Build:** Add a hardcoded system prompt in `route.ts` — prepend a `{ role: "system", content: "..." }` message before forwarding to Ollama. Experiment with different prompts and watch how the model's behavior changes.

---

## Lesson 2 — Auto-Scroll and `useEffect`
**Concept:** `useEffect` runs after React renders. It's the right place for DOM side-effects like scrolling to the bottom of a chat window. You'll also learn about the dependency array — what triggers the effect to re-run.

**What you'll learn:**
- When and why to use `useEffect`
- How `useRef` targets a DOM element
- Dependency arrays (`[]` vs `[value]`)

**Build:** Add a ref to a dummy `<div>` at the bottom of the message list. Use `useEffect` to call `scrollIntoView()` whenever `messages` or `streamingText` changes.

---

## Lesson 3 — Error Handling and Loading States
**Concept:** What happens when Ollama is offline, or the model returns an error? Right now: nothing visible. Good apps surface failures clearly. You'll learn try/catch in async functions and how to model error state in React.

**What you'll learn:**
- Async error handling patterns
- Adding an `error` state alongside `isStreaming`
- How to display a useful error message to the user

**Build:** Wrap the fetch in a try/catch. Add an `error` state. Show a visible error banner when something goes wrong. Test it by stopping Ollama and sending a message.

---

## Lesson 4 — Switching to the Anthropic API
**Concept:** Ollama uses NDJSON streaming (one JSON object per line). Anthropic's API uses Server-Sent Events (SSE) — a different format. Switching providers means learning the new streaming format and using the Anthropic SDK. This is the most important lesson for AI integration.

**What you'll learn:**
- How SSE streaming differs from NDJSON
- The Anthropic Node SDK (`@anthropic-ai/sdk`)
- API keys and environment variables (`.env.local`)
- How to keep secrets on the server side (never in the browser)

**Build:** Rewrite `route.ts` to call Claude via the Anthropic SDK instead of Ollama. Update the frontend stream parser to handle the new format. Use `claude-haiku-3-5` for speed while testing.

---

## Lesson 5 — Model Switcher
**Concept:** Different models have different strengths and costs. A model switcher lets the user pick at runtime. You'll learn how to thread user-controlled config from the frontend through the API.

**What you'll learn:**
- Passing extra config in the POST body
- Controlled select inputs in React
- How to parameterize your API route

**Build:** Add a `<select>` dropdown to the UI with a few Claude model options. Include the selected model in the fetch body. Use it in `route.ts` instead of a hardcoded model name.

---

## Lesson 6 — Persistent Chat History
**Concept:** A page refresh wipes the conversation. You'll learn two approaches — `localStorage` (simple, client-side) vs. a database (server-side, shareable). For this lesson you'll use `localStorage` to understand the simpler case first.

**What you'll learn:**
- `localStorage` read/write
- Initializing React state from `localStorage`
- `useEffect` for persisting state changes

**Build:** On load, read `messages` from `localStorage`. On every change, write it back. Add a "Clear chat" button that resets both state and storage.

---

## Lesson 7 — Prompt Engineering as a First-Class Feature
**Concept:** The system prompt is the most powerful tool you have. You'll build a UI that lets the user edit it at runtime, and explore how radically different prompts change the model's behavior. This reinforces what you learned in Lesson 1 but makes it interactive.

**What you'll learn:**
- Lifting state up (system prompt lives in the parent, passed down)
- Textarea with controlled input
- How framing and instructions affect LLM output

**Build:** Add a collapsible "System prompt" panel above the chat. Default it to something useful. Let the user edit and save it. Pass it through with every request.

---

## Lesson 8 — Token Usage and Cost Awareness
**Concept:** Every token costs money (or compute). The Anthropic API returns usage metadata — input tokens, output tokens — with every response. Tracking this teaches you about context windows, cost, and why long conversations get expensive.

**What you'll learn:**
- Reading response metadata from the Anthropic SDK
- Passing extra data back from your API route alongside the streamed text
- Displaying running token counts in the UI

**Build:** Return token usage from `route.ts`. Show a small token counter in the UI that updates after each response.

---

## Lesson 9 — Tool Use (Function Calling)
**Concept:** Tool use lets the LLM request that your code runs a function and returns the result. It's how you build agents — models that can search the web, query a database, call an API. This is one of the most important patterns in modern AI apps.

**What you'll learn:**
- How the tool use message loop works (model → tool call → result → model)
- Defining tools in the Anthropic SDK
- Handling `tool_use` and `tool_result` message types

**Build:** Define a simple tool (e.g. `get_current_time` or `get_weather` with a hardcoded response). Wire up the multi-turn loop so the model can call it and continue the conversation with the result.

---

## Lesson 10 — Retrieval-Augmented Generation (RAG) — Intro
**Concept:** LLMs only know what's in their training data. RAG lets you inject your own documents into the context at query time. The simplest version: take a text file, find the relevant chunks, prepend them to the system prompt.

**What you'll learn:**
- Why RAG exists and when to use it
- Basic text chunking and keyword search
- Injecting retrieved content into the system prompt

**Build:** Load a `.txt` file on the server. On each request, do a simple keyword search to find the most relevant lines. Prepend them to the system prompt as context. Ask the model questions that only the document can answer.

---

## After Lesson 10
By the end of this plan you'll have built a real AI app from the ground up and understand the core patterns used in production: streaming, provider SDKs, tool use, prompt design, and RAG. Good next directions from there: vector databases (for proper RAG), multi-agent systems, or deploying to production.
