document.addEventListener('keyup', (e) => {
    if (e.code == 'Space')
    {
        ClickCheems();
        setTimeout(() => {
            NoClick();
        }, 1000)
    }
});