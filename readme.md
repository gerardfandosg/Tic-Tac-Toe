# Getting Started

Welcome to your new CAP project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`readme.md` | this getting started guide

## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start with your domain model, in a CDS file in `db/`


### OpenAI AI Player (optional)

You can enable an AI opponent by setting the environment variable `OPENAI_API_KEY` before starting the service. The backend exposes a custom action `aiMove` on the `MatchService` that queries the OpenAI API for the next move. The frontend automatically calls this action when you select **Play against AI** in the game configuration dialog.

Example (PowerShell):

```powershell
$env:OPENAI_API_KEY="sk-..."
cds watch
```


## Learn More

Learn more at <https://cap.cloud.sap>.
