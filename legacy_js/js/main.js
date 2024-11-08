setInterval(() => {
    if (img.classList.contains('full-size'))
    {
        img.classList.remove('full-size');
    }
    if (img.getAttribute('src') == ('img/hit/'+Selcheems+'.png') || img.getAttribute('src') == 'img/locked-cheems.png')
    {
        img.setAttribute('src', 'img/cheems/'+Selcheems+'.png');
    }
}, 1500);