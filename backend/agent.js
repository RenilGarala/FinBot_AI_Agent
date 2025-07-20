import express from "express";
import cors from "cors";
import { Groq } from "groq-sdk";

const app = express();
const port = 5050;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let expenseDB = [];
let incomeDB = [];

function parseAmount(value) {
  if (typeof value !== "string") return 0;
  const clean = value.toLowerCase().replace(/[^0-9.k]/g, "");
  if (clean.includes("k")) return parseFloat(clean.replace("k", "")) * 1000;
  return parseFloat(clean);
}

// Core tool functions
function getTotalExpense({ from, to }) {
  const total = expenseDB.reduce((acc, e) => acc + parseAmount(e.amount), 0);
  return `${total}`;
}

function addExpense({ name, amount }) {
  const parsed = parseAmount(amount);
  expenseDB.push({ name, amount: parsed });
  return `✅ Expense "${name}" of ₹${parsed} added.`;
}

function addIncome({ name, amount }) {
  const parsed = parseAmount(amount);
  incomeDB.push({ name, amount: parsed });
  return `✅ Income "${name}" of ₹${parsed} added.`;
}

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

const systemMessage = {
  role: "system",
  content: `You are FinanceGPT, a smart and friendly personal finance assistant. 
Your role is to help users manage and understand their expenses by answering questions, 
calculating totals, analyzing spending patterns, and providing suggestions when needed. 
Today's date is ${new Date().toUTCString()}. Be concise, accurate, and helpful.`,
};

app.post("/api/chat", async (req, res) => {
  const userMessages = req.body.messages || [];
  const fullMessages = [systemMessage, ...userMessages];

  try {
    const completion = await groq.chat.completions.create({
      messages: fullMessages,
      model: "llama3-70b-8192",
      tools: [
        {
          type: "function",
          function: {
            name: "getTotalExpense",
            description: "Calculates the total expense",
            parameters: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
              },
              required: ["from", "to"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "addExpense",
            description: "Add new Expense entry to the database",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                amount: { type: "string" },
              },
              required: ["name", "amount"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "addIncome",
            description: "Add new income entry to the database",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                amount: { type: "string" },
              },
              required: ["name", "amount"],
            },
          },
        },
      ],
    });

    const reply = completion.choices[0].message;
    const toolCalls = reply.tool_calls;

    if (!toolCalls) {
      return res.json({
        response: reply.content,
        messages: [...userMessages, reply],
      });
    }

    const toolResponses = [];
    const updatedMessages = [...userMessages, reply];

    for (const tool of toolCalls) {
      const fnName = tool.function.name;
      const args = JSON.parse(tool.function.arguments);

      let result = "";
      switch (fnName) {
        case "getTotalExpense":
          result = getTotalExpense(args);
          break;
        case "addExpense":
          result = addExpense(args);
          break;
        case "addIncome":
          result = addIncome(args);
          break;
      }

      const toolResponse = {
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      };
      toolResponses.push(toolResponse);
      updatedMessages.push(toolResponse);
    }

    const finalCompletion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [systemMessage, ...updatedMessages],
    });

    const finalReply = finalCompletion.choices[0].message;

    res.json({
      response: finalReply.content,
      messages: [...updatedMessages, finalReply],
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (_req, res) => {
  res.send("✅ AI Agent Backend is running!");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
