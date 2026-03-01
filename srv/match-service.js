const cds = require('@sap/cds');
const fetch = global.fetch || require('node-fetch');
var lastSelectedIndex = -1;

module.exports = cds.service.impl(async function () {

  this.on('aiMove', async (req) => {
    const { board, player, difficulty } = req.data;

    if (!['X','O'].includes(player)) {
      req.error(400, "player must be 'X' or 'O'");
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      req.error(500, 'OpenAI key not configured');
    }

    var systemPrompt = `You are Tic-Tac-Toe player. The board is an array of 9 string elements, index 0..8.
      In our board representation, the cells combinations for the winning conditions are: [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8] and [2,4,6].
      Your goal is to have three elements of the same type (X or O depending on the player) on one of said positions combinations. You also need to avoid the other player to reach those combinations.
      Each element of our array represents a cell on the board. Empty strings are empty cells. "O" strings are occupied by player O. 
      "X" strings are occupied by player X. Current board situation is ${board}. 
      With all the previous information, return a single integer between 0-8, which has to be the best move for player ${player} to end up winning. You can not select an already occupied cell index. 
      The answer must be a single integer of 1 digit representing the position on the board (the index of the array). Nothing else. You can't choose the following index: ${lastSelectedIndex}`;

    console.log("Board situation:", board);

    switch(difficulty) {
      case 0: // easy
        systemPrompt += "Make a random move instead of the best move.";
        break;
      case 1: // medium
        break;
      case 2: // hard
        systemPrompt += ` Always select the best move available. Act as an expert Tic-Tac-Toe player.`;
        break;
      default:
        req.error(400, `Invalid difficulty: ${difficulty}`);
    }

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
      lastSelectedIndex = idx;

      return idx;
    } catch (e) {
      req.error(500, `AI service error: ${e.message}`);
    }
  });

});