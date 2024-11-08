var sound = new Audio();
var music = new Audio();
var effVol = 100, musVol = 50;

function PlaySound(a) {
    let Random;
    switch (a)
    {
        case '1':
            sound = new Audio('./sound/hit.ogg');
        break;
        case '2':
            sound = new Audio('./sound/hurt-minecraft.ogg');
        break;
        case '3':
            sound = new Audio('./sound/hurt-roblox.ogg');
        break;
        case '4':
            Random = Math.floor(Math.random()*5)+1;
            if (Random == 4)
            {
                sound = new Audio('./sound/levelup2.ogg');
            } else {
                sound = new Audio('./sound/levelup1.ogg');
            }
        break;
        case '5':
            Random = Math.floor(Math.random()*3)+1;
            if (Random == 1)
            {
                sound = new Audio('./sound/discord-connect.ogg');
            } else if (Random == 2) {
                sound = new Audio('./sound/discord-disconnect.ogg');
            } else if (Random == 3) {
                sound = new Audio('./sound/discord-msg.ogg');
            }
        break;
        case '6':
            sound = new Audio('./sound/hello.ogg')
        break;
        case '7':
            sound = new Audio('./sound/hit-minecraft.ogg')
        break;
        case '8':
            sound = new Audio('./sound/no.ogg')
        break;
        case '9':
            sound = new Audio('./sound/pato.ogg')
        break;
        case '10':
            sound = new Audio('./sound/peluche.ogg')
        break;
        case '11':
            sound = new Audio('./sound/splat.ogg')
        break;
        case '12':
            sound = new Audio('./sound/windows-error.ogg')
        break;
    }
    sound.volume = effVol/100;
    sound.play();
}

function PlayMusic(a, t) {
    switch (a) {
        case 0:
            music.src = null;
        break;
        case 1:
            music.src = "./sound/music/A_Jazz_Piano.ogg";
        break;
        case 2:
            music.src = "./sound/music/Jack_Bootleg.ogg";
        break;
        case 3:
            music.src = "./sound/music/Magic_night.ogg";
        break;
        case 4:
            music.src = "./sound/music/Minimalism_No9.ogg";
        break;
        case 5:
            music.src = "./sound/music/Minimalism_No10.ogg";
        break;
        case 6:
            music.src = "./sound/music/When_you_smile.ogg";
        break;
    }
    music.currentTime = t;
    music.volume = musVol/100;
    music.loop = true;
    music.play();
}

function SetVolumeEffect() {
    let a = parseInt(document.getElementById("effect-volume").value);
    effVol = a;
    sound.volume = effVol/100;
    PlaySound(SelSound);
    console.log(effVol);
    localStorage.setItem("CheemsAppLiEffectsVolume", effVol);
    UpdateVolIcon("effects");
}

function LoadEffectsVolume(b) {
    let a = parseInt(localStorage.getItem("CheemsAppLiEffectsVolume"));
    effVol = a;
    if (isNaN(effVol)) {
        effVol = 100;
        sound.volume = effVol/100;
        localStorage.setItem("CheemsAppLiEffectsVolume", effVol);
    }
    sound.volume = effVol/100;
    if (b) {
        document.getElementById("effect-volume").value = effVol;
        UpdateVolIcon("effects");
    }
}

function SetVolumeMusic() {
    let a = parseInt(document.getElementById("music-volume").value);
    musVol = a;
    music.volume = musVol/100;
    localStorage.setItem("CheemsAppLiMusicVolume", musVol);
    UpdateVolIcon("music");
}

function LoadMusicVolume(b) {
    let a = parseInt(localStorage.getItem("CheemsAppLiMusicVolume"));
    musVol = a;
    if (isNaN(musVol)) {
        musVol = 50;
        music.volume = musVol/100;
        localStorage.setItem("CheemsAppLiMusicVolume", musVol);
    }
    music.volume = musVol/100;
    if (b) {
        document.getElementById("music-volume").value = musVol;
        UpdateVolIcon("music");
    }
}

function setVolCont(choose) {
    switch (choose) {
        case "music":
            if (musVol == 0) {
                musVol = 100;
                music.volume = musVol/100;
                localStorage.setItem("CheemsAppLiMusicVolume", musVol);
            } else {
                musVol = 0;
                music.volume = musVol/100;
                localStorage.setItem("CheemsAppLiMusicVolume", musVol);
            }
            document.getElementById("music-volume").value = musVol;
            console.log(musVol);
            UpdateVolIcon("music");
        break;
        case "effects":
            if (effVol == 0) {
                effVol = 100;
                sound.volume = effVol/100;
                localStorage.setItem("CheemsAppLiEffectsVolume", effVol);
            } else {
                effVol = 0;
                sound.volume = effVol/100;
                localStorage.setItem("CheemsAppLiEffectsVolume", effVol);
            }
            PlaySound(SelSound);
            document.getElementById("effect-volume").value = effVol;
            console.log(effVol);
            UpdateVolIcon("effects");
        break;
    }
}

function UpdateVolIcon(choose) {
    switch (choose) {
        case "music":
            if (musVol == 0) {
                document.getElementById("music-vol-icon").setAttribute("src", "img/icons/volume-cross-svgrepo-com.svg");
            } else if (musVol > 50) {
                document.getElementById("music-vol-icon").setAttribute("src", "img/icons/volume-loud-svgrepo-com.svg");
            } else if (musVol <= 50) {
                document.getElementById("music-vol-icon").setAttribute("src", "img/icons/volume-small-svgrepo-com.svg");
            }
            console.log("music icon");
        break;
        case "effects":
            if (effVol == 0) {
                document.getElementById("effects-vol-icon").setAttribute("src", "img/icons/volume-cross-svgrepo-com.svg");
            } else if (effVol > 50) {
                document.getElementById("effects-vol-icon").setAttribute("src", "img/icons/volume-loud-svgrepo-com.svg");
            } else if (effVol <= 50) {
                document.getElementById("effects-vol-icon").setAttribute("src", "img/icons/volume-small-svgrepo-com.svg");
            }
            console.log("effects icon");
        break;
    }
}

function ReplaySong() {
    music.pause();
    music.currentTime = 0;
    musicTime = 0;
    KeepMusic();
    PlayMusic(SelMusic, musicTime);
}

function KeepMusic() {
    musicTime = music.currentTime;
    localStorage.setItem("CheemsAppLiMusicTime", musicTime);
}

//startSimulation and pauseSimulation defined elsewhere
function handleVisibilityChange() {
    if (document.hidden) {
      music.pause();
    } else {
        music.play();
    }
  }
  
  document.addEventListener("visibilitychange", handleVisibilityChange, false);