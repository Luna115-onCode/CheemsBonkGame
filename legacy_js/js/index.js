const img = document.getElementById('cheems-img'), shopTextS = document.getElementById('shop-text');
const generalCounter = document.getElementById('general-count'), maxCounter = document.getElementById('max-count'), thisCounter = document.getElementById('this-count');
const pointsS = document.getElementById('pts-count'), dogeCoinsS = document.getElementById('dg-count');
const BC1 = document.getElementById('BuyCheems1'), BC2 = document.getElementById('BuyCheems2'), BC3 = document.getElementById('BuyCheems3');
const BC4 = document.getElementById('BuyCheems4'), BC5 = document.getElementById('BuyCheems5'), BC6 = document.getElementById('BuyCheems6');
const BC7 = document.getElementById('BuyCheems7'), BC8 = document.getElementById('BuyCheems8'), BC9 = document.getElementById('BuyCheems9');
const ClickCheemsB = document.getElementById('ClickCheems'), dgc = document.getElementById('dgc');
const BS1 = document.getElementById('BS1'), BS2 = document.getElementById('BS2'), BS3 = document.getElementById('BS3');
const BS4 = document.getElementById('BS4'), BS5 = document.getElementById('BS5'), BS6 = document.getElementById('BS6');
const BS7 = document.getElementById('BS7'), BS8 = document.getElementById('BS8'), BS9 = document.getElementById('BS9');
const BS10 = document.getElementById('BS10'), BS11 = document.getElementById('BS11'), BS12 = document.getElementById('BS12');
const BM1 = document.getElementById('BM1'), BM2 = document.getElementById('BM2'), BM3 = document.getElementById('BM3');
const BM4 = document.getElementById('BM4'), BM5 = document.getElementById('BM5'), BM6 = document.getElementById('BM6');


var DGC = Math.floor(Math.random()*100) + 51, SelSound = 1;
var Selcheems = "normal", totalCount = 0, maxCount = 0, thisCount = 0, points = 0, dogeCoins = 0, STTimer = 0;
var c1 = 'true', c2 = 'false', c3 = 'false', c5 = 'false', c6 = 'false', c7 = 'false', c8 = 'false', c9 = 'false';
var s1 = 'true', s2 = 'false', s3 = 'false', s4 = 'false', s5 = 'false', s6 = 'false', s7 = 'false', s8 = 'false';
var s9 = 'false', s10 = 'false', s11 = 'false', s12 = 'false', m1 = 'true', m2 = 'false', m3 = 'false', m4 = 'false';
var m5 = 'false', m6 = 'false', devMenu = 'false';
var clickable = "false", SelMusic = 1, musicTime = 0, theme = 0, FontSize = 2;

var body = document.getElementById("body"), navbar = document.getElementById("navbar"), group = document.getElementById("group");
var group1 = document.getElementById("group1"), group2 = document.getElementById("group2"), uppcont = document.getElementById("upper-container");

// descomentar al desplegar
//document.oncontextmenu = function(){return false}
//document.ondragstart = function(){return false}
//document.onselectstart = function(){return false}
//document.onmousedown = function() {return false}


function PrintChanges()
{
    pointsS.innerHTML = points + ' pts.';
    dogeCoinsS.innerHTML = dogeCoins;
    generalCounter.innerHTML = totalCount;
    maxCounter.innerHTML = maxCount;
    thisCounter.innerHTML = thisCount;
}

function PrintChangesS()
{
    pointsS.innerHTML = points + ' pts.';
    dogeCoinsS.innerHTML = dogeCoins;
}

function ClickCheems()
{
    if (clickable == "true") {
        PlaySound(SelSound);
        img.classList.add('full-size');
        img.setAttribute('src', 'img/hit/'+Selcheems+'.png');
        SaveCountChanges();
        PrintChanges();
    }
}

function NoClick() {
    return;
}

function LoadTheme() {
    theme = parseInt(localStorage.getItem("CheemsAppLiActTheme"));
    switch (theme) {
        case 0:
            body.classList.remove("dark-theme");
            body.classList.add("light-theme");
            navbar.classList.remove("dark-theme");
            navbar.classList.add("light-theme");
            try {
                uppcont.classList.remove("dark-theme");
                uppcont.classList.add("light-theme");
            } catch (error) {}
            try {
                group.classList.remove("dark-theme");
                group.classList.add("light-theme");
            } catch (error) {}
            try {
                group1.classList.remove("dark-theme");
                group1.classList.add("light-theme");
            } catch (error) {}
            try {
                group2.classList.remove("dark-theme");
                group2.classList.add("light-theme");
            } catch (error) {}
            break;
        case 1:
            break;
        case 2:
            body.classList.remove("dark-theme");
            body.classList.add("contrast-theme");
            navbar.classList.remove("dark-theme");
            navbar.classList.add("contrast-theme");
            try {
                uppcont.classList.remove("dark-theme");
                uppcont.classList.add("contrast-theme");
            } catch (error) {}
            try {
                group.classList.remove("dark-theme");
                group.classList.add("contrast-theme");
            } catch (error) {}
            try {
                group1.classList.remove("dark-theme");
                group1.classList.add("contrast-theme");
            } catch (error) {}
            try {
                group2.classList.remove("dark-theme");
                group2.classList.add("contrast-theme");
            } catch (error) {}
            break;
        default:
            theme = 0;
            localStorage.setItem("CheemsAppLiActTheme", theme);
            Redirect("index.html");
            break;
    }
}

function SwitchTheme(themeI) {
    theme = themeI;
    localStorage.setItem("CheemsAppLiActTheme", theme);
    Redirect("settings.html");
}

function LoadAccesibility() {
    FontSize = parseInt(localStorage.getItem("CheemsAppLiFontSize"));
    switch (FontSize) {
        case 0:
            body.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
            body.classList.add("text-smaller");
            try {
                pointsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                pointsS.classList.add("text-smaller");
            } catch (error) {}
            try {
                dogeCoinsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                dogeCoinsS.classList.add("text-smaller");
            } catch (error) {}
            break;
        case 1:
            body.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
            body.classList.add("text-small");
            try {
                pointsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                pointsS.classList.add("text-small");
            } catch (error) {}
            try {
                dogeCoinsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                dogeCoinsS.classList.add("text-small");
            } catch (error) {}
            break;
        case 2:
            body.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
            body.classList.add("text-normal");
            try {
                pointsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                pointsS.classList.add("text-normal");
            } catch (error) {}
            try {
                dogeCoinsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                dogeCoinsS.classList.add("text-normal");
            } catch (error) {}
            break;
        case 3:
            body.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
            body.classList.add("text-big");
            try {
                pointsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                pointsS.classList.add("text-big");
            } catch (error) {}
            try {
                dogeCoinsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                dogeCoinsS.classList.add("text-big");
            } catch (error) {}
            break;
        case 4:
            body.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
            body.classList.add("text-max");
            try {
                pointsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                pointsS.classList.add("text-max");
            } catch (error) {}
            try {
                dogeCoinsS.classList.remove("text-smaller", "text-small", "text-normal", "text-big", "text-max");
                dogeCoinsS.classList.add("text-max");
            } catch (error) {}
            break;
        default:
            FontSize = 2;
            localStorage.setItem("CheemsAppLiFontSize", FontSize);
            Redirect("index.html");
    }
}

function SetAccesibility(size) {
    FontSize = size;
    localStorage.setItem("CheemsAppLiFontSize", FontSize);
    Redirect("settings.html");
}

function Redirect(url) {
    KeepMusic();
    window.location.href = url;
}

function ChooseByTheme() {
    switch (theme) {
        case 0:
            return "light-theme";
        case 1:
            return "dark-theme";
        case 2:
            return "contrast-theme";
    }
}