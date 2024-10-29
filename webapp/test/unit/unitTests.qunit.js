/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"knpl_tsi_ias_frontend/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
