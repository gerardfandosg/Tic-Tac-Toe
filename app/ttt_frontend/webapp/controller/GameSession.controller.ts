import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Button from "sap/m/Button";
import BaseEvent from "sap/ui/base/Event";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Component from "sap/ui/core/Component";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import Dialog from "sap/m/Dialog";
import RadioButtonGroup from "sap/m/RadioButtonGroup";
import MessageBox from "sap/m/MessageBox";
import UIComponent from "sap/ui/core/UIComponent";
import CheckBox from "sap/m/CheckBox";
import StorageUtil from "sap/ui/util/Storage";
import Table from "sap/m/Table";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import MessageToast from "sap/m/MessageToast";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import VBox from "sap/m/VBox";
import Label from "sap/m/Label";
import Router from "sap/ui/core/routing/Router";

/**
 * @namespace tictactoe.tttfrontend.controller
 */
export default class GameSession extends Controller {

    private _gameConfigDialog: Dialog;
    private _resourceBundle: ResourceBundle;
    private router: Router
    private _winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    public onInit(): void {
        this.router = UIComponent.getRouterFor(this);

        this.router.getRoute("RouteGameSession")?.attachPatternMatched(this._onRouteMatched.bind(this));
    }

    private _onCreateCompleted(event: BaseEvent): void {
        const success = event.getParameters()["success"] as boolean;
        if(success) {
            MessageToast.show(this._resourceBundle.getText("logEntryCreationSuccessMessage") as string);
        } else {
            MessageToast.show(this._resourceBundle.getText("logEntryCreationErrorMessage") as string);
        }
    }

    private _initModel(gameStatusData?: string): void {
        const model = this.getView()?.getModel() as JSONModel;

        if(gameStatusData) {
            const parsedData = JSON.parse(gameStatusData) as JSON;
            model.setData(parsedData);
            return;
        }

        model.setProperty("/matchInProgress", false);
        model.setProperty("/gameInProgress", false);
        model.setProperty("/playerXWins", 0);
        model.setProperty("/playerOWins", 0);
        model.setProperty("/board", ["", "", "", "", "", "", "", "", ""]);
        model.setProperty("/currentPlayer", "X");
        model.setProperty("/matchSize", 3);
        model.setProperty("/opponentIsAI", false);
        model.setProperty("/matchInformationText", "");
        model.setProperty("/winnerText", "");
        model.setProperty("/difficulty", 1);

        void this._openGameConfigDialog();
    }

    private _onRouteMatched(): void {
        const gameStatusData = StorageUtil.get("gameStatus") as string;
        const dummyTable = this.byId("dummy-logs-table") as Table;
        const listBinding = dummyTable.getBinding("items") as ODataListBinding;

        this._resourceBundle = ((this.getOwnerComponent() as Component).getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle;

        if(!listBinding.hasListeners("createCompleted")) {
            listBinding.attachCreateCompleted(this._onCreateCompleted.bind(this), this);
        }

        this._initModel(gameStatusData);
    }

    private _initializeGame(): void {
        const group = this.byId("game-type-group") as RadioButtonGroup;
        const aiChb = this.byId("ai-opponent-chb") as CheckBox;
        const aiDifficultyGroup = this.byId("ai-difficulty-group") as RadioButtonGroup;
        const model = this.getView()?.getModel() as JSONModel;
        const selectedIndex = group.getSelectedIndex();
        const matchSize = selectedIndex === 0 ? 3 : selectedIndex === 1 ? 5 : 7;
        const difficulty = aiDifficultyGroup.getSelectedIndex();

        model.setProperty("/matchInProgress", true);
        model.setProperty("/gameInProgress", true);
        model.setProperty("/playerXWins", 0);
        model.setProperty("/playerOWins", 0);
        model.setProperty("/board", ["", "", "", "", "", "", "", "", ""]);
        model.setProperty("/currentPlayer", "X");
        model.setProperty("/matchSize", matchSize);
        model.setProperty("/opponentIsAI", aiChb.getSelected());
        model.setProperty("/matchInformationText", this._resourceBundle.getText("matchInformationText", [matchSize]));
        model.setProperty("/winnerText", "");
        model.setProperty("/difficulty", difficulty);
    }

    public onStartMatch(): void {
        this._initializeGame();
        this._gameConfigDialog.close();
    }

    public onCellPress(event: BaseEvent): void {
        const button = event.getSource();
        const cellIndex = parseInt((button as Button).getCustomData()[0].getValue() as string);

        void this._applyMove(cellIndex);
    }

    /**
     * AI always plays as the "O" player. 
     * It's important to note that for this program a "game" contains multiple "matches". 
     * That means a match is in progress until someone completes a winning or draw condition.
     * A game is finished only when a player wins multiple matches depending on the game type selected (best of).
     */
    private async _applyMove(cellIndex: number, isAiMove: boolean = false): Promise<void> {
        const model = this.getView()?.getModel() as JSONModel;
        const gameBoardBox = this.byId("game-board-box") as VBox;
        var board = model.getProperty("/board") as string[];
        var currentPlayer = model.getProperty("/currentPlayer") as string;
        var playerXWins = model.getProperty("/playerXWins") as number;
        var playerOWins = model.getProperty("/playerOWins") as number;
        var matchInProgress = model.getProperty("/matchInProgress") as boolean;
        const opponentIsAI = model.getProperty("/opponentIsAI") as boolean;

        if (!matchInProgress) {
            return;
        }

        if (board[cellIndex] !== "") {
            return;
        }

        if(opponentIsAI && currentPlayer === "O" && !isAiMove) {
            return;
        }

        board[cellIndex] = currentPlayer;
        model.setProperty("/board", board);

        //Checks if winning conditions are met for the current match.
        if (this._checkWin(currentPlayer)) {
            this._setWinnerText();
            if (currentPlayer === "X") {
                playerXWins++;
            } else {
                playerOWins++;
            }

            model.setProperty("/playerXWins", playerXWins);
            model.setProperty("/playerOWins", playerOWins);
            model.setProperty("/matchInProgress", false);

            //Checks if current game is over after current match winning conditions are met.
            if (this._isGameOver()) {
                StorageUtil.remove("gameStatus");
                this._showMatchWinner();
            } else {
                this._storeGameStatus();
            }
            return;
        }

        //Checks if draw conditions are met.
        if (this._checkDraw()) {
            this._setDrawText();
            model.setProperty("/matchInProgress", false);
            this._storeGameStatus();
            return;
        }

        //If no match ending conditions are met, it exchanges the current player and continues the match.
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        model.setProperty("/currentPlayer", currentPlayer);
        this._storeGameStatus();

        if (opponentIsAI && currentPlayer === "O") {
            gameBoardBox.setBusy(true);
            var aiIndex = await this._requestAiMove();

            //AI has 5 tries to deliver a correct index.
            for (let i = 0; i < 4; i++) {
                if (aiIndex !== null && aiIndex !== undefined && board[aiIndex] === "") {
                    break;
                } else {
                    aiIndex = await this._requestAiMove();
                }
            }

            if(aiIndex === null || aiIndex === undefined || board[aiIndex] !== "") {
                //First available cell is selected if AI fails to provide a valid move after 5 attempts. This is a fallback mechanism to ensure the game continues.
                aiIndex = board.findIndex(cell => cell === "");
            }

            await this._applyMove(aiIndex, true);
            gameBoardBox.setBusy(false);
        }
    }

    private async _requestAiMove(): Promise<number | null> {
        const model = this.getView()?.getModel() as JSONModel;
        const odataModel = this.getView()?.getModel("mainService") as ODataModel;

        const board = JSON.stringify(model.getProperty("/board") as string[]);
        const player = model.getProperty("/currentPlayer") as string;

        try {
            const actionBinding = odataModel.bindContext("/MatchService.aiMove(...)", null);
            actionBinding.setParameter("board", board);
            actionBinding.setParameter("player", player);
            actionBinding.setParameter("difficulty", model.getProperty("/difficulty") as number);
            
            await actionBinding.invoke();

            const result = actionBinding.getBoundContext()?.getObject() as {
                index: number;
            };
            
            if (result && typeof result === "object" && "value" in result) {
                const index = result.value as number;
                if (typeof index === "number" && index >= 0 && index <= 8) {
                    return index;
                }
            }
            
            console.error("AI move failed:");
            return null;
        } catch (err) {
            console.log("AI error:", err);
            MessageToast.show(this._resourceBundle.getText("aiMoveError"));
            return null;
        }
    }

    public onStartNewMatch(): void {
        if (this._isGameOver()) {
            void this._openGameConfigDialog();
        } else {
            this._resetBoard();
        }
    }

    private _resetBoard(): void {
        const model = this.getView()?.getModel() as JSONModel;

        model.setProperty("/board", ["", "", "", "", "", "", "", "", ""]);
        model.setProperty("/currentPlayer", "X");
        model.setProperty("/matchInProgress", true);
    }

    private _isGameOver(): boolean {
        const model = this.getView()?.getModel() as JSONModel;
        const playerXWins = model.getProperty("/playerXWins") as number;
        const playerOWins = model.getProperty("/playerOWins") as number;
        const matchSize = model.getProperty("/matchSize") as number;
        const winsNeeded = Math.floor(matchSize / 2) + 1;

        return playerXWins >= winsNeeded || playerOWins >= winsNeeded;
    }

    private _showMatchWinner(): void {
        const model = this.getView()?.getModel() as JSONModel;
        const playerXWins = model.getProperty("/playerXWins") as number;
        const playerOWins = model.getProperty("/playerOWins") as number;
        const winner = playerXWins > playerOWins ? "X" : "O";
        
        MessageBox.information(this._resourceBundle.getText("gameWinnerInformationText", [winner, playerXWins, playerOWins]) as string, {
            title: this._resourceBundle.getText("gameWinnerInformationTitle"),
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: (action) => {
                if (action === MessageBox.Action.YES) {
                    this._storeGameResult();
                }

                this._navToHome();
            }
        });
    }

    private _storeGameResult(): void {
        const model = this.getView()?.getModel() as JSONModel;
        const dummyTable = this.byId("dummy-logs-table") as Table;
        const listBinding = dummyTable.getBinding("items") as ODataListBinding;
        const matchResult = {
            PlayerXWins: model.getProperty("/playerXWins") as number,
            PlayerOWins: model.getProperty("/playerOWins") as number,
            Date: new Date(),
            OpponentWasAI: model.getProperty("/opponentIsAI") as boolean
        };

        listBinding.create(matchResult);
    }

    private _checkWin(player: string): boolean {
        const model = this.getView()?.getModel() as JSONModel;
        const board = model.getProperty("/board") as string[];

        return this._winningCombinations.some(combination =>
            combination.every(index => board[index] === player)
        );
    }

    private _checkDraw(): boolean {
        const model = this.getView()?.getModel() as JSONModel;
        const board = model.getProperty("/board") as string[];

        return board.every(cell => cell !== "");
    }

    private _setWinnerText(): void {
        const model = this.getView()?.getModel() as JSONModel;
        const currentPlayer = model.getProperty("/currentPlayer") as string;

        model.setProperty("/winnerText", this._resourceBundle.getText("winnerText", [currentPlayer]));
    }

    private _setDrawText(): void {
        const model = this.getView()?.getModel() as JSONModel;

        model.setProperty("/winnerText", this._resourceBundle.getText("drawText"));
    }

    private async _openGameConfigDialog(): Promise<void> {
        this._gameConfigDialog ??= await this.loadFragment({
            name: "tictactoe.tttfrontend.fragment.gameConfigDialog"
        }) as Dialog;

        this._gameConfigDialog.open();
    }

    private _storeGameStatus(): void {
        const model = this.getView()?.getModel() as JSONModel;
        const jsonData = model.getData() as JSON;

        StorageUtil.put("gameStatus", JSON.stringify(jsonData));
    }

    public onStartNewGame(): void {
        MessageBox.confirm(this._resourceBundle.getText("startNewGameConfirmationText") as string, {
            title: this._resourceBundle.getText("startNewGameConfirmationTitle"),
            onClose: (action) => {
                if (action === MessageBox.Action.OK) {
                    this._startNewGame();
                }
            }
        });
    }

    private _startNewGame(): void {
        StorageUtil.remove("gameStatus");
        this._initModel();
    }

    public onAIOpponentSelect(event: BaseEvent): void {
        const aiDiffLabel = this.byId("ai-difficulty-label") as Label;
        const aiDiffGroup = this.byId("ai-difficulty-group") as RadioButtonGroup;
        const selected = event.getParameters()["selected"] as boolean;
        aiDiffLabel.setVisible(selected);
        aiDiffGroup.setVisible(selected);
    }

    public onCancelMatch(): void {
        this._gameConfigDialog?.close();
        this._navToHome();
    }

    private _navToHome(): void {
        this.router.navTo("RouteHome");
    }
}