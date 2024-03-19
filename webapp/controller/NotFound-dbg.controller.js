sap.ui.define([
		"DIYTOOLS/DIY_TOOL/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("DIYTOOLS.DIY_TOOL.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);