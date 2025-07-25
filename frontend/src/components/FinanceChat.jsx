import { useState } from "react";

export default function FinanceChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Define the function BEFORE it's used in JSX
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5050/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      // ✅ Defensive check: make sure data.response exists
      const assistantMessage = data.response
        ? { role: "assistant", content: data.response }
        : { role: "assistant", content: "Something went wrong." };

      const toolResponses = data.toolResponses || [];

      setMessages((prev) => [...prev, assistantMessage, ...toolResponses]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen text-white">
      <h1 className="text-xl font-bold mb-4 pt-5 text-center">
        💰 Finance Assistant
      </h1>

      {/* Chat Area */}
      <div className="bg-gray-800 p-4 rounded-lg h-80 overflow-y-auto space-y-4 border border-gray-700 shadow-inner">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 text-sm text-left rounded-xl shadow ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-700 text-white rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left text-gray-400 italic">
            Assistant is typing...
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 shadow-md focus-within:ring-2 focus-within:ring-blue-500">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-grow text-sm bg-transparent outline-none placeholder-gray-400 text-white"
          placeholder="Ask something like 'add expense 500 for food'"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );
}
