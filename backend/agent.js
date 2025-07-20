// import Groq from "groq-sdk";
// import readline from "node:readline/promises";
// const expenseDB = [];
// const incomeDB = [];

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// async function callAgent() {

//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   const messages = [
//     {
//       role: "system",
//       content: `You are Renil, a smart and friendly personal finance assistant. Your role is to help users manage and understand their expenses by answering questions, calculating totals, analyzing spending patterns, and providing suggestions when needed. Today's date is ${new Date().toUTCString()}. Be concise, accurate, and helpful in your responses.`,
//     },
//   ];

//   while(true){
//     const question = await rl.question("USER: ");

//     if(question === "exit"){
//       break;
//     }

//     messages.push({ role: "user", content: question });

//     while(true){
//       const completion = await groq.chat.completions.create({
//         messages: messages,
//         model: "llama-3.3-70b-versatile",
//         tools: [
//           {
//             type: "function",
//             function: {
//               name: "getTotalExpense",
//               description: "Calculates the total expense",
//               parameters: {
//                 type: "object",
//                 properties: {
//                   from: {
//                     type: "string",
//                     description: "Start date of the expense range",
//                   },
//                   to: {
//                     type: "string",
//                     description: "End date of the expense range",
//                   },
//                 },
//                 required: ["from", "to"],
//               },
//             },
//           },
//           {
//             type: "function",
//             function: {
//               name: "addExpense",
//               description: "Add new Expense entry to the expense",
//               parameters: {
//                 type: "object",
//                 properties: {
//                   name: {
//                     type: "string",
//                     description: "name of the expense. e.g. Groceries, Transportation, etc.",
//                   },
//                   amount: {
//                     type: "string",
//                     description: "Amount of the expense in INR",
//                   },
//                 },
//                 required: ["name", "amount"],
//               },
//             },
//           },
//           {
//             type: "function",
//             function: {
//               name: "addIncome",
//               description: "Add new income entry to ncome database",
//               parameters: {
//                 type: "object",
//                 properties: {
//                   name: {
//                     type: "string",
//                     description: "name of the income. e.g. got 10000 salary ",
//                   },
//                   amount: {
//                     type: "string",
//                     description: "Amount of the income in INR",
//                   },
//                 },
//                 required: ["name", "amount"],
//               },
//             },
//           },
//           {
//             type: "function",
//             function: {
//               name: "getMoneyBalance",
//               description: "get remaing money balance",
//             },
//           },
//         ],
//       });
    
//       messages.push(completion.choices[0].message);
    
//       const toolCalls = completion.choices[0].message.tool_calls;
//       if (!toolCalls) {
//         console.log(`Assistant: ${completion.choices[0].message.content}`);
//         break;
//       }
    
//       for (const tool of toolCalls) {
//         const functionName = tool.function.name;
//         const functionArgs = tool.function.arguments;
    
//         let result = "";
//         if (functionName === "getTotalExpense") {
//           result = getTotalExpense(JSON.parse(functionArgs));
//         } else if (functionName === "addExpense") {
//           result = addExpense(JSON.parse(functionArgs));
//         } else if (functionName === "addIncome") {
//           result = addIncome(JSON.parse(functionArgs));
//         } else if (functionName === "getMoneyBalance") {
//           result = getMoneyBalance();
//         }
    
//         messages.push({
//           role: "tool",
//           content: result,
//           tool_call_id: tool.id,
//         });
//       }
//     }
//   }
//   rl.close();
// }
// callAgent();

// function getTotalExpense({ from, to }) {
//   const expense = expenseDB.reduce((acc, expense) => acc + Number(expense.amount), 0);
//   return `${expense}`;
// }

// function addExpense({name, amount}){
//   expenseDB.push({name: name, amount: amount});
//   return "Added to DB";
// }

// function addIncome({name, amount}){
//   incomeDB.push({name: name, amount: amount});
//   return "Added to DB";
// }

// function getMoneyBalance(){
//   const totalIncome = incomeDB.reduce((acc, income) => acc + Number(income.amount), 0);
//   const totalExpense = expenseDB.reduce((acc, expense) => acc + Number(expense.amount), 0);
//   const balance = totalIncome - totalExpense;
//   return `${balance}`;
// }



// server.js
import express from "express";
import cors from "cors";
import { Groq } from "groq-sdk";

const app = express();
const port = 5050;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// In-memory DB
let expenseDB = [];
let incomeDB = [];

// Helper to parse amounts like "10k" or "₹2,000"
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

// function getMoneyBalance() {
//   const income = incomeDB.reduce((acc, i) => acc + parseAmount(i.amount), 0);
//   const expense = expenseDB.reduce((acc, e) => acc + parseAmount(e.amount), 0);
//   return `${income - expense}`;
// }

// Express middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// System prompt (persistent for every session)
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
        // {
        //   type: "function",
        //   function: {
        //     name: "getMoneyBalance",
        //     description: "Get remaining money balance",
        //     parameters: { type: "object", properties: {} },
        //   },
        // },
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
        // case "getMoneyBalance":
        //   result = getMoneyBalance();
        //   break;
      }

      toolResponses.push({
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      });
    }

    res.json({
      response: reply.content,
      messages: [...userMessages, reply],
      toolResponses,
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
