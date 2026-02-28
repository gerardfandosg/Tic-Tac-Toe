import Router from "sap/m/routing/Router";
import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import StorageUtil from "sap/ui/util/Storage";

/**
 * @namespace tictactoe.tttfrontend.controller
 */
export default class App extends Controller {

    private _router: Router;

    public onInit(): void {
        this._router = (this.getOwnerComponent() as UIComponent).getRouter() as Router;
    }

    public onNewGamePress(): void {
        this._router.navTo("RouteGameSession");
        StorageUtil.remove("gameStatus");
    }

    public onHomePress(): void {
        this._router.navTo("RouteHome");
    }

    public onGameSessionLogsPress(): void {
        this._router.navTo("RouteLogs");
    }
}