import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const messages = [
    {
      role: "system",
      content: `You are Renil, a smart and friendly personal finance assistant. Your role is to help users manage and understand their expenses by answering questions, calculating totals, analyzing spending patterns, and providing suggestions when needed. Today's date is ${new Date().toUTCString()}. Be concise, accurate, and helpful in your responses.`,
    },
  ];

  messages.push({
    role: "user",
    content: "",
  });

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
      ],
    });
  
    messages.push(completion.choices[0].message);
  
    const toolCalls = completion.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log(`assistant: ${completion.choices[0].message.content}`);
      break;
    }
  
    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const functionArgs = tool.function.arguments;
  
      let result = "";
      if (functionName === "getTotalExpense") {
        result = getTotalExpense(JSON.parse(functionArgs));
        // console.log(result);
      }
  
      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      });
  
      console.log(messages);
    }
  }
}
callAgent();

function getTotalExpense({ from, to }) {
  // console.log("calling get total expenses");
  return "10000 INR";
}
