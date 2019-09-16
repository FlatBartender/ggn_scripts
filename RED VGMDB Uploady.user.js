// ==UserScript==
// @name         RED VGMDB Uploady
// @namespace    https://orbitalzero.ovh/scripts
// @version      0.16
// @include      https://redacted.ch/upload.php*
// @require		 https://code.jquery.com/jquery-3.4.1.min.js
// @description  Uploady for VGMDB
// @author       NeutronNoir
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js   
// @grant		 GM_xmlhttpRequest
// @grant		 GM.xmlHttpRequest
// @grant        GM_addStyle
// @grant        GM.addStyle
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// ==/UserScript==
(function() {
	if (window.location.href.includes("action=editgroup")) {
		insert_button_editgroup_page();
	} else {
		insert_button_upload_page();
	}
})();

function handle_page(handler, input) {
	return (response) => {
		if (response.status != 200) $(input).val("Album not found");
		var env = $(response.responseText);
		handler(env);
	}
}

function insert_button_upload_page() {
  $("#edition_catalogue_number").after("<tr><td class='label'>VGMDB URL</td><td><input type='text' id='vgmdb_url' size='50'> This is for the VGMDB URL. Leave blank if you don't use VGMDB.</td></tr>");
	$("#vgmdb_url").on("blur", function() {
		var input = this;
		var request = new GM.xmlHttpRequest({
			"method": "GET", //Send the image URL to WhatIMG
			"url": $(this).val(),
			"onload": handle_page(upload_page_handler, input)
		});
	});
}

function insert_button_editgroup_page() {
 $("#edition_catalogue_number").after("<tr><td class='label'>VGMDB URL</td><td><input type='text' id='vgmdb_url' size='50'> This is for the VGMDB URL. Leave blank if you don't use VGMDB.</td></tr>");
	$("#vgmdb_url").on("blur", function() {
		var input = this;
		var request = new GM.xmlHttpRequest({
			"method": "GET", //Send the image URL to WhatIMG
			"url": $(this).val(),
			"onload": handle_page(editgroup_page_handler, input)
		});
	});
}

function upload_page_handler(env) {
	$("#aliases").val(get_aliases(env));
	$("#album_desc").val(get_desc(env));
	$("#title").val(get_title(env));
	$("#year").val(get_year(env));
	$("#image").val(env.find("#coverart").css("background-image").replace(/url\("([^"]*)"\)/, "$1"));
}

function editgroup_page_handler(env) {
	$("input[name='aliases']").val(get_aliases(env));
	$("textarea[name='body']").val(get_desc(env));
	$("input[name='name']").val(get_title(env));
	$("input[name='year']").val(get_year(env));
	$("input[name='image']").val(env.find("#coverart").css("background-image").replace(/url\("([^"]*)"\)/, "$1"));
}

function get_link(env) {
	return env.find("link[rel='canonical']").first().attr("href");
}

function get_year(env) {
	return env.find("#album_infobit_large>tbody>tr>td>span>b:contains('Release Date')")
		.parent().parent().parent()
		.find("td").last().text().trim().split(" ").pop();
}

function get_title(env) {
	return env.find(".albumtitle").first().text();
}

function get_aliases(env) {
	var aliases = [];
	env.find("#innermain .albumtitle:not(:first)[lang='en']").each(function() {
		aliases.push($(this).text().trim());
	});
	return aliases.join(", ");
}

function get_desc(env) {
	var desc = "[align=center][size=3][u][b]Album Information\n" + env.find(".albumtitle").first().text() + "[/b][/u][/size][/align]\n\n";

	env.find("#album_infobit_large>tbody>tr").each(function() { //Generate the info on the album
		$(this).find("[style*='display:none']").remove();
		$(this).find("script").remove();
		desc += "[*][b]" + $(this).find("td>span>b").text() + ":[/b]\t" + $(this).find("td").last().text().trim() + "\n";
	});

	desc += "\n[align=center][pre]Tracklist\n";
	env.find("#tracklist").find("[style*='display: none']").remove();
	var disc_count = (env.find("#tracklist").text().match(/Disc [0-9]+/g) || []).length;

	var max_title_length = 0;
	env.find("#tracklist").find("tr").each(function() {
		var td = $(this).find("td").eq(1);
		if ($(td).text().length > max_title_length) max_title_length = $(td).text().length;
	});
	max_title_length = Math.ceil(max_title_length / 8);

	env.find("#tracklist>span>table>tbody").each(function(index) { //Generate the track list
		if (disc_count > 1) desc += "Disc " + (index + 1) + "\n";
		$(this).find("tr").each(function(index) { //For each track
			//The first index is a span containing the track number
			var tds = $(this).find("td");
			desc += tds.first().find("span").text() + "\t";
			desc += tds.eq(1).text() + "\t".repeat(Math.ceil(max_title_length - tds.eq(1).text().length / 8));
			desc += tds.last().text() + "\n";
		});
		desc += "\n";
	});
	desc = desc.substring(0, desc.length - 2);
	desc += "[/pre][/align]";

	var notes = env.find("#notes");
	if (notes.length != 0) {
		desc += "\n\¬[align=left][pre]Notes\n" + notes.html().replace(/< *br *>/g, "\n") + "[/pre][/align]";
	}

	return desc;
}
