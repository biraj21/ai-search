# AI Search

This is a fairly simple project that was inspired by [Perplexity](https://perplexity.ai). It uses [gpt-oss-120b](https://huggingface.co/openai/gpt-oss-120b) hosted on [Groq](https://console.groq.com/docs/model/openai/gpt-oss-120b) and [Google Custom Search JSON API](https://developers.google.com/custom-search/v1/overview).

![Screenshot](./images/ss.png)

## Tech Stack

### Backend

- Node.js
- Express.js
- No TypeScript (yet)

### Frontend

- React
- TypeScript
- Tailwind CSS (& CSS)

## Development

1. Clone the repo.
2. Make sure Node.js is installed. I've tested with `v22`.
3. Run `npm install` in both _backend_ and _frontend_ subdirs.
4. Create a `.env` file in _backend_. Check _backend/src/env.js_ for variables. Also make sure to set `PORT` to 8080.
5. Run `npm run dev` in both subdirs.

## Acknowledgements

1. [Perplexity](https://perplexity.ai) for inspiration
2. [OpenAI](https://huggingface.co/openai/gpt-oss-120b) for gpt-oss-120b model
3. [Groq](https://groq.com/) for inference
4. [Google](https://developers.google.com/custom-search/v1/overview) for data
5. [Claude](https://claude.ai/) for helping me with prompts
6. And [ChatGPT](https://chatgpt.com/) of course
