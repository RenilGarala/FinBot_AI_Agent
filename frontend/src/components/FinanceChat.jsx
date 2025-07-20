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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">💰 Finance Assistant</h1>
      <div className="bg-gray-100 p-4 rounded h-80 overflow-y-scroll mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <strong>{msg.role?.toUpperCase()}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div className="text-gray-500 italic">Assistant is typing...</div>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-grow p-2 border rounded"
          placeholder="Ask something like 'add expense 500 for food'"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
