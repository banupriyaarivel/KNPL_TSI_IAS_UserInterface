sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller"
], function (JSONModel, Controller) {
	"use strict";

	return Controller.extend("knpltsiiasfrontend.controller.Groups", {
		onInit: function () {
            
            // var oUserModel = new sap.ui.model.json.JSONModel();
            // this.getView().setModel(oUserModel, "userModel");
            // this.oUserModel = this.getOwnerComponent().getModel();

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel();
			this.oRouter.getRoute("detailGroup").attachPatternMatched(this._onGroupsMatched, this);
            this._userID = null
		},
        _onGroupsMatched: function(oEvent){
            this._userID = oEvent.getParameter("arguments").userID;
            this._userID = Number(this._userID)
            if (this._userID !== NaN){
                this.getView().bindElement({
                    path: `/User(${this._userID})`,
                    model:"USERS_DATA",
                    parameters: {
                        expand: "SALES_GROUPS"
                    }
                })
        }
        },
        // formatter for the sales group archieved
        formatter: {
            statusState: function (isArchived) {
                if (isArchived === 1) {
                    return "Error"; 
                } else {
                    return "Success"; 
                }
            }
        },
        


		
	});
});
