sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";
    return Controller.extend("knpltsiiasfrontend.controller.Detail", {
        onInit: function () {
            this.oUserModel = this.getOwnerComponent().getModel();
        
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.getRoute("detail").attachPatternMatched(this._onUserMatched, this);
            this._userID = null;
            
            // page refresh 
            window.addEventListener('beforeunload', function () {
                sessionStorage.setItem('pageRefreshed', 'true');
            });

            if (sessionStorage.getItem('pageRefreshed') === 'true') {

                this.handleClose();

                sessionStorage.removeItem('pageRefreshed');
            }
            
        
            
        },
        // sales group column section
        // ID -> userID
        _openGroups: function (ID) {
            var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(2);
            this.oRouter.navTo("detailGroup", {
                layout: oNextUIState.layout,
                userID: ID,
                groups: 'sales'
            });
        },

        // _closeGroups: function (ID) {
        //     var sNextLayout = this.oUserModel.getProperty("/actionButtonsInfo/endColumn/closeColumn");
        //     this.oRouter.navTo("detail", {
        //         layout: sNextLayout,
        //         userID: ID
        //     }, true);
        // },

        // formaters for the icons and color status and if data is null -> not available
        formatter: {
            fullName: function (firstName, lastName) {
                return lastName === null ? firstName : firstName + " " + lastName;
            },
            statusIcon: function (isTrue) {
                return Number(isTrue) === 1 ? "sap-icon://sys-enter-2" : "sap-icon://decline";
            },
            statusState: function (isTrue) {
                return Number(isTrue) === 1 ? "Success" : "Error";
            },
            nullState: function (rValue) {
                return rValue ? rValue : 'Not Available';
            }
        },

        // close function for the Detail page
        handleClose: function () {
            var sNextLayout = this.oUserModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
            this.oRouter.navTo("list", { layout: sNextLayout });
        },

        _onUserMatched: function (oEvent) {
            this._userID = oEvent.getParameter("arguments").userID;
            this._userID = Number(this._userID);

            if (!isNaN(this._userID)) {
                this.getView().bindElement({
                    path: `/User(${this._userID})`,
                    model: "USERS_DATA"
                });

                this._openGroups(this._userID)

            }
        },

        
        
    });
});
