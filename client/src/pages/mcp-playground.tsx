import React, { useState } from "react";

export default function MCPPlayground() {
  const [prompt, setPrompt] = useState("");
  const [module, setModule] = useState("auto");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, module: module === "auto" ? undefined : module }),
      });
      const data = await res.json();
      if (data.success) {
        setResponse(data.output);
      } else {
        setResponse(data.error || "Request failed");
      }
    } catch (err: any) {
      setResponse(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">MCP Playground</h1>
      <textarea
        className="w-full border p-2"
        rows={6}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
      />
      <div className="flex items-center gap-2">
        <select
          className="border p-2"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          <option value="auto">Auto</option>
          <option value="openai">OpenAI</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={sendRequest}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
      {response && (
        <div className="border p-2 whitespace-pre-wrap">
          <strong>Response:</strong> {response}
        </div>
      )}
    </div>
  );
}
