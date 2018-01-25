// ==UserScript==
// @name         Open Image in New Tab
// @version      0.01
// @namespace    https://orbitalzero.ovh/scripts/
// @description  Open image in new tab by ctrl+rightclicking them
// @author       NeutronNoir
// @include      *
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    var images = document.getElementsByTagName('img');
    Array.from(images).forEach(function (image) {
        image.addEventListener('contextmenu', function (event) {
            if (event.ctrlKey) event.preventDefault();
        });
        image.addEventListener('mousedown', function (event) {
            if(event.button == 2 && event.ctrlKey)
            {
                event.preventDefault();
                GM_openInTab(image.src, true);
            }
        });
    });
})();