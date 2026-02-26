// Este script hace que las tiras del carrusel sean infinitas y repite las cajas
// Se puede randomizar el orden de los PNGs si se desea

document.addEventListener('DOMContentLoaded', function() {
    // Todas las rutas de los PNGs
    const pngs = [
        'FR1.png','FR2.png','FR3.png','FR4.png','FR5.png',
        'FR6.png','FR7.png','FR8.png','FR9.png','FR10.png',
        'FR11.png','FR12.png','FR13.png','FR14.png','FR15.png',
        'FR16.png','FR17.png','FR18.png','FR19.png'
    ];
    const basePath = 'assets/images/nuevacarpeta/';

    const hoverLayer = document.getElementById('screen-hover-layer');
    const screenContent = document.querySelector('.screen-content');
    const screenImages = Array.from(document.querySelectorAll('[id^="active-screen-png-"]'));
    let currentScreenId = null;

    function setScreenImage(fId) {
        if (!fId) return;
        screenImages.forEach(el => el.style.display = 'none');
        if (hoverLayer) hoverLayer.classList.remove('visible');
        const img = document.getElementById('active-screen-png-' + fId);
        if (img) {
            img.style.display = 'block';
            currentScreenId = fId;
            if (hoverLayer) {
                const idx = fId.replace('F', '');
                hoverLayer.src = basePath + 'FH' + idx + '.png';
            }
        }
    }

    if (screenContent && hoverLayer) {
        screenContent.addEventListener('mouseenter', () => {
            if (!currentScreenId || !hoverLayer.src) return;
            hoverLayer.classList.add('visible');
        });
        screenContent.addEventListener('mouseleave', () => {
            hoverLayer.classList.remove('visible');
        });
    }

    // Para cada columna, repite las cajas infinitamente
    document.querySelectorAll('.column-track').forEach(track => {
        let boxes = Array.from(track.children);
        // Si la columna está vacía, rellena con todos los PNGs
        if (boxes.length === 0) {
            boxes = pngs.map(name => {
                const div = document.createElement('div');
                div.className = 'blue-box';
                const img = document.createElement('img');
                img.className = 'box-png';
                img.src = basePath + name;
                img.alt = name.replace('.png','');
                div.appendChild(img);
                return div;
            });
        }
        const parentHeight = track.parentElement ? track.parentElement.clientHeight : window.innerHeight;
        const targetHeight = parentHeight * 2;

        let appended = 0;
        do {
            boxes.forEach(box => {
                track.appendChild(box.cloneNode(true));
                appended++;
            });
        } while (track.scrollHeight < targetHeight && appended < boxes.length * 6);
    });

    // Relaciona FRx.png con Fx.png
    const frToF = name => {
        // FR1.png => F1
        return name.replace('FR', 'F').replace('.png', '');
    };

    // Hacer clic en PNG del carrusel activa el PNG en la pantalla
    function setupClickHandlers() {
        document.querySelectorAll('.box-png').forEach(img => {
            img.style.cursor = 'pointer';
            // Elimina listeners previos
            img.onclick = null;
            img.onmouseenter = null;
            img.onmouseleave = null;
            // Efecto hover: agranda la caja
            img.parentElement.onmouseenter = function() {
                img.parentElement.style.transition = 'transform 0.2s';
                img.parentElement.style.transform = 'scale(1.08)';
            };
            img.parentElement.onmouseleave = function() {
                img.parentElement.style.transform = 'scale(1)';
            };
            // Evento click en la caja
            img.parentElement.onclick = function(e) {
                e.stopPropagation();
                const frName = img.src.split('/').pop();
                const fId = frToF(frName);
                setScreenImage(fId);
            };
        });
    }

    // Ejecuta el setup después de duplicar las cajas y tras cada cambio en el DOM
    setTimeout(setupClickHandlers, 200);
    setScreenImage('F1');
});
