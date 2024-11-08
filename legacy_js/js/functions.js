navigator.serviceWorker.register("./sw.js");
navigator.serviceWorker.register("./pwabuilder-adv-sw.js");

function RemoveSelectedCheems()
{
    BC1.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC2.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC3.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC4.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC5.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC6.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC7.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC8.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BC9.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
}
function RemoveSelectedSound()
{
    BS1.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS2.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS3.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS4.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS5.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS6.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS7.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS8.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS9.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS10.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS11.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BS12.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
}
function RemoveSelectedSong()
{
    BM1.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BM2.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BM3.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BM4.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BM5.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
    BM6.classList.remove('selected-cheems', "light-theme", "dark-theme", "contrast-theme");
}

function LoadFirst() {
    musicTime = 0;
    localStorage.setItem("CheemsAppLiMusicTime", musicTime);
    points = 0;
    localStorage.setItem("CheemsAppLiActPoints", points);
    LoadTheme();
    LoadAccesibility();
}

function LoadAll()
{
    Selcheems = localStorage.getItem("CheemsAppLiSelCheems");
    SelSound = localStorage.getItem("CheemsAppLiSelSound");
    SelMusic = parseInt(localStorage.getItem("CheemsAppLiSelMusic"));
    musicTime = parseFloat(localStorage.getItem("CheemsAppLiMusicTime"));
    totalCount = parseInt(localStorage.getItem("CheemsAppLiTotalCounter"));
    maxCount = parseInt(localStorage.getItem("CheemsAppLiMaxCounter"));
    points = parseInt(localStorage.getItem("CheemsAppLiPoints"));
    dogeCoins = parseInt(localStorage.getItem("CheemsAppLiDogecoins"));
    clickable = localStorage.getItem("CheemsAppLiClickable");
    thisCount = parseInt(localStorage.getItem("CheemsAppLiActPoints"));
    if (isNaN(totalCount))
    {
        totalCount = 0;
        let totalCountP = JSON.stringify(totalCount);
        localStorage.setItem("CheemsAppLiTotalCounter", totalCountP);
    }
    if (isNaN(maxCount))
    {
        maxCount = 0;
        let maxCountP = JSON.stringify(maxCount);
        localStorage.setItem("CheemsAppLiMaxCounter", maxCountP);
    }
    if (isNaN(points))
    {
        points = 0;
        let pointsP = JSON.stringify(points);
        localStorage.setItem("CheemsAppLiPoints", pointsP);
    }
    if (isNaN(dogeCoins))
    {
        dogeCoins = 0;
        let dogeCoinsP = JSON.stringify(dogeCoins);
        localStorage.setItem("CheemsAppLiDogecoins", dogeCoinsP);
    }
    if (Selcheems == '[object Undefined]' || Selcheems == null || Selcheems == "undefined")
    {
        Selcheems = "normal";
        let SelCheemsP = JSON.stringify(Selcheems);
        localStorage.setItem("CheemsAppLiSelCheems", SelCheemsP);
    } else {
        Selcheems = Selcheems.replace('"','');
        Selcheems = Selcheems.replace('"','');
    }
    if (SelSound == '[object Undefined]' || SelSound == null || SelSound == "undefined")
    {
        SelSound = 1;
        let SelSoundP = JSON.stringify(SelSound);
        localStorage.setItem("CheemsAppLiSelSound", SelSoundP);
    }
    if (clickable == '[object Undefined]' || clickable == null || clickable == "undefined")
    {
        clickable = "true";
        localStorage.setItem("CheemsAppLiClickable", clickable);
    } else {
        clickable = "true";
        localStorage.setItem("CheemsAppLiClickable", clickable);
    }
    if (isNaN(SelMusic) || SelMusic == null) {
        SelMusic = 1;
        localStorage.setItem("CheemsAppLiSelMusic", SelMusic);
    }
    if (isNaN(musicTime) || musicTime == null) {
        musicTime = 0;
        localStorage.setItem("CheemsAppLiMusicTime", musicTime);
    }
    LoadMusicVolume(false);
    LoadEffectsVolume(false);
    PlayMusic(SelMusic, musicTime);
    LoadAccesibility();
    LoadTheme();
    PrintChanges();
}

function LoadCloset()
{
    Selcheems = localStorage.getItem("CheemsAppLiSelCheems");
    Selcheems = Selcheems.replace('"','');
    Selcheems = Selcheems.replace('"','');
    SelSound = localStorage.getItem("CheemsAppLiSelSound");
    SelMusic = parseInt(localStorage.getItem("CheemsAppLiSelMusic"));
    musicTime = parseFloat(localStorage.getItem("CheemsAppLiMusicTime"));
    points = parseInt(localStorage.getItem("CheemsAppLiPoints")) + 1 - 1;
    dogeCoins = parseInt(localStorage.getItem("CheemsAppLiDogecoins")) + 1 - 1;
    LoadMusicVolume(false);
    LoadEffectsVolume(false);
    PlayMusic(SelMusic, musicTime);
    LoadTheme();
    LoadAccesibility();
    PrintChangesS();
    CheckPurchases();
    LoadSelection();
}

function LoadSelection() {
    CheckSound();
    CheckSong();
    CheckSelected();
    LoadAccesibility();
    CheckPurchases();
    PrintChangesS();
}

function LoadMenu() {
    SelSound = localStorage.getItem("CheemsAppLiSelSound");
    SelMusic = parseInt(localStorage.getItem("CheemsAppLiSelMusic"));
    musicTime = parseFloat(localStorage.getItem("CheemsAppLiMusicTime"));
    devMenu = localStorage.getItem("CheemsAppLiDevMenu");
    if (devMenu == null || devMenu == "[object Undefined]") {
        devMenu = "false";
        localStorage.setItem("CheemsAppLiDevMenu", devMenu);
    } else if (devMenu == "true") {
        document.getElementById("dev-menu").classList.remove("hidden");
    } else {
        document.getElementById("dev-menu").classList.add("hidden");
    }
    LoadMusicVolume(false);
    LoadEffectsVolume(false);
    LoadTheme();
    LoadAccesibility();
    PlayMusic(SelMusic, musicTime);
}

function LoadGeneral() {
    SelSound = localStorage.getItem("CheemsAppLiSelSound");
    SelMusic = parseInt(localStorage.getItem("CheemsAppLiSelMusic"));
    musicTime = parseFloat(localStorage.getItem("CheemsAppLiMusicTime"));
    LoadMusicVolume(false);
    LoadEffectsVolume(false);
    LoadTheme();
    LoadAccesibility();
    PlayMusic(SelMusic, musicTime);
}

function LoadSettings() {
    SelSound = localStorage.getItem("CheemsAppLiSelSound");
    SelMusic = parseInt(localStorage.getItem("CheemsAppLiSelMusic"));
    musicTime = parseFloat(localStorage.getItem("CheemsAppLiMusicTime"));
    LoadMusicVolume(true);
    LoadEffectsVolume(true);
    LoadTheme();
    LoadAccesibility();
    PlayMusic(SelMusic, musicTime);
}

function ResetToZero()
{
    let SelCheems;
    maxCount = 0;
    totalCount = 0;
    thisCount = 0;
    points = 0;
    dogeCoins = 0;
    SelSound = 1;
    SelMusic = 1;
    effVol = 100;
    musVol = 50;
    musicTime = 0;
    Selcheems = "normal";
    theme = 0;
    let a = JSON.stringify(false);
    let b = JSON.stringify(true);
    localStorage.setItem('c1', b);
    localStorage.setItem('c2', a);
    localStorage.setItem('c3', a);
    localStorage.setItem('c4', a);
    localStorage.setItem('c5', a);
    localStorage.setItem('c6', a);
    localStorage.setItem('c7', a);
    localStorage.setItem('c8', a);
    localStorage.setItem('c9', a);
    localStorage.setItem("s1", b);
    localStorage.setItem("s2", a);
    localStorage.setItem("s3", a);
    localStorage.setItem("s4", a);
    localStorage.setItem("s5", a);
    localStorage.setItem("s6", a);
    localStorage.setItem("s7", a);
    localStorage.setItem("s8", a);
    localStorage.setItem("s9", a);
    localStorage.setItem("s10", a);
    localStorage.setItem("s11", a);
    localStorage.setItem("s12", a);
    localStorage.setItem("CheemsAppLiM1", b);
    localStorage.setItem("CheemsAppLiM2", a);
    localStorage.setItem("CheemsAppLiM3", a);
    localStorage.setItem("CheemsAppLiM4", a);
    localStorage.setItem("CheemsAppLiM5", a);
    localStorage.setItem("CheemsAppLiM6", a);
    localStorage.setItem("CheemsAppLiMaxCounter", maxCount);
    localStorage.setItem("CheemsAppLiPoints", points);
    localStorage.setItem("CheemsAppLiTotalCounter", totalCount);
    localStorage.setItem("CheemsAppLiDogecoins", dogeCoins);
    localStorage.setItem("CheemsAppLiSelCheems", SelCheems);
    localStorage.setItem("CheemsAppLiClickable", clickable);
    localStorage.setItem("CheemsAppLiSelSound", SelSound);
    localStorage.setItem("CheemsAppLiSelMusic", SelMusic);
    localStorage.setItem("CheemsAppLiMusicVolume", musVol);
    localStorage.setItem("CheemsAppLiEffectsVolume", effVol);
    localStorage.setItem("CheemsAppLiMusicTime", musicTime);
    localStorage.setItem("CheemsAppLiActTheme", theme);
    Redirect("index.html");
}

function UnlockAll() {
    let SelCheems;
    maxCount = 999999;
    totalCount = 999999;
    thisCount = 0;
    points = 999999;
    dogeCoins = 999999;
    SelSound = 1;
    SelMusic = 1;
    effVol = 100;
    musVol = 50;
    musicTime = 0;
    Selcheems = "normal";
    theme = 1;
    let a = JSON.stringify(true);
    let b = JSON.stringify(true);
    localStorage.setItem('c1', b);
    localStorage.setItem('c2', a);
    localStorage.setItem('c3', a);
    localStorage.setItem('c4', a);
    localStorage.setItem('c5', a);
    localStorage.setItem('c6', a);
    localStorage.setItem('c7', a);
    localStorage.setItem('c8', a);
    localStorage.setItem('c9', a);
    localStorage.setItem("s1", b);
    localStorage.setItem("s2", a);
    localStorage.setItem("s3", a);
    localStorage.setItem("s4", a);
    localStorage.setItem("s5", a);
    localStorage.setItem("s6", a);
    localStorage.setItem("s7", a);
    localStorage.setItem("s8", a);
    localStorage.setItem("s9", a);
    localStorage.setItem("s10", a);
    localStorage.setItem("s11", a);
    localStorage.setItem("s12", a);
    localStorage.setItem("CheemsAppLiM1", b);
    localStorage.setItem("CheemsAppLiM2", a);
    localStorage.setItem("CheemsAppLiM3", a);
    localStorage.setItem("CheemsAppLiM4", a);
    localStorage.setItem("CheemsAppLiM5", a);
    localStorage.setItem("CheemsAppLiM6", a);
    localStorage.setItem("CheemsAppLiMaxCounter", maxCount);
    localStorage.setItem("CheemsAppLiPoints", points);
    localStorage.setItem("CheemsAppLiTotalCounter", totalCount);
    localStorage.setItem("CheemsAppLiDogecoins", dogeCoins);
    localStorage.setItem("CheemsAppLiSelCheems", SelCheems);
    localStorage.setItem("CheemsAppLiClickable", clickable);
    localStorage.setItem("CheemsAppLiSelSound", SelSound);
    localStorage.setItem("CheemsAppLiSelMusic", SelMusic);
    localStorage.setItem("CheemsAppLiMusicVolume", musVol);
    localStorage.setItem("CheemsAppLiEffectsVolume", effVol);
    localStorage.setItem("CheemsAppLiMusicTime", musicTime);
    localStorage.setItem("CheemsAppLiActTheme", theme);
    Redirect("index.html");
}

function SaveCountChanges()
{
    let sum = 1;
    thisCount += sum;
    if (maxCount < thisCount)
    {
        maxCount = thisCount;
        let maxCountP = JSON.stringify(maxCount);
        localStorage.setItem("CheemsAppLiMaxCounter", maxCountP);
    }
    totalCount += sum;
    let totalCountP = JSON.stringify(totalCount);
    localStorage.setItem("CheemsAppLiTotalCounter", totalCountP);
    points += sum;
    let pointsP = JSON.stringify(points);
    localStorage.setItem("CheemsAppLiPoints", pointsP);
    localStorage.setItem("CheemsAppLiActPoints", thisCount);
}

function BuyDogeCoins()
{
    PlaySound(SelSound);
    if (points >= DGC)
    {
        points -= DGC;
        dogeCoins += 1;
        let pointsP = JSON.stringify(points);
        let dogeCoinsP = JSON.stringify(dogeCoins);
        localStorage.setItem("CheemsAppLiPoints", pointsP);
        localStorage.setItem("CheemsAppLiDogecoins", dogeCoinsP);
        shopTextS.innerHTML = 'Compraste 1 DogeCoin';
        setTimeout(() => {
            shopTextS.innerHTML = 'Tienda';
        }, (STTimer+=3000));
        LoadShop();
    } else {
        shopTextS.innerHTML = '¡NECESITAS ' + String(DGC - points) + ' pts. MÁS!';
        setTimeout(() => {
            shopTextS.innerHTML = 'Tienda';
        }, (STTimer+=3000));
    }
}

function BuyCheems(a)
{
    PlaySound(SelSound);
    switch (a)
    {
        case "normal":
            BuyAnyCheems(0, a, c1, 1);
        break;
        case "little":
            BuyAnyCheems(1, a, c2, 2);
        break;
        case "adult":
            BuyAnyCheems(2, a, c3, 3);
        break;
        case "kid":
            BuyAnyCheems(3, a, c4, 4);
        break;
        case "mamado":
            BuyAnyCheems(5, a, c5, 5);
        break;
        case "pixelart":
            BuyAnyCheems(12, a, c6, 6);
        break;
        case "elegant":
            BuyAnyCheems(13, a, c7, 7);
        break;
        case "3d":
            BuyAnyCheems(7, a, c8, 8);
        break;
        case "black":
            BuyAnyCheems(10, a, c9, 9);
        break;
    }
    LoadShop();
}

function BuySound(a)
{
    switch (a)
    {
        case 1:
            BuyAnySound(s1, 1, '"Hit"', 0);
        break;
        case 2:
            BuyAnySound(s2, 2, '"Hurt Minecraft"', 7);
        break;
        case 3:
            BuyAnySound(s3, 3, '"Hurt Roblox"', 6);
        break;
        case 4:
            BuyAnySound(s4, 4, '"Level Up Minecraft"', 8);
        break;
        case 5:
            BuyAnySound(s5, 5, '"Discord"', 8);
        break;
        case 6:
            BuyAnySound(s6, 6, '"Hello FNAF"', 6);
        break;
        case 7:
            BuyAnySound(s7, 7, '"Hit Minecraft"', 4);
        break;
        case 8:
            BuyAnySound(s8, 8, '"NO"', 11);
        break;
        case 9:
            BuyAnySound(s9, 9, '"Duck"', 3);
        break;
        case 10:
            BuyAnySound(s10, 10, '"Toy"', 3);
        break;
        case 11:
            BuyAnySound(s11, 11, '"Splat"', 3);
        break;
        case 12:
            BuyAnySound(s12, 12, '"Error Windows"', 5);
        break;
    }
    setTimeout(() => {
        PlaySound(SelSound);
    }, 50);
    LoadShop();
}

function CheckPurchases()
{
    c2 = localStorage.getItem('c2');
    c3 = localStorage.getItem('c3');
    c4 = localStorage.getItem('c4');
    c5 = localStorage.getItem('c5');
    c6 = localStorage.getItem('c6');
    c7 = localStorage.getItem('c7');
    c8 = localStorage.getItem('c8');
    c9 = localStorage.getItem('c9');
    s1 = localStorage.getItem('s1');
    s2 = localStorage.getItem('s2');
    s3 = localStorage.getItem('s3');
    s4 = localStorage.getItem('s4');
    s5 = localStorage.getItem('s5');
    s6 = localStorage.getItem('s6');
    s7 = localStorage.getItem('s7');
    s8 = localStorage.getItem('s8');
    s9 = localStorage.getItem('s9');
    s10 = localStorage.getItem('s10');
    s11 = localStorage.getItem('s11');
    s12 = localStorage.getItem('s12');
    m1 = localStorage.getItem("CheemsAppLiM1");
    m2 = localStorage.getItem("CheemsAppLiM2");
    m3 = localStorage.getItem("CheemsAppLiM3");
    m4 = localStorage.getItem("CheemsAppLiM4");
    m5 = localStorage.getItem("CheemsAppLiM5");
    m6 = localStorage.getItem("CheemsAppLiM6");
    let a = JSON.stringify(false);
    let b = JSON.stringify(true);

    if (c1 == '[object Undefined]' || c1 == null)
    {
        localStorage.setItem('c1', b);
        c1 = localStorage.getItem('c1');
    }
    if (c2 == '[object Undefined]' || c2 == null)
    {
        localStorage.setItem('c2', a);
        c2 = localStorage.getItem('c2');
    }
    if (c3 == '[object Undefined]' || c3 == null)
    {
        localStorage.setItem('c3', a);
        c3 = localStorage.getItem('c3');
    }
    if (c4 == '[object Undefined]' || c4 == null)
    {
        localStorage.setItem('c4', a);
        c4 = localStorage.getItem('c4');
    }
    if (c5 == '[object Undefined]' || c5 == null)
    {
        localStorage.setItem('c5', a);
        c5 = localStorage.getItem('c5');
    }
    if (c6 == '[object Undefined]' || c6 == null)
    {
        localStorage.setItem('c6', a);
        c6 = localStorage.getItem('c6');
    }
    if (c7 == '[object Undefined]' || c7 == null)
    {
        localStorage.setItem('c7', a);
        c7 = localStorage.getItem('c7');
    }
    if (c8 == '[object Undefined]' || c8 == null)
    {
        localStorage.setItem('c8', a);
        c8 = localStorage.getItem('c8');
    }
    if (c9 == '[object Undefined]' || c9 == null)
    {
        localStorage.setItem('c9', a);
        c9 = localStorage.getItem('c9');
    }
    if (s1 == '[object Undefined]' || s1 == null)
    {
        localStorage.setItem('s1', b);
        s1 = localStorage.getItem('s1');
    }
    if (s2 == '[object Undefined]' || s2 == null)
    {
        localStorage.setItem('s2', a);
        s2 = localStorage.getItem('s2');
    }
    if (s3 == '[object Undefined]' || s3 == null)
    {
        localStorage.setItem('s3', a);
        s3 = localStorage.getItem('s3');
    }
    if (s4 == '[object Undefined]' || s4 == null)
    {
        localStorage.setItem('s4', a);
        s4 = localStorage.getItem('s4');
    }
    if (s5 == '[object Undefined]' || s5 == null)
    {
        localStorage.setItem('s5', a);
        s5 = localStorage.getItem('s5');
    }
    if (s6 == '[object Undefined]' || s6 == null)
    {
        localStorage.setItem('s6', a);
        s6 = localStorage.getItem('s6');
    }
    if (s7 == '[object Undefined]' || s7 == null)
    {
        localStorage.setItem('s7', a);
        s7 = localStorage.getItem('s7');
    }
    if (s8 == '[object Undefined]' || s8 == null)
    {
        localStorage.setItem('s8', a);
        s8 = localStorage.getItem('s8');
    }
    if (s9 == '[object Undefined]' || s9 == null)
    {
        localStorage.setItem('s9', a);
        s9 = localStorage.getItem('s9');
    }
    if (s10 == '[object Undefined]' || s10 == null)
    {
        localStorage.setItem('s10', a);
        s10 = localStorage.getItem('s10');
    }
    if (s11 == '[object Undefined]' || s11 == null)
    {
        localStorage.setItem('s11', a);
        s11 = localStorage.getItem('s11');
    }
    if (s12 == '[object Undefined]' || s12 == null)
    {
        localStorage.setItem('s12', a);
        s12 = localStorage.getItem('s12');
    }
    if (m1 == '[object Undefined]' || m1 == null) {
        m1 = "true";
        localStorage.setItem("CheemsAppLiM1", m1);
    }
    if (m2 == '[object Undefined]' || m2 == null) {
        m2 = "false";
        localStorage.setItem("CheemsAppLiM2", m2);
    }
    if (m3 == '[object Undefined]' || m3 == null) {
        m3 = "false";
        localStorage.setItem("CheemsAppLiM3", m3);
    }
    if (m4 == '[object Undefined]' || m4 == null) {
        m4 = "false";
        localStorage.setItem("CheemsAppLiM4", m4);
    }
    if (m5 == '[object Undefined]' || m5 == null) {
        m5 = "false";
        localStorage.setItem("CheemsAppLiM5", m5);
    }
    if (m6 == '[object Undefined]' || m6 == null) {
        m6 = "false";
        localStorage.setItem("CheemsAppLiM6", m6);
    }
    CheckSound();
    CheckSelected();
    CheckSong();
}

function BuyAnySound(sound, nSound, string, cost)
{
    let fv = JSON.stringify(true);
    if (sound == 'true')
            {
                SelSound = nSound;
                SSP = JSON.stringify(SelSound);
                localStorage.setItem("CheemsAppLiSelSound", SSP);
                shopTextS.innerHTML = 'Sonido ' + string + ' Seleccionado';
                setTimeout(() => {
                    shopTextS.innerHTML = 'Tienda';
                }, (STTimer+=3000));
            } else {
                if (dogeCoins >= cost)
                {
                    dogeCoins -= cost;
                    let dogeCoinsP = JSON.stringify(dogeCoins);
                    localStorage.setItem("CheemsAppLiDogecoins", dogeCoinsP);
                    localStorage.setItem('s'+String(nSound), fv);
                    sound = localStorage.getItem('s'+String(nSound));
                    SelSound = nSound;
                    let SSP = JSON.stringify(SelSound);
                    localStorage.setItem("CheemsAppLiSelSound", SSP);
                    shopTextS.innerHTML = 'Sonido ' + string + ' Comprado';
                    setTimeout(() => {
                        shopTextS.innerHTML = 'Tienda';
                    }, (STTimer+=3000));
                } else {
                    shopTextS.innerHTML = '¡Necesitas ' + String(cost - dogeCoins) + ' DogeCoins Más!';
                    setTimeout(() => {
                        shopTextS.innerHTML = 'Tienda';
                    }, (STTimer+=3000));
                }
            }
}

function BuyAnyCheems(cost, nCheems, cheems, num)
{
    let b = JSON.stringify(true);
    if (cheems == 'true')
            {
                Selcheems = nCheems;
                let SelCheemsP = JSON.stringify(Selcheems);
                localStorage.setItem("CheemsAppLiSelCheems", SelCheemsP);
                shopTextS.innerHTML = 'Cheems ' + nCheems + ' Seleccionado';
                setTimeout(() => {
                    shopTextS.innerHTML = 'Tienda';
                }, (STTimer+=3000));
            } else {
                if (dogeCoins >= cost)
                {
                    dogeCoins -= cost;
                    let dogeCoinsP = JSON.stringify(dogeCoins);
                    localStorage.setItem("CheemsAppLiDogecoins", dogeCoinsP);
                    localStorage.setItem('c'+String(num), b);
                    cheems = localStorage.getItem('c'+String(num));
                    Selcheems = nCheems;
                    let SelCheemsP = JSON.stringify(Selcheems);
                    localStorage.setItem("CheemsAppLiSelCheems", SelCheemsP);
                    shopTextS.innerHTML = 'Cheems ' + nCheems + ' Comprado';
                    setTimeout(() => {
                        shopTextS.innerHTML = 'Tienda';
                    }, (STTimer+=3000));
                } else {
                    shopTextS.innerHTML = '¡Necesitas ' + String(cost - dogeCoins) + ' DogeCoins Más!';
                    setTimeout(() => {
                        shopTextS.innerHTML = 'Tienda';
                    }, (STTimer+=3000));
                }
            }
}

function CheckSelected()
{
    if (c1 == 'false')
    {
        BC1.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC1.setAttribute('src', 'img/cheems/normal.png');
    }
    if (c2 == 'false')
    {
        BC2.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC2.setAttribute('src', 'img/cheems/little.png');
    }
    if (c3 == 'false')
    {
        BC3.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC3.setAttribute('src', 'img/cheems/adult.png');
    }
    if (c4 == 'false')
    {
        BC4.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC4.setAttribute('src', 'img/cheems/kid.png');
    }
    if (c5 == 'false')
    {
        BC5.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC5.setAttribute('src', 'img/cheems/mamado.png');
    }
    if (c6 == 'false')
    {
        BC6.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC6.setAttribute('src', 'img/cheems/pixelart.png');
    }
    if (c7 == 'false')
    {
        BC7.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC7.setAttribute('src', 'img/cheems/elegant.png');
    }
    if (c8 == 'false')
    {
        BC8.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC8.setAttribute('src', 'img/cheems/3d.png');
    }
    if (c9 == 'false')
    {
        BC9.setAttribute('src', 'img/locked-cheems.png');
    } else {
        BC9.setAttribute('src', 'img/cheems/black.png');
    }

    RemoveSelectedCheems();
    switch (Selcheems)
    {
        case 'normal':
            BC1.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 'little':
            BC2.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 'adult':
            BC3.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 'kid':
            BC4.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 'mamado':
            BC5.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 'pixelart':
            BC6.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 'elegant':
            BC7.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '3d':
            BC8.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 'black':
            BC9.classList.add('selected-cheems', ChooseByTheme());
        break;
    }
}

function CheckSound()
{
    if (s1 == 'false')
    {
        BS1.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS1.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s2 == 'false')
    {
        BS2.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS2.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s3 == 'false')
    {
        BS3.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS3.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s4 == 'false')
    {
        BS4.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS4.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s5 == 'false')
    {
        BS5.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS5.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s6 == 'false')
    {
        BS6.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS6.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s7 == 'false')
    {
        BS7.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS7.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s8 == 'false')
    {
        BS8.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS8.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s9 == 'false')
    {
        BS9.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS9.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s10 == 'false')
    {
        BS10.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS10.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s11 == 'false')
    {
        BS11.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS11.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    if (s12 == 'false')
    {
        BS12.setAttribute('src', 'img/icons/volume-cross-svgrepo-com.svg');
    } else {
        BS12.setAttribute('src', 'img/icons/volume-loud-svgrepo-com.svg');
    }
    
    RemoveSelectedSound();
    switch (SelSound)
    {
        case '1':
            BS1.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '2':
            BS2.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '3':
            BS3.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '4':
            BS4.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '5':
            BS5.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '6':
            BS6.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '7':
            BS7.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '8':
            BS8.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '9':
            BS9.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '10':
            BS10.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '11':
            BS11.classList.add('selected-cheems', ChooseByTheme());
        break;
        case '12':
            BS12.classList.add('selected-cheems', ChooseByTheme());
        break;
    }
}

function CheckSong()
{
    if (m1 == 'false')
    {
        BM1.setAttribute('src', 'img/icons/black-music-svgrepo-com.svg');
    } else {
        BM1.setAttribute('src', 'img/icons/music-svgrepo-com.svg');
    }
    if (m2 == 'false')
    {
        BM2.setAttribute('src', 'img/icons/black-music-svgrepo-com.svg');
    } else {
        BM2.setAttribute('src', 'img/icons/music-svgrepo-com.svg');
    }
    if (m3 == 'false')
    {
        BM3.setAttribute('src', 'img/icons/black-music-svgrepo-com.svg');
    } else {
        BM3.setAttribute('src', 'img/icons/music-svgrepo-com.svg');
    }
    if (m4 == 'false')
    {
        BM4.setAttribute('src', 'img/icons/black-music-svgrepo-com.svg');
    } else {
        BM4.setAttribute('src', 'img/icons/music-svgrepo-com.svg');
    }
    if (m5 == 'false')
    {
        BM5.setAttribute('src', 'img/icons/black-music-svgrepo-com.svg');
    } else {
        BM5.setAttribute('src', 'img/icons/music-svgrepo-com.svg');
    }
    if (m6 == 'false')
    {
        BM6.setAttribute('src', 'img/icons/black-music-svgrepo-com.svg');
    } else {
        BM6.setAttribute('src', 'img/icons/music-svgrepo-com.svg');
    }
    
    RemoveSelectedSong();
    switch (SelMusic)
    {
        case 1:
            BM1.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 2:
            BM2.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 3:
            BM3.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 4:
            BM4.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 5:
            BM5.classList.add('selected-cheems', ChooseByTheme());
        break;
        case 6:
            BM6.classList.add('selected-cheems', ChooseByTheme());
        break;
    }
}

function ChangeCheems(a, b) {
    let canChange = false;
    if (b == 'true') {
        canChange = true;
    }
    if (canChange) {
        Selcheems = a;
        localStorage.setItem("CheemsAppLiSelCheems", a);
    }
    PlaySound(SelSound);
    LoadSelection();
}

function ChangeSound(a, b) {
    let canChange = false;
    if (b == 'true') {
        canChange = true;
    }
    if (canChange) {
        SelSound = a;
        localStorage.setItem("CheemsAppLiSelSound", a);
    }
    PlaySound(SelSound);
    LoadSelection();
}

function ChangeSong(a, b) {
    let canChange = false;
    if (b == 'true') {
        canChange = true;
    }
    if (canChange) {
        SelMusic = a;
        localStorage.setItem("CheemsAppLiSelMusic", a);
        ReplaySong();
    }
    PlaySound(SelSound);
    LoadSelection();
}

function EnableDevOptions() {
    if (devMenu == "true") {
        devMenu = "false";
        document.getElementById("dev-menu").classList.add("hidden");
    } else {
        devMenu = "true";
        document.getElementById("dev-menu").classList.remove("hidden");
    }
    localStorage.setItem("CheemsAppLiDevMenu", devMenu);
}