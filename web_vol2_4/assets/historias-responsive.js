/* HISTORIAS — responsive
   Desde 761px escala el "escenario" (fondo + elementos, 1600×897) para que entre
   completo en la pantalla y quede centrado. En celular, al tocar un objeto,
   la pantalla se desplaza para mostrarlo. */
(function () {
    var STAGE_W = 1600, STAGE_H = 897;
    // Mismas condiciones que la vista de celular en historias-responsive.css
    var MOBILE = window.matchMedia('(max-width: 760px), (orientation: portrait) and (max-width: 1100px)');
    var layers = [document.querySelector('.background-locked'), document.querySelector('.container')];

    function fit() {
        var w = document.documentElement.clientWidth;
        var h = window.innerHeight;
        layers.forEach(function (el) {
            if (!el) return;
            if (MOBILE.matches) { el.style.transform = ''; return; }
            var s = Math.min(w / STAGE_W, h / STAGE_H);
            var x = (w - STAGE_W * s) / 2;
            var y = (h - STAGE_H * s) / 2;
            el.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
        });
    }

    document.addEventListener('click', function (e) {
        if (!MOBILE.matches) return;
        if (!e.target.closest('.blue-box')) return;
        var screen = document.querySelector('.screen-frame');
        if (screen) screen.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, true);

    fit();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 80); });
})();
