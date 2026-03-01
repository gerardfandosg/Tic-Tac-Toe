# Getting Started

Welcome to the TIC TAC TOE SAPUI5 project.

It contains these folders and files, following a recommended SAP CAP project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`readme.md` | this getting started guide

## Steps to launch the application 

- Open a new terminal and run `npm install` to install al required libraries.
- Then run `npm start` and after it finishes launching visit <http://localhost:3001/tictactoe.tttfrontend/index.html> to start playing.

### OpenAI AI Player (optional)

You can enable an AI opponent by setting the environment variable `OPENAI_API_KEY` before starting the service (see .env.example file. Remove ".example" to have a working .env file). The backend exposes a custom action `aiMove` on the `MatchService` that queries the OpenAI API for deciding the AI move. The frontend automatically calls this action when you select **Play against AI** in the game configuration dialog for all player "O" actions.

## Learn More

Learn more at <https://cap.cloud.sap>.
