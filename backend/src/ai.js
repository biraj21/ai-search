import { Readable } from "node:stream";
import OpenAI from "openai";

import { env } from "./env.js";

const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: env.GROQ_API_KEY,
});

// const MODEL = "llama-3.3-70b-versatile";
const MODEL = "openai/gpt-oss-120b";

/**
 * Gets a response from the OpenAI API.
 *
 * @param {{ role: string, content: string }[]} messages
 * @param {boolean} [stream=true] - Whether to stream the response or not, defaults to `true`
 * @param {object} [options] - Additional options like tools, tool_choice, etc.
 *
 * @returns {Promise<string | Readable>} - Returns a `Promise` resolving to a string when `stream` is `false`,
 *                                         and a `Readable` when `stream` is `true`.
 */
async function getResponse(messages, stream = true, options = {}) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    stream,
    messages,
    ...options,
  });

  if (!stream) {
    return response;
  }

  // Convert the stream to a Node.js Readable
  const readable = new Readable({
    read() {},
  });

  (async () => {
    try {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          readable.push(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }
      readable.push("data: [DONE]\n\n");
      readable.push(null);
    } catch (error) {
      readable.destroy(error);
    }
  })();

  return readable;
}

/**
 * Gets an AI answer for the given query.
 *
 * @param {string} query
 * @param {string} searchResults
 * @param {boolean} [stream=true] - Whether to stream the response or not, defaults to `true`
 *
 */
export async function getAiAnswer(query, searchResults, stream = true) {
  const messages = [
    {
      role: "system",
      content: systemPromptWithSearchResults(searchResults),
    },
    {
      role: "user",
      content: query,
    },
  ];

  return getResponse(messages, stream);
}

/**
 * Plans the search strategy for a given query using tool calls.
 * Returns both the optimized search query and optimal source count.
 *
 * @param {string} query - The user's original query
 * @returns {Promise<{searchQuery: string, sourceCount: number}>}
 */
export async function planSearch(query) {
  const searchPlanningTool = {
    type: "function",
    function: {
      name: "plan_search",
      description: "Determine optimal search strategy for the given query",
      parameters: {
        type: "object",
        properties: {
          searchQuery: {
            type: "string",
            description:
              "Optimized Google search query that will get the most relevant results. Match human Google search patterns. Don't wrap in quotes.",
          },
          sourceCount: {
            type: "integer",
            minimum: 5,
            maximum: 15,
            description:
              "Number of sources needed. Simple questions: 5-6, Complex comparisons: 7-9, Research topics: 10-15",
          },
        },
        required: ["searchQuery", "sourceCount"],
      },
    },
  };

  const messages = [
    {
      role: "system",
      content: `You are a search planning assistant. Analyze the user's query and determine:
1. The optimal Google search query (simple, effective keywords)
2. How many sources are needed based on complexity

Guidelines:
- Simple definitions/facts: 5-6 sources
- Comparisons/analysis: 7-9 sources  
- Research with multiple aspects: 10-15 sources

Use the plan_search tool to respond.`,
    },
    {
      role: "user",
      content: query,
    },
  ];

  const response = await getResponse(messages, false, {
    tools: [searchPlanningTool],
    tool_choice: { type: "function", function: { name: "plan_search" } },
  });

  const toolCall = response.choices[0].message.tool_calls[0];
  const { searchQuery, sourceCount } = JSON.parse(toolCall.function.arguments);

  return { searchQuery, sourceCount };
}

const SP_SEARCH_RESULTS = `You are an AI assistant providing answers based on search results.

CRITICAL CITATION RULES:
- Citations MUST use standard square brackets: [N] where N is the search result number
- NEVER use alternative bracket styles like 【N】, (N), or {N}
- Citations MUST follow exact format: [N](url) where N matches the search result number
- You can ONLY cite numbers that match the exact search result numbers provided
- NEVER cite numbers higher than the total number of provided search results
- MUST cite every fact with corresponding search result number
- If unsure about source number, DO NOT cite

CONTENT GUIDELINES:
- Answer in the same language as the user's question
- Provide comprehensive, well-structured responses
- Use proper markdown formatting for headings, lists, etc.
- Avoid excessive emojis that distract from the content

EXAMPLES:
✅ CORRECT: "The Earth orbits the Sun [1](url1). This takes 365 days [2](url2)."
❌ WRONG: "The Earth orbits the Sun 【1】(url1)" or "Earth orbits Sun (1)"

For insufficient/no results:
"The search results don't contain enough information to answer this query."

Remember: Only the citation brackets must be standard [N] format. Content can be in any language.`;

/**
 *
 * @param {string} searchResults
 * @returns
 */
function systemPromptWithSearchResults(searchResults) {
  return `${SP_SEARCH_RESULTS}

Today's date: ${new Date().toString()}

Search results:
${searchResults.slice(0, 20_000)}`;
}
