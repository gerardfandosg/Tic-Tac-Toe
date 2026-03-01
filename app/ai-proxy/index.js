const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PORT = parseInt(process.env.PORT || "3001", 10);

if (!OPENAI_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not defined. Set it in your environment or in a .env file.");
  process.exit(1);
}

async function getAiMove(board, player) {
  const systemPrompt = `You are a Tic-Tac-Toe Player. The board is an array of 9 elements, index 0..8. Empty cells are empty strings. Current board status is as follows: ${JSON.stringify(board)}. Please return a single integer 0-8, which is the best move for player ${player}.`;

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify({ board, player }) }
    ],
    max_tokens: 16,
    temperature: 0.0,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const match = content.match(/(\d+)/);
  if (!match) {
    throw new Error(`Unexpected OpenAI response: '${content}'`);
  }
  const idx = parseInt(match[1], 10);
  if (isNaN(idx) || idx < 0 || idx > 8) {
    throw new Error(`Parsed invalid index ${idx} from OpenAI response`);
  }
  return idx;
}

app.post("/api/ai-move", async (req, res) => {
  try {
    const { board, player } = req.body || {};
    if (!Array.isArray(board) || board.length !== 9) {
      return res.status(400).json({ error: "board must be an array of length 9" });
    }
    if (!["X", "O"].includes(player)) {
      return res.status(400).json({ error: "player must be 'X' or 'O'" });
    }

    const index = await getAiMove(board, player);
    if (board[index] !== "") {
      return res.status(400).json({ error: "move index occupied" });
    }
    return res.json({ index });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy running on http://localhost:${PORT}`);
});
