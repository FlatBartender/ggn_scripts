// ==UserScript==
// @name         GGn Get Album desc from VGMDB
// @namespace    https://orbitalzero.ovh/scripts
// @version      0.18
// @include      https://vgmdb.net/album/*
// @include      http://vgmdb.net/album/*
// @description  Helps users to easily get an OST's info from VGMDB and get it formatted with proper BBCode
// @author       NeutronNoir
// @grant        GM_addStyle
// @grant        GM.addStyle
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// @require      https://code.jquery.com/jquery-3.1.0.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js   
// ==/UserScript==

const button_css = `
#gen_desc {
	position: fixed;
	left: 0;
	top: 0;
	z-index: 999999;
	cursor: pointer;
	height: 5%;
	background-color: lightblue;
}`;

(function() {
    add_validate_button();
		GM.addStyle(button_css);
})();

function add_validate_button() {
	$("body").prepend('<input type="button" id="gen_desc" value="Generate description"/>');
	$("#gen_desc").click( function() {
        GM.setClipboard(get_desc($("html")), "text");
        alert("Description copied to clipboard");
	});
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
	var composers = env.find("#album_infobit_large>tbody>tr>td>span>b:contains('Composed by')")
		.parent().parent().parent()
		.find("td").last().text().trim().split(", ");

	let title = env.find(".albumtitle").first().text();

	if (composers.length >= 2) return title + " by Various Artists";
	else return title + " by " + composers[0];
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