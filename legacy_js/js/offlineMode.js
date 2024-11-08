function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function DownloadImages() {
    IMG = document.getElementById("loadableIMG");
    IMGLabel = document.getElementById("process-images");
    images = [
        "img/cheems/3d.png",
        "img/cheems/adult.png",
        "img/cheems/black.png",
        "img/cheems/elegant.png",
        "img/cheems/kid.png",
        "img/cheems/little.png",
        "img/cheems/mamado.png",
        "img/cheems/normal.png",
        "img/cheems/pixelart.png",
        "img/hit/3d.png",
        "img/hit/adult.png",
        "img/hit/black.png",
        "img/hit/elegant.png",
        "img/hit/kid.png",
        "img/hit/little.png",
        "img/hit/mamado.png",
        "img/hit/normal.png",
        "img/hit/pixelart.png",
        "img/dogecoin-min.png",
        "img/dogecoin.png",
        "img/locked-cheems.png",
        "img/icons/application-svgrepo-com.svg",
        "img/icons/back.png",
        "img/icons/black-music-svgrepo-com.svg",
        "img/icons/cart.png",
        "img/icons/earphone-svgrepo-com.svg",
        "img/icons/front-page-svgrepo-com.svg",
        "img/icons/link-svgrepo-com.svg",
        "img/icons/lock-keyhole-minimalistic-svgrepo-com.svg",
        "img/icons/lock-keyhole-minimalistic-unlocked-svgrepo-com.svg",
        "img/icons/menu-svgrepo-com.svg",
        "img/icons/music-svgrepo-com.svg",
        "img/icons/personal-svgrepo-com.svg",
        "img/icons/picture-svgrepo-com.svg",
        "img/icons/play-svgrepo-com.svg",
        "img/icons/report-svgrepo-com.svg",
        "img/icons/set-up-svgrepo-com.svg",
        "img/icons/shopping-svgrepo-com.svg",
        "img/icons/sound-svgrepo-com.svg",
        "img/icons/the-internet-svgrepo-com.svg",
        "img/icons/trophy-svgrepo-com.svg",
        "img/icons/volume-cross-svgrepo-com.svg",
        "img/icons/volume-loud-svgrepo-com.svg",
        "img/icons/volume-small-svgrepo-com.svg"
    ];
    IMGLabel.innerHTML = "Descargando Imagenes...";
    for (i = 0; i < images.length; i++) {
        IMG.src = images[i];
        console.log(images[i]);
        await sleep(250);
    }
    IMGLabel.innerHTML = "Imagenes Descargadas!!!";
    IMG.src = "img/locked-cheems.png";
}

async function DownloadScripts() {
    const resources = [
        "index.html",
        "game.html",
        "closet.html",
        "comming_soon.html",
        "dev.html",
        "download-repos.html",
        "menu.html",
        "settings.html",
        "js/buttons.js",
        "js/functions.js",
        "index.js",
        "main.js",
        "offlineMode.js",
        "SoundDefinitions.js",
        "css/index.css",
        "licences/electro-electro-summer-positive-party-141081-license.txt",
        "licences/futuro-bajo-titanium-170190-license.txt",
        "licences/futuro-bajo-trap-future-bass-royalty-free-music-167020-license.txt",
        "licences/guitarra-solista-separation-185196-license.txt"
    ];
    const container = document.getElementById("resource-container");
    const label = document.getElementById("process-resources");

    label.innerHTML = "Descargando recursos...";

    const resourceMap = {};

    for (let i = 0; i < resources.length; i++) {
        const resourceUrl = resources[i];
        const extension = resourceUrl.split('.').pop();
        let element;

        switch (extension) {
            case 'css':
                element = resourceMap['css'] || document.createElement('link');
                element.rel = 'stylesheet';
                element.href = resourceUrl;
                resourceMap['css'] = element;
                break;
            case 'js':
                element = resourceMap['js'] || document.createElement('script');
                element.src = resourceUrl;
                resourceMap['js'] = element;
                break;
            case 'html':
            case 'txt':
                element = resourceMap['html'] || document.createElement('object');
                element.data = resourceUrl;
                resourceMap['html'] = element;
                break;
            default:
                console.error(`Tipo de archivo no soportado: ${extension}`);
                continue;
        }
        container.innerHTML = '';
        container.appendChild(element);
        container.innerHTML = `<p>${resourceUrl}</p>`+container.innerHTML;

        console.log(`Descargando ${resourceUrl}`);
        await sleep(250);
    }
    container.innerHTML = 'Contenedor de scripts...';
    label.innerHTML = "Recursos descargados!";
}

async function DownloadSounds() {
    SND = document.getElementById("loadableSound");
    SNDLabel = document.getElementById("process-sounds");
    sounds = [
        "sound/discord-connect.ogg",
        "sound/discord-disconnect.ogg",
        "sound/discord-msg.ogg",
        "sound/hello.ogg",
        "sound/hit-minecraft.ogg",
        "sound/hit.ogg",
        "sound/hurt-minecraft.ogg",
        "sound/hurt-roblox.ogg",
        "sound/levelup1.ogg",
        "sound/levelup2.ogg",
        "sound/no.ogg",
        "sound/pato.ogg",
        "sound/peluche.ogg",
        "sound/splat.ogg",
        "sound/windows-error.ogg"
    ];
    SNDLabel.innerHTML = "Descargando Efectos de sonido...";
    for (i = 0; i < sounds.length; i++) {
        SND.src = sounds[i];
        console.log(sounds[i]);
        await sleep(250);
    }
    SNDLabel.innerHTML = "Efectos de sonido Descargados!!!";
    SND.src = "";
}