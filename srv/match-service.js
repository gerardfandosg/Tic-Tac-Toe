const cds = require('@sap/cds');
const fetch = global.fetch || require('node-fetch');

module.exports = cds.service.impl(async function () {

  this.on('aiMove', async (req) => {
    const { board, player } = req.data;

    if (!['X','O'].includes(player)) {
      req.error(400, "player must be 'X' or 'O'");
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      req.error(500, 'OpenAI key not configured');
    }

    const systemPrompt = `You are a Tic-Tac-Toe engine. The board is an array of 9 elements, index 0..8. Each element representing a cell on the board.Empty strings are empty cells. "O" strings are occupied by player O. "X" strings are occupied by player X. Current board status is ${board}. Return a single integer between 0-8, which is the best move for player ${player}. You can not select an already occupied cell. The answer must be a single integer of 1 digit representing the position on the board. Nothing else.`;

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify({ board, player }) }
      ],
      max_tokens: 16,
      temperature: 0.0,
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`OpenAI request failed: ${response.status} ${txt}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      const match = content.match(/(\d+)/);
      if (!match) throw new Error(`unexpected response '${content}'`);
      const idx = parseInt(match[1], 10);
      if (isNaN(idx) || idx < 0 || idx > 8) {
        throw new Error(`invalid index ${idx}`);
      }

      console.log('OpenAI response:', idx);

      return idx;
    } catch (e) {
      req.error(502, `AI service error: ${e.message}`);
    }
  });

});