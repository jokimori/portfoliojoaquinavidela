// --- script.js ---

// 1. MODALES
function openModal(modalId) { 
    document.getElementById(modalId).style.display = "flex"; 
}

function closeModal(event, modalId) {
    if (event.target.classList.contains('modal-overlay')) { 
        document.getElementById(modalId).style.display = "none"; 
    }
}

function closeModalForce(modalId) { 
    document.getElementById(modalId).style.display = "none"; 
}

// 2. DRAG AND DROP DEL CARRUSEL
// Verificamos si existe el slider antes de ejecutar el código para evitar errores en páginas que no lo tienen
const slider = document.getElementById('projectsSlider');

if (slider) {
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        setTimeout(() => slider.classList.remove('active'), 0); 
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return; 
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; 
        if (Math.abs(x - startX) > 5) {
            isDragging = true;
        }
        slider.scrollLeft = scrollLeft - walk;
    });

    // Bloqueo de links al arrastrar
    const projectLinks = document.querySelectorAll('a.project-card');
    projectLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
}