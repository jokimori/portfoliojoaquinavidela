/* FENÓMENO — responsive
   1) Desde 820px escala el lienzo de 1440px en proporción al ancho de la pantalla
      (en 1440px queda al 75%, igual que el diseño original).
   2) Arma versiones simples de los dos gráficos para la vista de celular,
      leyendo las barras, colores y años del gráfico original. */
(function () {
    var BREAKPOINT = 820;
    // Mismas condiciones que la vista de celular en fenomeno-responsive.css
    var MOBILE = window.matchMedia('(max-width: 819px), (orientation: portrait) and (max-width: 1100px), (max-height: 500px)');
    var BASE_WIDTH = 1440;
    var BASE_SCALE = 0.75;
    var container = document.querySelector('.container');
    if (!container) return;

    function fit() {
        var w = document.documentElement.clientWidth;
        if (!MOBILE.matches) {
            container.style.transform = 'scale(' + (BASE_SCALE * w / BASE_WIDTH) + ')';
            container.style.transformOrigin = 'top center';
        } else {
            container.style.transform = '';
        }
    }

    function px(el, prop) { return parseFloat(getComputedStyle(el)[prop]) || 0; }

    function buildChart(barPrefix, yearPrefix, titleEl, extraClass) {
        var bars = Array.prototype.slice.call(document.querySelectorAll('[class^="' + barPrefix + '"]'));
        var years = Array.prototype.slice.call(document.querySelectorAll('[class^="' + yearPrefix + '"]'));
        if (!bars.length) return;
        bars.sort(function (a, b) { return px(a, 'left') - px(b, 'left'); });
        years.sort(function (a, b) { return px(a, 'left') - px(b, 'left'); });
        var max = Math.max.apply(null, bars.map(function (b) { return px(b, 'height'); }));

        var chart = document.createElement('div');
        chart.className = 'm-chart ' + extraClass;
        chart.setAttribute('role', 'img');
        chart.setAttribute('aria-label', titleEl ? titleEl.textContent.trim() : 'Gráfico');

        var title = document.createElement('p');
        title.className = 'm-chart-title';
        title.textContent = titleEl ? titleEl.textContent.trim() : '';
        chart.appendChild(title);

        var barsRow = document.createElement('div');
        barsRow.className = 'm-bars';
        bars.forEach(function (b) {
            var bar = document.createElement('div');
            bar.className = 'm-bar';
            bar.style.height = (px(b, 'height') / max * 100) + '%';
            bar.style.background = getComputedStyle(b).backgroundImage !== 'none'
                ? getComputedStyle(b).backgroundImage
                : getComputedStyle(b).backgroundColor;
            barsRow.appendChild(bar);
        });
        chart.appendChild(barsRow);

        var yearsRow = document.createElement('div');
        yearsRow.className = 'm-years';
        years.forEach(function (y) {
            var s = document.createElement('span');
            s.textContent = y.textContent.trim();
            yearsRow.appendChild(s);
        });
        chart.appendChild(yearsRow);

        container.appendChild(chart);
    }

    buildChart('chart-1-bar-', 'chart-1-year-', document.querySelector('.chart-label-1'), 'm-chart-1');
    buildChart('chart-2-bar-', 'chart-2-year-', document.querySelector('.chart-label-2'), 'm-chart-2');

    /* Newsreader es un poco más ancha que la tipografía original: en desktop,
       si un texto no entra en su caja del diseño, se achica apenas hasta que entra. */
    function textElements() {
        return Array.prototype.filter.call(container.querySelectorAll('*'), function (el) {
            if (el.classList.contains('big-letter') || el.closest('.m-chart')) return false;
            return Array.prototype.some.call(el.childNodes, function (n) {
                return n.nodeType === 3 && n.textContent.trim();
            });
        });
    }
    function fitTexts() {
        var desktop = !MOBILE.matches;
        textElements().forEach(function (el) {
            el.style.fontSize = '';
            if (!desktop || !el.clientHeight) return;
            var size = parseFloat(getComputedStyle(el).fontSize);
            var steps = 0;
            while ((el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) && steps < 40) {
                size *= 0.97;
                el.style.fontSize = size + 'px';
                steps++;
            }
        });
    }

    function update() { fit(); fitTexts(); }
    update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTexts);
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(update, 120); });
})();
