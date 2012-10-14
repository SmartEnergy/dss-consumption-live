$(function() {
	var line1 = [ [ '2008-06-30 8:00AM', 4 ], [ '2008-7-30 8:00AM', 6.5 ],
			[ '2008-8-30 8:00AM', 5.7 ], [ '2008-9-30 8:00AM', 9 ],
			[ '2008-10-30 8:00AM', 8.2 ] ];
	var line2 = [ [ '2008-06-30 8:00AM', 3 ], [ '2008-7-30 8:00AM', 9.5 ],
			[ '2008-8-30 8:00AM', 3.7 ], [ '2008-9-30 8:00AM', 5 ],
			[ '2008-10-30 8:00AM', 8.5 ] ];
	var plot2 = $.jqplot('plot', [ line1, line2 ], {
		title : 'Customized Date Axis',
		gridPadding : {
			right : 35
		},
		axes : {
			xaxis : {
				renderer : $.jqplot.DateAxisRenderer,
				tickOptions : {
					formatString : '%b %#d, %y'
				},
				min : 'May 30, 2008',
				tickInterval : '1 month'
			}
		},
		series : [ {
			lineWidth : 4,
			markerOptions : {
				style : 'square'
			}
		} ]
	});

	dssc.init();
});

dssc = {
	token : null,
	circuits : [],
	circuits_selected : [],
	interval_mode : "Woche",
	date : new Date(),
	init : function() {
		dssc.login();
		dssc.updateIntervals();
		dssc.updateUnits();
		dssc.updateDate();
	},
	updateGraph : function() {
		if (dssc.circuits_selected.length > 0) {
			var interval = dssc.getDateInterval();
			var query = '/json/metering/getValues?dsid='
					+ dssc.circuits_selected[0] + '&type=energy&resolution='
					+ dssc.getResolution() + '&startTime='
					+ interval.start.getTime() / 1000 + '&endTime='
					+ interval.end.getTime() / 1000;
			$.getJSON(query, function(data) {
				for ( var i = 0; i < data.result.values.length; i++) {
					var timestamp = new Date(data.result.values[i][0] * 1000);
					data.result.values[i][0] = timestamp.getFullYear() + "-"
							+ (timestamp.getMonth() + 1) + "-"
							+ timestamp.getDate() + " 00:00AM";
				}

				$("#plot").html("");
				$.jqplot('plot', [ data.result.values ], {
					title : 'Customized Date Axis',
					axes : {
						xaxis : {
							renderer : $.jqplot.DateAxisRenderer,
							tickOptions : {
								formatString : '%b %#d, %y'
							},
							tickInterval : '1 day'
						}
					},
					series : [ {
						lineWidth : 4,
						markerOptions : {
							style : 'square'
						}
					} ]
				});
			});
		}
	},
	getResolution : function() {
		if (dssc.interval_mode == "Tag")
			return 900;
		else if (dssc.interval_mode == "Woche")
			return 86400;
		else if (dssc.interval_mode == "Monat")
			return 86400;
		else if (dssc.interval_mode == "Jahr")
			return 604800;
	},
	login : function() {
		$.getJSON('/json/system/login?fuser=dssadmin&password=dssadmin',
				function(data) {
					dssc.token = data.result.token;
					dssc.findSeries();
				});
	},
	findSeries : function() {
		$.getJSON('/json/metering/getSeries', function(data) {
			for ( var i = 0; i < data.result.series.length; i++) {
				if (data.result.series[i].type == "energy") {
					var index = dssc.circuits.length;
					dssc.circuits[index] = {
						"dsid" : data.result.series[i].dsid,
						"name" : data.result.series[i].dsid
					};
					$.getJSON('/json/circuit/getName?id='
							+ data.result.series[i].dsid, function(data) {
						dssc.circuits[index].name = data.result.name;
						dssc.updateCircuits();
					});
				}
			}
			dssc.updateCircuits();
		});
	},
	updateCircuits : function() {
		var buttons = [];
		for ( var i = 0; i < dssc.circuits.length; i++) {
			if (dssc.circuits_selected.length == 0)
				dssc.circuits_selected[0] = dssc.circuits[i].dsid;
			buttons[buttons.length] = gui
					.button(dssc.circuits[i].name, "", $.inArray(
							dssc.circuits[i].dsid, dssc.circuits_selected) >= 0);
		}
		gui.buttons("circuits", buttons);
	},
	updateIntervals : function() {
		gui.buttons("intervals", [ gui.button("Tag", function() {
			dssc.selectInterval("Tag");
			return false;
		}, dssc.interval_mode == "Tag"), gui.button("Woche", function() {
			dssc.selectInterval("Woche");
			return false;
		}, dssc.interval_mode == "Woche"), gui.button("Monat", function() {
			dssc.selectInterval("Monat");
			return false;
		}, dssc.interval_mode == "Monat"), gui.button("Jahr", function() {
			dssc.selectInterval("Jahr");
			return false;
		}, dssc.interval_mode == "Jahr") ]);
	},
	selectInterval : function(interval) {
		dssc.interval_mode = interval;
		dssc.updateIntervals();
		dssc.updateDate();
	},
	updateUnits : function() {
		gui.buttons("units", [ gui.button("kWh", "", true),
				gui.button("€", "", false) ]);
	},
	updateDate : function() {
		var dateInterval = dssc.getDateInterval();
		dateInterval.end = new Date(dateInterval.end - 1);
		var dateString = gui.dateFormat(dateInterval.start) + " - "
				+ gui.dateFormat(dateInterval.end)
		gui.buttons("date", [ gui.button("<", dssc.dateBackward, false),
				gui.button(dateString, function() {
					dssc.date = new Date();
					dssc.updateDate();
					return false;
				}, false), gui.button(">", dssc.dateForward, false) ]);
		dssc.updateGraph();
	},
	dateForward : function() {
		dssc.date = new Date(dssc.date - -dssc.getInterval());
		dssc.updateDate();
		return false;
	},
	dateBackward : function() {
		dssc.date = new Date(dssc.date - dssc.getInterval());
		dssc.updateDate();
		return false;
	},
	getInterval : function() {
		if (dssc.interval_mode == "Tag")
			return 24 * 60 * 60 * 1000;
		else if (dssc.interval_mode == "Woche")
			return 7 * 24 * 60 * 60 * 1000;
		else if (dssc.interval_mode == "Monat")
			return 31 * 24 * 60 * 60 * 1000;
		else if (dssc.interval_mode == "Jahr")
			return 365 * 24 * 60 * 60 * 1000;
	},
	getDateInterval : function() {
		var d = dssc.date;
		if (dssc.interval_mode == "Tag") {
			var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,
					0, 0);
			var end = new Date(start - -24 * 60 * 60 * 1000);
		} else if (dssc.interval_mode == "Woche") {
			var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,
					0, 0);
			// Montag berechnen
			start = new Date(start - (start.getDay() + 6) % 7 * 24 * 60 * 60
					* 1000);
			var end = new Date(start - -7 * 24 * 60 * 60 * 1000);
		} else if (dssc.interval_mode == "Monat") {
			var start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
			var end = new Date(start - -31 * 24 * 60 * 60 * 1000);
			end.setDate(1);
		} else if (dssc.interval_mode == "Jahr") {
			var start = new Date(d.getFullYear(), 0, 1, 0, 0, 0);
			var end = new Date(d.getFullYear() + 1, 0, 1, 0, 0, 0);
		}
		return {
			"start" : start,
			"end" : end
		};
	}
}