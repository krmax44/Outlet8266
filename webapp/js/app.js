var app = {
	outlets: [],
	settings: {
		ip: "localhost",
		pass: "test"
	}
};

app.power = function(that) {
	var id = parseInt($(that).parent().parent().data("id"));
	var code;
	var data = app.outlets[id];

	if ($(that).data("status") == "on") {
		code = app.outlets[id].codeOn;
	}
	else {
		code = app.outlets[id].codeOff;
	}
	
	$(".w-overlay").fadeIn();

	$.ajax({
		url: "http://" + app.settings.ip + "/api/" + data.type,
		data: {
			code: code,
			pulselength: data.pulselength,
			protocol: data.protocol,
			pass: app.settings.pass
		},
		method: "get"
	}).done(function(res){
		if (res != "OK") {
			$("#error").modal("show");
		}
	}).fail(function(){
		$("#error").modal("show");
	}).always(function(){
		$(".w-overlay").fadeOut();
	});
};

app.delete = function(that) {
	var id = parseInt($(that).parent().parent().data("id"));

	$(".w-overlay").fadeIn(function(){
		app.outlets.splice(id, 1);
		app.updateOutlets();
		$("#outlets").html("");
		app.outlets.forEach(function(o, i){
			app.renderOutlet(i);
		});

		$(".w-overlay").fadeOut();
	});
};

app.renderOutlet = function(id) {
	$("#outlets").append('<li class="list-group-item d-md-flex justify-content-between align-items-center" data-id="' + id + '">\
								' + app.outlets[id].name + '\
								<div>\
									<a href="#!" class="btn btn-outline-secondary" data-status="on" onclick="app.power(this)"><i class="icon-power"></i> ON</span></a>\
									<a href="#!" class="btn btn-outline-secondary" data-status="off" onclick="app.power(this)"><i class="icon-power"></i> OFF</span></a>\
									<a href="#!" class="btn btn-outline-danger" onclick="app.delete(this)"><i class="icon-delete"></i></span></a>\
								</div>\
							</li>');
};

app.addOutlet = function() {
	var name = $("#add-outlet-name").val();
	var type = $("#add-outlet-type").val();
	var codeOn = $("#add-outlet-binary-on").val();
	var codeOff = $("#add-outlet-binary-off").val();
	var pulselength = $("#add-outlet-pulselength").val();
	var protocol = $("#add-outlet-protocol").val();

	app.outlets.push({
		name: name,
		type: type,
		codeOn: codeOn,
		codeOff: codeOff,
		pulselength: pulselength,
		protocol: protocol
	});

	app.renderOutlet(app.outlets.length - 1);
	app.updateOutlets();
};

app.updateOutlets = function() {
	localStorage.setItem("outlets", JSON.stringify(app.outlets));
};

app.getOutlets = function() {
	try {
		var outlets = JSON.parse(localStorage.getItem("outlets"));
		app.outlets = [];
		outlets.forEach(function(o){
			app.outlets.push(o);
		});

		$("#outlets").html("");

		app.outlets.forEach(function(o, i){
			app.renderOutlet(i);
		});
	}
	catch (e) {
		console.log("no outlets yet");
	}

	$("#login").hide();
	$("#control").show();
	$(".w-overlay").fadeOut();
};

app.login = function() {
	var ip = $("#ipaddress").val();
	var pass = $("#pass").val();

	app.settings.ip = ip;
	app.settings.pass = pass;
	localStorage.setItem("login", JSON.stringify(app.settings));
	app.tryLogin();
};

app.logout = function() {
	localStorage.setItem("login", null);
	$(".w-overlay").fadeIn(function(){
		$("#control").hide();
		$("#login").show();
		$(".w-overlay").fadeOut();
	});
};

app.tryLogin = function() {
	$(".w-overlay").fadeIn(function(){
		if (localStorage.getItem("login") === null) {
			$("#login").show();
			$(".w-overlay").fadeOut();
		}
		else {
			var login = JSON.parse(localStorage.getItem("login"));
			try {
				$.ajax({
					url: "http://" + login.ip + "/log",
					data: {
						pass: login.pass
					},
					method: "get"
				}).done(function(res, text, xhr){
					if (xhr.status == 200) {
						app.settings = JSON.parse(localStorage.getItem("login"));
						app.getOutlets();
					}
					else {
						app.logout();
					}
				}).fail(app.logout);
			}
			catch (e) {
				app.logout();
			}
		}
	});
};

app.share = function() {
	var parser = document.createElement("a");
	parser.href = window.location.href;

	var url = parser.protocol + "//" + parser.host + parser.pathname + "#" + encodeURIComponent(JSON.stringify(app));
	copyToClipboard(url);

	$(".share-config").css("color", "#3EA761");
	setTimeout(function(){
		$(".share-config").css("color", "#1a1a1a");
	}, 500);
};

app.autovoice = function() {
	copyToClipboard(JSON.stringify(app.outlets));

	$(".autovoice-config").css("color", "#3EA761");
	setTimeout(function(){
		$(".autovoice-config").css("color", "#1a1a1a");
	}, 500);
};

function copyToClipboard(value) {
	var tbx = document.createElement('input');
	document.body.appendChild(tbx);
	tbx.value = value;
	tbx.focus();
	tbx.setSelectionRange(0, tbx.value.length);
	document.execCommand("copy");
	document.body.removeChild(tbx);
}

$(document).ready(function(){
	var parser = document.createElement("a");
	parser.href = window.location.href;

	try {
		var ohash = decodeURIComponent(parser.hash.substr(1));
		var hash = JSON.parse(ohash);
		console.log(hash);
		if (hash.settings.ip && hash.settings.pass) {
			localStorage.setItem("login", JSON.stringify(hash.settings));
			localStorage.setItem("outlets", JSON.stringify(hash.outlets));
			$("html").html("");
			window.location.href = parser.protocol + "//" + parser.host + parser.pathname;
		}
	}
	catch (e) {
		console.log("no data passed");
	}

	app.tryLogin();
});