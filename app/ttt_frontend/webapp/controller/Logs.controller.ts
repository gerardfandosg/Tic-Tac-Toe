import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";

/**
 * @namespace tictactoe.tttfrontend.controller
 */
export default class Logs extends Controller {

    public onInit(): void {
        const router = UIComponent.getRouterFor(this);

        router.getRoute("RouteLogs")?.attachPatternMatched(this._onRouteMatched.bind(this));
    }

    private _onRouteMatched(): void {

    }
}