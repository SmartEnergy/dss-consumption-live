gui = {
	modal : function(state) {
		state ? $("#modal").show() : $("#modal").hide();
	},
	buttons : function(id, buttons) {
		id = "buttons_" + id;
		if ($("#" + id).size() == 0)
			$("#header").append('<p class="buttons" id="' + id + '"></p>');

		$("#" + id).html("");
		for ( var i = 0; i < buttons.length; i++) {
			var a = $('<a href="">' + buttons[i].label + '</a>').click(
					buttons[i].callback).appendTo("#" + id);
			if (buttons[i].selected)
				a.addClass("selected");
		}
	},
	button : function(label, callback, selected) {
		return {
			"label" : label,
			"selected" : selected,
			"callback" : callback
		};
	},
	dateFormat : function(date) {
		return date.getFullYear() + "-" + (date.getMonth() < 9 ? "0" : "")
				+ (date.getMonth() + 1) + "-"
				+ (date.getDate() < 10 ? "0" : "") + date.getDate();
	},
	stub : function() {
		return false;
	}
};