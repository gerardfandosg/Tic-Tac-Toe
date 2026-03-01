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

    var systemPrompt = `You are a Tic-Tac-Toe game engine. The board is an array of 9 elements, index 0..8.
      The winning conditions are three characters of the same type in a row horizontally, vertically or diagonally.
      In our board representation, the cells combinations for those winning conditions are are: [0,1,2], [3,4,5], [6,7,8] for horizontal, [0,3,6], [1,4,7], [2,5,8] for vertical and [0,4,8], [2,4,6] for diagonal.
      Each element of our array represents a cell on the board. Empty strings are empty cells. "O" strings are occupied by player O. 
      "X" strings are occupied by player X. Current board situation is ${board}. 
      Return a single integer between 0-8, which is the best move for player ${player}. You can not choose an already occupied index. 
      The answer must be a single integer of 1 digit representing the position on the board (the index of the array). Nothing else. You can't choose the following index: ${lastSelectedIndex}`;

    console.log("Board situation:", board);

    switch(difficulty) {
      case 0: // easy
        systemPrompt += "Make a random move instead of the best move.";
        break;
      case 1: // medium
        break;
      case 2: // hard
        systemPrompt += ` Always select the best move available. `;
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