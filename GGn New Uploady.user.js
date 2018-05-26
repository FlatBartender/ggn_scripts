// ==UserScript==
// @name         GGn New Uploady
// @namespace    https://gazellegames.net/
// @version      0.2001
// @description  Steam Uploady for GGn
// @author       NeutronNoir, ZeDoCaixao
// @match        https://gazellegames.net/upload.php*
// @match        https://gazellegames.net/torrents.php?action=editgroup*
// @require      https://code.jquery.com/jquery-3.1.1.min.js
// @require      https://git.alice.gensokyo.eu/FlatBartender/ggn_scripts/raw/master/html2bb.user.js
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js    
// @grant        GM_xmlHttpRequest
// ==/UserScript==

var askScreens = false;

function fill_upload_form(response) {
    //We store the data in gameInfo, since it's much easier to access this way
    var gameInfo = response.response[$("#steamid").val()].data;
    $("#title").val(gameInfo.name);  //Get the name of the game
    var about = gameInfo.about_the_game;
    if (about === '') { about = gameInfo.detailed_description; }
    $("#album_desc").val("[align=center][b][u]About the game[/u][/b][/align]\n" + html2bb(about));
    //Get the year, which is actually the last number of "release_date.date"
    $("#year").val(gameInfo.release_date.date.split(", ").pop());

    //Genres are in an object array. Need to make them lowercase, replace spaces with dots and separate them with ", "
    var genres = [];
    gameInfo.genres.forEach(function (genre) {
        //Each genre is formatted as mentioned above and added to the "genres" array
        var tag = genre.description.toLowerCase().replace(/ /g, ".");
        switch (tag) {
            case "rpg":
                tag = "role.playing.game";
                break;
            case "scifi":
                tag = "science.fiction";
                break;
            case "early.access":
                break;
        }
        genres.push(tag);
    });
    //Every string in the "genres" array is then concatenated with ", "
    $("#tags").val(genres.join(", "));

    var addScreens = true;
    if (askScreens) addScreens = confirm("Fill the screenshot boxes ?");
    if (addScreens) {
        $("#image").val(gameInfo.header_image.split("?")[0]);       //Get the image URL
        var screens = document.getElementsByName("screens[]");      //Get each element corresponding to a screenshot
        var add_screen = $("#image_block a[href='#']").first();     //This is a shortcut to add a screenshot field.
        //If I didn't do this, people with access to "whatimg it" wouldn't have it, or inversely people without access would have it (which causes some bugs)
        gameInfo.screenshots.forEach( function(screen, index) {     //We iterate on Steam screenshots from the API
            if (index >= 20) return;                                //The site doesn't accept more than 20 screenshots
            if (index >= 3) add_screen.click();                     //There's 3 screenshot boxes by default. If we need to add more, we do as if the user clicked on the "[+]" (for reasons mentioned above)
            screens[index].value = screen.path_full.split("?")[0];  //Finally store the screenshot link in the right screen field.
        });
    }

    //Now let's get the requirements
    var recfield = gameInfo.pc_requirements;
    switch ($("#platform").val()) {
        case "Windows":
            recfield = gameInfo.pc_requirements;
            break;
        case "Linux":
             recfield = gameInfo.linux_requirements;
            break;
        case "Mac":
            recfield = gameInfo.mac_requirements;
            break;
    }
    var sr = html2bb(recfield.minimum) + "\n" + html2bb(recfield.recommended);
    $("#album_desc").val(
        $("#album_desc").val() +
        "\n\n[quote][align=center][b][u]System Requirements[/u][/b][/align]\n\n" +
        pretty_sr(html2bb(recfield.minimum+"\n"+recfield.recommended)) +
        "[/quote]");
}


function fill_screens(response) {
    //We store the data in gameInfo, since it's much easier to access this way
    var gameInfo = response.response[$("#steamid").val()].data;

    var addScreens = true;
    if (askScreens) addScreens = confirm("Fill the screenshot boxes ?");
    if (!addScreens) { return; }
    //Get the image URL
    $("input[name='image']").val(gameInfo.header_image.split("?")[0]);
    //Get each element corresponding to a screenshot
    var screens = document.getElementsByName("screens[]");
    //This is a shortcut to add a screenshot field.
    var add_screen = $("#image_block a[href='#']").first();
    //If I didn't do this, people with access to "whatimg it" wouldn't have it, or inversely people without access would have it (which causes some bugs)
    //We iterate on Steam screenshots from the API
    gameInfo.screenshots.forEach(function(screen, index) {
        //The site doesn't accept more than 20 screenshots
        if (index >= 20) return;
        //There's 3 screenshot boxes by default. If we need to add more, we do as if the user clicked on the "[+]" (for reasons mentioned above)
        if (index >= 3) add_screen.click();
        //Finally store the screenshot link in the right screen field.
        screens[index].value = screen.path_full.split("?")[0];
    });
}


(function() {
    'use strict';
    if (window.location.href.search("action=editgroup") != -1) {
        $("td.center").parent().after("<tr><td class='label'>Steam ID</td><td><input id='steamid' /></td></tr>");
        $("steamid").blur(function() { //After the "appid" input loses focus
            var request = new GM_xmlhttpRequest({
                method: "GET",                  //We call the Steam API to get info on the game
                url: "http://store.steampowered.com/api/appdetails?l=en&appids=" + $("#steamid").val(),
                responseType: "json",
                onload: fill_screens
            });
        });
    }
    else {
        $("#steamid").after(
            '<a href="javascript:;" id="fill_win">Win</a> <a href="javascript:;" id="fill_lin">Lin</a> <a href="javascript:;" id="fill_mac">Mac</a>');
        $('#fill_win').click(function () { $("#platform").val("Windows"); });
        $('#fill_lin').click(function () { $("#platform").val("Linux"); });
        $('#fill_mac').click(function () { $("#platform").val("Mac"); });
        $("#steamid").blur(function() {            //After the "appid" input loses focus
            var request = new GM.xmlHttpRequest({
                method: "GET",                             //We call the Steam API to get info on the game
                url: "http://store.steampowered.com/api/appdetails?l=en&appids=" + $("#steamid").val(),
                responseType: "json",
                onload: fill_upload_form
            });
        });
    }
})();
