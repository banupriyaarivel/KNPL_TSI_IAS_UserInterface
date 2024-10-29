/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "knpltsiiasfrontend/model/models",
        "sap/f/library",
    "sap/f/FlexibleColumnLayoutSemanticHelper",
    "sap/ui/model/json/JSONModel"

    ],
    function (UIComponent, Device, models, library, FlexibleColumnLayoutSemanticHelper, JSONModel) {
        "use strict";
        var LayoutType = library.LayoutType;

        return UIComponent.extend("knpltsiiasfrontend.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                var oData = {
                    layout: "OneColumn"
                };
                var oModel = new JSONModel(oData);
                this.setModel(oModel);

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            },
            
            // helper function for the three cloumn design
            getHelper: function () {
                var oFCL = this.getRootControl().byId("fcl");
                var oParams = new URLSearchParams(window.location.search);
                var oSettings = {
                    defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
                    defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
                    maxColumnsCount: oParams.get("max")
                };

                return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
            }
        });
    }
);