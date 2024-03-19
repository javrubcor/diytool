/*global location history */
sap.ui.define([
	"DIYTOOLS/DIY_TOOL/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"DIYTOOLS/DIY_TOOL/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, History, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("DIYTOOLS.DIY_TOOL.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
			// Add the worklist page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#DIYTools-display"
			}, true);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			//				this._showObject(oEvent.getSource());  //GS01--
			//GS01++ Start
			// Get the current purchase order object
			var oView = this.getView();
			oView.getModel().disableHeadRequestForToken = true;

			var sPath = oEvent.oSource.oBindingContexts.undefined.sPath;
			var oDiyTool = oView.getModel().getProperty(sPath);
			
// User Unlock routine start
			if (oDiyTool.Actionid === "01") {
				// Pop Up Dialog Message START
				var dialog1 = new sap.m.Dialog({
					title: "SAPC User Unlock",
					type: "Message",
					state: "Success",
					content: [
						new sap.ui.layout.form.SimpleForm({
							editable: false,
							layout: "ResponsiveGridLayout",
							content: [
								new sap.m.Label({
									text: "User Name"
								}),
								new sap.m.Text({
									text: oDiyTool.Info1
								}),
								new sap.m.Label({
									text: "Tool"
								}),
								new sap.m.Text({
									text: oDiyTool.ActDesc
								})
							]

						})
					],
					beginButton: new sap.m.Button({
						text: "Unlock",
						activeIcon: "sap-icon://accept",
						icon: "sap-icon://accept",
						type: "Accept",
						press: function () {
									oView.getModel().update(sPath, oDiyTool, {
										success: function (oData, response) {
											if (response && response.headers && response.headers["sap-message"]) {
												if (JSON.parse(response.headers["sap-message"])) {
													if (JSON.parse(response.headers["sap-message"]).severity === "error") { //an error happened      
														sap.m.MessageBox.error(JSON.parse(response.headers["sap-message"]).message, {
															title: "Error"
														});
													}
												}
											} else {
												sap.m.MessageToast.show("User unlocked successfully", {
													duration: 4000,
													width: "20em"
												});
											}
										},
										error: function (oError) {
											var sErrorMsg = "There was an error when submitting your request.";
											if (oError && oError.responseText) {
												try {
													if (JSON.parse(oError.responseText) && JSON.parse(oError.responseText).error) { //an error happened
														sErrorMsg = JSON.parse(oError.responseText).error.message.value;
													}
												} catch (e) {
													if (oError.responseText.indexOf("timed out") !== -1) {
														sErrorMsg = "Connection timed out. Please try later.";
													}
													if (oError.responseText.indexOf("Administrator") !== -1) {
														sErrorMsg = "Backend Error. Contact administrator. See ST22 log.";
													}
												}
											}
											sap.m.MessageToast.show(sErrorMsg, {
												duration: 4000,
												width: "20em",
												closeOnBrowserNavigation: false
											});
										}
									});
									dialog1.close();
								}
					}),
					endButton: new sap.m.Button({
						text: "Cancel",
						activeIcon: "sap-icon://reject",
						icon: "sap-icon://decline",
						type: "Reject",
						press: function () {
							dialog1.close();
						}
					}),
					afterClose: function () {
						dialog1.destroy();
					}
				});

				dialog1.open();
			}
// User Unlock Dialog message END



// Password Renew routine start
			if (oDiyTool.Actionid === "02") {
				// Pop Up Dialog Message START
				var dialog = new sap.m.Dialog({
					title: "SAPC Password Change",
					type: "Message",
					state: "Success",
					content: [
						new sap.ui.layout.form.SimpleForm({
							editable: false,
							layout: "ResponsiveGridLayout",
							content: [
								new sap.m.Label({
									text: "User Name"
								}),
								new sap.m.Text({
									text: oDiyTool.Info1
								}),
								new sap.m.Label({
									text: "Tool"
								}),
								new sap.m.Text({
									text: oDiyTool.ActDesc
								})
							]

						}),
						new sap.m.Input("password0", {
							width: "100%",
							type: "Password",
							placeholder: "Old Password"
						}),
						new sap.m.Input("password", {
							width: "100%",
							type: "Password",
							placeholder: "New Password"
						}),
						new sap.m.Input("password1", {
							width: "100%",
							type: "Password",
							placeholder: "Re-type new password"
						})
					],
					beginButton: new sap.m.Button({
						text: "Confirm",
						activeIcon: "sap-icon://accept",
						icon: "sap-icon://accept",
						type: "Accept",
						press: function () {
								if (sap.ui.getCore().byId("password").getValue() !== sap.ui.getCore().byId("password1").getValue()) {
									// Passwords don't match
									sap.m.MessageBox.error(
										"Passwords don't match. Try again"
									);
								} else { // Passwords match
									oDiyTool.Info2 = sap.ui.getCore().byId("password").getValue();  // NEW Password
                                    oDiyTool.Info3 = sap.ui.getCore().byId("password0").getValue(); //OLD Password
                                    
									oView.getModel().update(sPath, oDiyTool, {
										success: function (oData, response) {
											if (response && response.headers && response.headers["sap-message"]) {
												if (JSON.parse(response.headers["sap-message"])) {
													if (JSON.parse(response.headers["sap-message"]).severity === "error") { //an error happened      
														sap.m.MessageBox.error(JSON.parse(response.headers["sap-message"]).message, {
															title: "Error"
														});
													}
												}
											} else {
												sap.m.MessageToast.show("Password changed successfully", {
													duration: 4000,
													width: "20em"
												});
											}
										},
										error: function (oError) {
											var sErrorMsg = "There was an error when submitting your request.";
											if (oError && oError.responseText) {
												try {
													if (JSON.parse(oError.responseText) && JSON.parse(oError.responseText).error) { //an error happened
														sErrorMsg = JSON.parse(oError.responseText).error.message.value;
													}
												} catch (e) {
													if (oError.responseText.indexOf("timed out") !== -1) {
														sErrorMsg = "Connection timed out. Please try later.";
													}
													if (oError.responseText.indexOf("Administrator") !== -1) {
														sErrorMsg = "Backend Error. Contact administrator. See ST22 log.";
													}
												}
											}
											sap.m.MessageToast.show(sErrorMsg, {
												duration: 4000,
												width: "20em",
												closeOnBrowserNavigation: false
											});
										}
									});
									dialog.close();
								}
							} // End of IF Password match
					}),
					endButton: new sap.m.Button({
						text: "Cancel",
						activeIcon: "sap-icon://reject",
						icon: "sap-icon://decline",
						type: "Reject",
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			}
			// Password Change Dialog message END
			//GS01++ END
			
// Forgot Password routine start
			if (oDiyTool.Actionid === "03") {
				// Pop Up Dialog Message START
				var dialog = new sap.m.Dialog({
					title: "SAPC Password Change",
					type: "Message",
					state: "Success",
					content: [
						new sap.ui.layout.form.SimpleForm({
							editable: false,
							layout: "ResponsiveGridLayout",
							content: [
								new sap.m.Label({
									text: "User Name"
								}),
								new sap.m.Text({
									text: oDiyTool.Info1
								}),
								new sap.m.Label({
									text: "Tool"
								}),
								new sap.m.Text({
									text: oDiyTool.ActDesc
								})
							]

						}),
						new sap.m.Input("password", {
							width: "100%",
							type: "Password",
							placeholder: "New Password"
						}),
						new sap.m.Input("password1", {
							width: "100%",
							type: "Password",
							placeholder: "Re-type new password"
						})
					],
					beginButton: new sap.m.Button({
						text: "Confirm",
						activeIcon: "sap-icon://accept",
						icon: "sap-icon://accept",
						type: "Accept",
						press: function () {
								if (sap.ui.getCore().byId("password").getValue() !== sap.ui.getCore().byId("password1").getValue()) {
									// Passwords don't match
									sap.m.MessageBox.error(
										"Passwords don't match. Try again"
									);
								} else { // Passwords match
									oDiyTool.Info2 = sap.ui.getCore().byId("password").getValue();

									oView.getModel().update(sPath, oDiyTool, {
										success: function (oData, response) {
											if (response && response.headers && response.headers["sap-message"]) {
												if (JSON.parse(response.headers["sap-message"])) {
													if (JSON.parse(response.headers["sap-message"]).severity === "error") { //an error happened      
														sap.m.MessageBox.error(JSON.parse(response.headers["sap-message"]).message, {
															title: "Error"
														});
													}
												}
											} else {
												sap.m.MessageToast.show("Password changed successfully", {
													duration: 4000,
													width: "20em"
												});
											}
										},
										error: function (oError) {
											var sErrorMsg = "There was an error when submitting your request.";
											if (oError && oError.responseText) {
												try {
													if (JSON.parse(oError.responseText) && JSON.parse(oError.responseText).error) { //an error happened
														sErrorMsg = JSON.parse(oError.responseText).error.message.value;
													}
												} catch (e) {
													if (oError.responseText.indexOf("timed out") !== -1) {
														sErrorMsg = "Connection timed out. Please try later.";
													}
													if (oError.responseText.indexOf("Administrator") !== -1) {
														sErrorMsg = "Backend Error. Contact administrator. See ST22 log.";
													}
												}
											}
											sap.m.MessageToast.show(sErrorMsg, {
												duration: 4000,
												width: "20em",
												closeOnBrowserNavigation: false
											});
										}
									});
									dialog.close();
								}
							} // End of IF Password match
					}),
					endButton: new sap.m.Button({
						text: "Cancel",
						activeIcon: "sap-icon://reject",
						icon: "sap-icon://decline",
						type: "Reject",
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			}
			// Password Change Dialog message END
			//GS01++ END			
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("worklistView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("ActDesc", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("Actionid")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});