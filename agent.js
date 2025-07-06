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
    content: "hi",
  });

  const completion = await groq.chat.completions.create({
    messages: messages,
    model: "llama-3.3-70b-versatile",
    tools: [
      {
        type: "function",
        function: {
          name: "getTotalExpense",
          description:
            "Calculates the total expense within a specified date range.",
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

  console.log(JSON.stringify(completion.choices[0], null, 2));

  const toolCalls = completion.choices[0].message.tool_calls;
  if (!toolCalls) {
    console.log(`assistant: ${completion.choices[0].message.content}`);
    return;
  }

  for (const tool of toolCalls) {
    const functionName = tool.function.name;
    const functionArgs = tool.function.arguments;

    let result = "";
    if (functionName === "getTotalExpense") {
      const result = getTotalExpense(JSON.parse(functionArgs));
    }

    const completio2 = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Renil, a smart and friendly personal finance assistant. Your role is to help users manage and understand their expenses by answering questions, calculating totals, analyzing spending patterns, and providing suggestions when needed. Today's date is ${new Date().toUTCString()}. Be concise, accurate, and helpful in your responses.`,
        },
        {
          role: "user",
          content: "hi",
        },
        {
          role: "tool",
          constent: result,
          tool_call_id: tool.id,
        },
      ],
      model: "llama-3.3-70b-versatile",
      tools: [
        {
          type: "function",
          function: {
            name: "getTotalExpense",
            description:
              "Calculates the total expense within a specified date range.",
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

    console.log(JSON.stringify("tvtvtyt"));
    console.log(JSON.stringify(completio2.choices[0], null, 2));
  }
}
callAgent();

function getTotalExpense({ from, to }) {
  console.log("calling get total expenses");
  return "10000";
}
