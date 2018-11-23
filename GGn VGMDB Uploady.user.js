// ==UserScript==
// @name         GGn VGMDB Uploady
// @namespace    https://orbitalzero.ovh/scripts
// @version      0.11
// @include      https://gazellegames.net/upload.php
// @match        https://gazellegames.net/torrents.php?action=editgroup*
// @description  Uploady for VGMDB
// @author       NeutronNoir
// @require      https://code.jquery.com/jquery-3.1.1.min.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js   
// @grant		 		 GM_xmlhttpRequest
// @grant				 GM.xmlHttpRequest
// @grant        GM_addStyle
// @grant        GM.addStyle
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// ==/UserScript==

(function() {
  	if (window.location.href.includes("action=editgroup")) {
        insert_button_editgroup_page();
    } else {
    		$("#categories").click(function () {
        		if ($(this).find(":selected").text() == "OST") setTimeout(insert_button_upload_page, 1000);
    		});
    }
})();

function insert_button_upload_page() {  
    $("#title_tr").after($('<tr><td class="label">Catalog Number</td><td><input type="text" id="catalog_number" size="60"></input>'));
    $("#catalog_number").on("blur", function () {
        var input = this;
        var request = new GM.xmlHttpRequest({
          	"method": "GET",	//Send the image URL to WhatIMG
            "url": "http://vgmdb.net/search?q=" + $(this).val(),
            "onload": function (response) {
            		if (response.status != 200) $(input).val("Album not found");
    						var env = $(response.responseText);
              	upload_page_handler(env);
            }                                 
        });
    });
}

function insert_button_editgroup_page() {  
    $("input[name='aliases']").after($('<span>Catalog Number: </span><input type="text" id="catalog_number" size="60"></input>'));
    $("#catalog_number").on("blur", function () {
        var input = this;
        var request = new GM.xmlHttpRequest({
          	"method": "GET",	//Send the image URL to WhatIMG
            "url": "http://vgmdb.net/search?q=" + $(this).val(),
            "onload": function (response) {
            		if (response.status != 200) $(input).val("Album not found");
    						var env = $(response.responseText);
              	editgroup_page_handler(env);
            }                                 
        });
    });
}

function upload_page_handler(env) {
  	$("#aliases").val(get_aliases(env));
  	$("#album_desc").val(get_desc(env));
  	$("#title").val(get_title(env));
  	$("#year").val(get_year(env));
  	$("#vgmdburi").val(get_link(env));
  	$("#vgmdburi").val(get_link(env));
  	$("#image").val(env.find("#coverart").css("background-image").replace(/url\("([^"]*)"\)/, "$1"));
    // $("#tags").val("soundtrack, ost"); -> Uncomment if you need those
}

function editgroup_page_handler(env) {
  	$("input[name='aliases']").val(get_aliases(env));
  	$("textarea[name='body']").val(get_desc(env));
  	$("input[name='name']").val(get_title(env));
  	$("input[name='year']").val(get_year(env));
  	$("#vgmdburi").val(get_link(env));
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
  	var composers = env.find("#album_infobit_large>tbody>tr>td>span>b:contains('Composed by')")
    										.parent().parent().parent()
    										.find("td").last().text().trim().split(", ");
  	
 		let title = env.find(".albumtitle").first().text();
  
  	if (composers.length >= 2) return title + " by Various Artists";
  	else											 return title + " by " + composers[0];
}

function get_aliases(env) {
		var aliases = [];
    env.find("#innermain .albumtitle:not(:first)[lang='en']").each( function() {
    		aliases.push($(this).text().trim());
    });
    return aliases.join(", ");
}

function get_desc(env) {
  	var desc = "[align=center][size=3][u][b]Album Information\n" + env.find(".albumtitle").first().text() + "[/b][/u][/size][/align]\n\n";
  
    env.find("#album_infobit_large>tbody>tr").each( function() {    //Generate the info on the album
        $(this).find("[style*='display:none']").remove();
        $(this).find("script").remove();
        desc += "[*][b]" + $(this).find("td>span>b").text() + ":[/b]\t" + $(this).find("td").last().text().trim() + "\n";
    });
 
    desc += "\n[align=center][pre]Tracklist\n";
    env.find("#tracklist").find("[style*='display: none']").remove();
    var disc_count = (env.find("#tracklist").text().match(/Disc [0-9]+/g) || []).length;
                                               
    var max_title_length = 0;
    env.find("#tracklist").find("tr").each(function () {
    		var td = $(this).find("td").eq(1);
        if ($(td).text().length > max_title_length) max_title_length = $(td).text().length;
    });
    max_title_length = Math.ceil(max_title_length/8);
                                               
    env.find("#tracklist>span>table>tbody").each( function (index) {    //Generate the track list
    		if (disc_count > 1) desc += "Disc " + (index+1) + "\n";
    		$(this).find("tr").each( function (index) {   //For each track
		    		//The first index is a span containing the track number
		        var tds = $(this).find("td");
		        desc += tds.first().find("span").text() + "\t";
		        desc += tds.eq(1).text() + "\t".repeat(Math.ceil(max_title_length-tds.eq(1).text().length/8));
		        desc += tds.last().text() + "\n";
		    });
    		desc += "\n";
    });
    desc = desc.substring(0, desc.length - 2);
    desc += "[/pre][/align]";
  
    var notes = env.find("div.smallfont[style='padding: 10px']").html().replace(/< *br *>/g, "\n") + "[/pre][/align]";
  
    if (env.find("div.smallfont[style='padding: 10px']").find(".label").text().startsWith("No notes available") === false) desc += "\n\n[align=left][pre]Notes\n" + notes;
  
    return desc;
}