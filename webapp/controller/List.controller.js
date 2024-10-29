sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    'sap/m/MessageBox',
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, Sorter, MessageBox, Fragment, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("knpltsiiasfrontend.controller.List", {
        onInit: async function () {
            console.log('Application Started');
            this.oRouter = this.getOwnerComponent().getRouter();


            // newUser model structure
            var oNewUser = {
                ID: await this._newUserID(),
                FIRST_NAME: null,
                LAST_NAME: null,
                EMAIL: null,
                PROFILE_IMAGE: null,
                IS_ARCHIVED: 0,
                CREATED_AT: null,
                UPDATED_AT: null,
                APP_VERSION: null,
                LAST_LOGIN_AT: null,
                EMPLOYEE_CODE: null,
                ZONE: null,
                DESIGNATION: null,
                MANAGER: null,
                MOBILE: null,
                DIVISION_IDENTIFIER: null,
                IS_ACTIVATED: 1
            };

            var oNewUserModel = new JSONModel(oNewUser);
            this.getView().setModel(oNewUserModel, "newUser");

            // newUserSalesGroup model structure
            var oNewUserSalesGroup = {
                ID: await this._newUserSalesGroupID(),
                USER_ID: null,
                SALES_GROUP: null,
                IS_ARCHIVED: null,
                CREATED_AT: null,
                UPDATED_AT: null

            };

            var oNewUserSalesGroupModel = new JSONModel(oNewUserSalesGroup);
            this.getView().setModel(oNewUserSalesGroupModel, "newSalesGroup");

            // newIASUser object
            this._oNewIASUser = {
                familyName: null,
                givenName: null,
                userName: null,
                active: null,
                email: null,
                phoneNumber: null
            }

            // newMapUserRole object
            this._oNewMapUserRole = {
                ID: await this._newMapUserRoleID(),
                USER_ID: null,
                ROLE_ID: null,
                IS_ARCHIVED: 0,
                CREATED_AT: null,
                CREATED_BY: null,
                UPDATED_AT: null,
                UPDATED_BY: null
            }

            var oNewRoleID = new JSONModel({ RoleID: '' })
            this.getView().setModel(oNewRoleID, 'newRole')

            // Descending Order Sort for Employees ID's
            this._bDescendingSort = false;
        },

        // search filter
        onLiveSearch: function (oEvent) {
            const aFilter = [];
            let sQuery = oEvent.getParameter("newValue");

            if (sQuery) {
                // filter for employee first name
                const oFirstNameFilter = new Filter("FIRST_NAME", FilterOperator.Contains, sQuery);
                aFilter.push(oFirstNameFilter);

                // filter for employee ID
                if (!isNaN(sQuery) && sQuery.trim() !== "") {
                    const oUserIDFilter = new Filter("ID", FilterOperator.EQ, Number(sQuery));
                    aFilter.push(oUserIDFilter);
                }
            }
            // binding filters to the List in Table
            const oCombinedFilter = new Filter({ filters: aFilter, and: false });
            const oList = this.byId("usersTable");
            const oBinding = oList.getBinding("items");
            oBinding.filter(oCombinedFilter);
        },

        // filter for sort of employee ID
        onSort: function () {
            this._bDescendingSort = !this._bDescendingSort;
            const oTable = this.getView().byId("usersTable"),
                oBinding = oTable.getBinding("items"),
                oSorter = new Sorter("ID", this._bDescendingSort);
            oBinding.sort(oSorter);
        },

        // Add new user frgment from frgments->register
        onAdd: function () {
            if (!this.rDialog) {
                this.rDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "knpltsiiasfrontend.fragments.register",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this.rDialog.then(oDialog => oDialog.open());

        },

        // submiting the all required data for DB
        onSubmit: async function () {

            const oNewUserModel = this.getView().getModel("newUser");
            const oNewUserData = oNewUserModel.getData();

            const oNewUserSalesGroupModel = this.getView().getModel("newSalesGroup");
            const oNewUserSalesGroupData = oNewUserSalesGroupModel.getData();

            const oNewRoleID = this.getView().getModel("newRole").getData();

        
            this.showBusyDialog()
            if (oNewUserData.FIRST_NAME && oNewUserData.EMAIL && oNewUserData.LAST_NAME && oNewUserSalesGroupData.SALES_GROUP && oNewRoleID.RoleID) {
                oNewUserData.CREATED_AT = this._getCurrentTime();

                console.log(oNewUserSalesGroupData.SALES_GROUP, typeof oNewUserSalesGroupData.SALES_GROUP)

                

                // Sales group data
                oNewUserSalesGroupData.USER_ID = oNewUserData.ID;
                oNewUserSalesGroupData.SALES_GROUP = this._formatSalesGroupID(oNewUserSalesGroupData.SALES_GROUP);
                oNewUserSalesGroupData.CREATED_AT = this._getCurrentTime();
                oNewUserSalesGroupData.IS_ARCHIVED = oNewUserData.IS_ARCHIVED;

                //  IAS User Data
                this._oNewIASUser.givenName = oNewUserData.FIRST_NAME;
                this._oNewIASUser.familyName = oNewUserData.LAST_NAME;
                this._oNewIASUser.userName = `${oNewUserData.FIRST_NAME} ${oNewUserData.LAST_NAME}`;
                this._oNewIASUser.email = oNewUserData.EMAIL;
                this._oNewIASUser.phoneNumber = oNewUserData.MOBILE;
                this._oNewIASUser.active = !!oNewUserData.IS_ACTIVATED;

                //  User Role Map
                this._oNewMapUserRole.USER_ID = oNewUserData.ID;
                this._oNewMapUserRole.IS_ARCHIVED = oNewUserData.IS_ARCHIVED;
                this._oNewMapUserRole.CREATED_AT = this._getCurrentTime();
                this._oNewMapUserRole.UPDATED_AT = this._getCurrentTime();
                this._oNewMapUserRole.ROLE_ID = Number(oNewRoleID.RoleID);

                if (this._validateNewUserData(oNewUserData)) {
                    console.log("Validations passed");
                    console.log(oNewUserData, oNewUserSalesGroupData, this._oNewMapUserRole, this._oNewIASUser)

                    const DBUserExist = await this._isUserExistInDB("EMAIL", oNewUserData.EMAIL);
                    const IASUserExist = await this._isUserExistInIAS(this._oNewIASUser);

                    console.log("DB : ", DBUserExist, "IAS : ", IASUserExist);

                    if (DBUserExist && IASUserExist) {
                        console.log("User exists in both DB and IAS");

                        MessageBox.warning("User already registered");
                    } else if (DBUserExist) {
                        console.log("User exists in DB, creating in IAS...");
                        await this._createUserInIAS(this._oNewIASUser);

                        this.onCancel()
                    } else if (IASUserExist) {
                        console.log("User exists in IAS, creating in DB...");
                        await this._createUser(oNewUserData, oNewUserSalesGroupData, this._oNewMapUserRole);

                        this.onCancel()
                    } else {
                        console.log("User does not exist in either DB or IAS, creating in both...");
                        await this._createUser(oNewUserData, oNewUserSalesGroupData, this._oNewMapUserRole);

                        this.onCancel()
                    }

                    

                    
                }

                this.hideBusyDialog()
            } else {
                MessageBox.error("Please fill in all required fields.");
            }
        },

        // closing fragment
        onCancel: function () {
            this._ModelDataReset()
            this.byId('registerDialog').close();
        },

        // List item press navigation
        onListItemPress: function (oEvent) {
            
            const oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(1);
            const oSelectedItem = oEvent.getParameter("listItem");
            const oContext = oSelectedItem.getBindingContext("USERS_DATA");
            const sUserID = oContext.getObject().ID;

            // navigation to detail page
            this.oRouter.navTo("detail", {
                layout: oNextUIState.layout,
                userID: sUserID
            }, true);


            
        },

        

        // Validations
        // Email validation
        // param = email
        _validateNewUserData: function (newData) {
            const EmailRegEx = new RegExp('^[a-zA-Z0-9._%±]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
            // test the email with regex
            if (!EmailRegEx.test(newData.EMAIL)) {
                MessageBox.error('Please enter a valid email');
                return false;
            }
            return true;
        },

        // checking user existence in DB by using Email filter
        // key = email; value = 'example@gmail.com'
        _isUserExistInDB: async function (key, value) {
            let isExist = false
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}User?$filter=${key} eq '${value}'`;
            await $.ajax({
                url: sUrl,
                type: "GET",
                contentType: "application/json",
                success: (oData) => {
                    if (oData.value[0]) {
                        console.log(oData)
                        isExist = true
                    }
                },
                error: function (err) {
                    MessageBox.error(err);
                }
            });
            return isExist
        },

        // checking user exist in IAS if yes give warining else create a new IAS user
        // data : IAS userData like name,email,active...etc.,
        _isUserExistInIAS: async function (data) {
            let isExist = false
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}createIAS`;
            await $.ajax({
                url: sUrl,
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json",
                success: (oData) => {
                    if (oData.value.status === "Warning") {
                        isExist = true
                    }
                },
                error: function () {
                    MessageBox.error('Error retrieving data');
                }
            });
            return isExist
        },

        //current time for user creation time
        _getCurrentTime: function () {
            const createdAt = new Date();
            const formattedDate = createdAt.toISOString();
            return formattedDate
        },

        // sales group id formatting
        // 2 -> 002, 12 -> 012, 123 -> 123
        _formatSalesGroupID: function (value) {
            let newValue;
            if (value.length === 1) {
                newValue = "00" + value
            } else if (value.length === 2) {
                newValue = "0" + value
            } else {
                newValue = value
            }

            return newValue
        },

        // get new ID from the last user id in DB
        _newUserID: async function () {
            let newID;
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}User?$orderby=ID desc&$top=1`;

            try {
                const oData = await $.ajax({
                    url: sUrl,
                    method: "GET"
                });


                if (oData.value.length === 0) {
                    newID = 1;
                } else {
                    newID = oData.value[0].ID + 1;
                }

            } catch (error) {
                console.error(error);
                const errorMessage = error.responseJSON?.error?.message || error.statusText || "An error occurred while fetching the user  ID.";
                MessageBox.error(errorMessage);
            }
            return newID;

        },
         // get new ID from the last user sales group id in DB
        _newUserSalesGroupID: async function () {
            let newID;
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}UserSalesGroup?$orderby=ID desc&$top=1`;

            try {
                const oData = await $.ajax({
                    url: sUrl,
                    method: "GET"
                });


                if (oData.value.length === 0) {
                    newID = 1;
                } else {
                    newID = oData.value[0].ID + 1;
                }

            } catch (error) {
                console.error(error);
                const errorMessage = error.responseJSON?.error?.message || error.statusText || "An error occurred while fetching the user sales group ID.";
                MessageBox.error(errorMessage);
            }
            return newID;

        },
         // get new ID from the last map user role id in DB
        _newMapUserRoleID: async function () {
            let newID;
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}MapUserRole?$orderby=ID desc&$top=1`;

            try {
                const oData = await $.ajax({
                    url: sUrl,
                    method: "GET"
                });


                if (oData.value.length === 0) {
                    newID = 1;
                } else {
                    newID = oData.value[0].ID + 1;
                }

            } catch (error) {
                console.error(error);
                const errorMessage = error.responseJSON?.error?.message || error.statusText || "An error occurred while fetching the user role ID.";
                MessageBox.error(errorMessage);
            }
            return newID;
        },


        // Busy dialog handling
        showBusyDialog: function () {
            if (!this._pBusyDialog) {
                this._pBusyDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "knpltsiiasfrontend.fragments.busyDialog",
                    controller: this
                }).then(oDialog => {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pBusyDialog.then(oDialog => oDialog.open());
        },
        // hide busy dialog
        hideBusyDialog: function () {
            if (this._pBusyDialog) {
                this._pBusyDialog.then(oDialog => oDialog.close());
            }
        },
        // page refresh on data updation
        onPostSuccess: function () {
            var oModel = this.getView().getModel("USERS_DATA");
            if (oModel) {
                oModel.refresh();
            }
        },

        // model data reset after closing register fragment and submitting it
        _ModelDataReset: async function () {

            const oNewUserModel = this.getView().getModel("newUser");
            const oNewUserSalesGroupModel = this.getView().getModel("newSalesGroup");
            const oNewRoleID = this.getView().getModel("newRole")

            oNewUserModel.setData({
                ID: await this._newUserID(),
                FIRST_NAME: null,
                LAST_NAME: null,
                EMAIL: null,
                PROFILE_IMAGE: null,
                IS_ARCHIVED: 0,
                CREATED_AT: null,
                UPDATED_AT: null,
                APP_VERSION: null,
                LAST_LOGIN_AT: null,
                EMPLOYEE_CODE: null,
                ZONE: null,
                DESIGNATION: null,
                MANAGER: null,
                MOBILE: null,
                DIVISION_IDENTIFIER: null,
                IS_ACTIVATED: 0
            });

            oNewUserSalesGroupModel.setData({
                ID: await this._newUserSalesGroupID(),
                USER_ID: null,
                SALES_GROUP: null,
                IS_ARCHIVED: null,
                CREATED_AT: null,
                UPDATED_AT: null
            });

            this._oNewIASUser = {
                familyName: null,
                givenName: null,
                userName: null,
                active: null,
                email: null,
                phoneNumber: null
            };

            this._oNewMapUserRole = {
                ID: await this._newMapUserRoleID(),
                USER_ID: null,
                ROLE_ID: null,
                IS_ARCHIVED: 0,
                CREATED_AT: null,
                CREATED_BY: null,
                UPDATED_AT: null,
                UPDATED_BY: null
            };

            oNewRoleID.setData({
                RoleID: null
            })
        },

        // ajax call for creating new user
        _createUser: async function (userData, userSalesGroupData, userRoleMapData) {
            
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}User`;
            let that = this;

            try {
                await $.ajax({
                    url: sUrl,
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(userData),
                    success: async function () {
                        await that._createUserSalesGroup(userSalesGroupData);
                        await that._createUserRoleMap(userRoleMapData);
                        MessageToast.show("User created successfully!");
                        that.onPostSuccess();
                    },
                    error: function (error) {
                        console.log(error);
                        MessageBox.error("Error creating user: " + (error.responseJSON?.error?.message || error.statusText));
                    }
                });
            } catch (error) {
                MessageBox.error("Error creating user: " + (error.responseJSON?.error?.message || error.statusText));
            }
        },

        // ajax call for creating new user sales group
        _createUserSalesGroup: async function (salesGroupData) {
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}UserSalesGroup`;
            let that = this;

            try {
                await $.ajax({
                    url: sUrl,
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(salesGroupData),
                    success: function () {
                        MessageToast.show("User sales group created successfully!");
                    },
                    error: function (error) {
                        console.log(error);
                        MessageBox.error("Error creating user sales group: " + (error.responseJSON?.error?.message || error.statusText));
                    }
                });
            } catch (error) {
                MessageBox.error("Error creating user sales group: " + (error.responseJSON?.error?.message || error.statusText));
            }
        },

        // ajax call for creating new map user role
        _createUserRoleMap: async function (roleMapData) {
            let sUrl = this.getOwnerComponent().getModel("USERS_DATA").getServiceUrl();
            sUrl = `${sUrl}MapUserRole`;
            let that = this;

            try {
                await $.ajax({
                    url: sUrl,
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(roleMapData),
                    success: function () {
                        MessageToast.show("User role map created successfully!");
                    },
                    error: function (error) {
                        console.log(error);
                        MessageBox.error("Error creating user role map: " + (error.responseJSON?.error?.message || error.statusText));
                    }
                });
            } catch (error) {
                MessageBox.error("Error creating user role map: " + (error.responseJSON?.error?.message || error.statusText));
            }
        }






    });
});
