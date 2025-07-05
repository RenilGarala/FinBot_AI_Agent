import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          `you are Renil, a personal finance assistant, your task is to handle user with their expenses current date ${new Date().toUTCString()}`,
      },
      {
        role: "user",
        content: "Get total expense from 2023-01-01 to 2023-01-31",
      },
    ],
    model: "llama-3.3-70b-versatile",
    tools: [
        {
            type: 'function',
            function: {
                name: 'getTotalExpense',
                description: 'Get total expense from date to date',
                parameters:{
                    type: 'object',
                    properties: {
                        from: {
                            type: 'string',
                            description: 'From date to get the expense'
                        },
                        to: {
                            type: 'string',
                            description: 'To date to get the expense'
                        }
                    }
                }
            }
        }
    ]
  });

  console.log(JSON.stringify(completion.choices[0], null, 2));

  const toolCalls = completion.choices[0].message.tool_calls;
  if (!toolCalls) {
    console.log(`assistant: ${completion.choices[0].message.content}`);
    return;
  }

}
callAgent();

function getTotalExpense({from, to}) {
  console.log("calling get total expenses");
}