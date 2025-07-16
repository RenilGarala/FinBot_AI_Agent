import Groq from "groq-sdk";
import readline from "node:readline/promises";
const expenseDB = [];
const incomeDB = [];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `You are Renil, a smart and friendly personal finance assistant. Your role is to help users manage and understand their expenses by answering questions, calculating totals, analyzing spending patterns, and providing suggestions when needed. Today's date is ${new Date().toUTCString()}. Be concise, accurate, and helpful in your responses.`,
    },
  ];

  while(true){
    const question = await rl.question("USER: ");

    if(question === "exit"){
      break;
    }

    messages.push({ role: "user", content: question });

    while(true){
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        tools: [
          {
            type: "function",
            function: {
              name: "getTotalExpense",
              description: "Calculates the total expense",
              parameters: {
                type: "object",
                properties: {
                  from: {
                    type: "string",
                    description: "Start date of the expense range",
                  },
                  to: {
                    type: "string",
                    description: "End date of the expense range",
                  },
                },
                required: ["from", "to"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addExpense",
              description: "Add new Expense entry to the expense",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "name of the expense. e.g. Groceries, Transportation, etc.",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the expense in INR",
                  },
                },
                required: ["name", "amount"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addIncome",
              description: "Add new income entry to ncome database",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "name of the income. e.g. got 10000 salary ",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the income in INR",
                  },
                },
                required: ["name", "amount"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getMoneyBalance",
              description: "get remaing money balance",
            },
          },
        ],
      });
    
      messages.push(completion.choices[0].message);
    
      const toolCalls = completion.choices[0].message.tool_calls;
      if (!toolCalls) {
        console.log(`Assistant: ${completion.choices[0].message.content}`);
        break;
      }
    
      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functionArgs = tool.function.arguments;
    
        let result = "";
        if (functionName === "getTotalExpense") {
          result = getTotalExpense(JSON.parse(functionArgs));
        } else if (functionName === "addExpense") {
          result = addExpense(JSON.parse(functionArgs));
        } else if (functionName === "addIncome") {
          result = addIncome(JSON.parse(functionArgs));
        } else if (functionName === "getMoneyBalance") {
          result = getMoneyBalance();
        }
    
        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tool.id,
        });
      }
    }
  }
  rl.close();
}
callAgent();

function getTotalExpense({ from, to }) {
  const expense = expenseDB.reduce((acc, expense) => acc + Number(expense.amount), 0);
  return `${expense}`;
}

function addExpense({name, amount}){
  expenseDB.push({name: name, amount: amount});
  return "Added to DB";
}

function addIncome({name, amount}){
  incomeDB.push({name: name, amount: amount});
  return "Added to DB";
}

function getMoneyBalance(){
  const totalIncome = incomeDB.reduce((acc, income) => acc + Number(income.amount), 0);
  const totalExpense = expenseDB.reduce((acc, expense) => acc + Number(expense.amount), 0);
  const balance = totalIncome - totalExpense;
  return `${balance}`;
}