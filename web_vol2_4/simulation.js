import * as THREE from 'three';



// --- 1. CHART.JS ---

const indicatorClamp = v => Math.max(0, Math.min(100, v));

const indicatorMeta = [
    { label: 'Contaminación', calc: g => indicatorClamp(15 + g * 0.85) },
    { label: 'Unión vecinal', calc: g => indicatorClamp(95 - g * 0.9) },
    { label: 'Precio alquiler (m²)', calc: g => indicatorClamp(35 + g * 0.95) },
    { label: 'Tráfico y embotellamiento', calc: g => indicatorClamp(25 + g * 0.8) },
    { label: 'Edificios históricos', calc: g => indicatorClamp(92 - g * 0.9) },
    { label: 'Diversidad ', calc: g => indicatorClamp(90 - g * 0.9) },
    { label: 'Accesibilidad económica', calc: g => indicatorClamp(82 - g * 0.92) },
    { label: 'Espacios verdes comunitarios', calc: g => indicatorClamp(78 - g * 0.75) }
];

const getIndicatorValues = g => indicatorMeta.map(meta => meta.calc(g));

const getLevelLabel = value => value >= 70 ? 'ALTA' : (value >= 40 ? 'MEDIA' : 'BAJA');

const shockConfig = {
    'Contaminación': {
        orientation: 'high',
        message: value => `La contaminación escala a ${value}% y cubre el aire de smog.`
    },
    'Unión vecinal': {
        orientation: 'low',
        message: value => `La unión vecinal cae a ${value}%: los vecinos dejan de mirarse.`
    },
    'Precio alquiler (m²)': {
        orientation: 'high',
        message: value => `El alquiler toca ${value}% y expulsa a los históricos.`
    },
    'Tráfico y embotellamiento': {
        orientation: 'high',
        message: value => `El tráfico se traba al ${value}%: las avenidas quedan bloqueadas.`
    },
    'Edificios históricos': {
        orientation: 'low',
        message: value => `Sólo ${value}% del patrimonio sigue en pie; lo demás se demuele.`
    },
    'Diversidad ': {
        orientation: 'low',
        message: value => `La diversidad baja a ${value}% y todo empieza a parecerse.`
    },
    'Accesibilidad económica': {
        orientation: 'low',
        message: value => `La accesibilidad económica cae a ${value}%: vivir aquí es un lujo.`
    },
    'Espacios verdes comunitarios': {
        orientation: 'low',
        message: value => `Los espacios verdes bajan a ${value}% y el cemento gana la pulseada.`
    }
};

function getShockingMessage(values) {
    let worstScore = -Infinity;
    let selectedMessage = '';
    values.forEach((value, idx) => {
        const meta = indicatorMeta[idx];
        const config = shockConfig[meta.label];
        if (!config) return;
        const score = config.orientation === 'high' ? value : (100 - value);
        if (score > worstScore) {
            worstScore = score;
            selectedMessage = config.message(Math.round(value));
        }
    });
    return selectedMessage;
}

function buildPointPalette(values = [], phase = 0) {
    return values.map((value, idx) => {
        const norm = Math.max(0, Math.min(1, value / 100));
        const hue = (200 - norm * 120 + phase) % 360;
        const saturation = Math.min(95, 60 + Math.sin((idx + phase / 45)) * 20 + norm * 20);
        const lightness = Math.min(70, 40 + norm * 30);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
}

const radarTooltip = document.createElement('div');
radarTooltip.className = 'radar-tooltip';
document.body.appendChild(radarTooltip);

const infoPopup = document.getElementById('info-popup');
const infoPopupText = document.getElementById('info-popup-text');
let infoPopupTimeout = null;
let infoPopupHideTimeout = null;

const bodyComputed = window.getComputedStyle(document.body);
const backgroundThemes = {
    default: {
        backgroundImage: bodyComputed.backgroundImage,
        backgroundColor: bodyComputed.backgroundColor
    },
    historic: {
        backgroundImage: 'linear-gradient(180deg, #d8f6cf 0%, #8edb96 100%)',
        backgroundColor: '#c6efc4'
    },
    transition: {
        backgroundImage: 'linear-gradient(180deg, #fff4d3 0%, #f7d9a3 100%)',
        backgroundColor: '#f5e1b5'
    },
    gentrified: {
        backgroundImage: 'linear-gradient(180deg, #dfdfdf 0%, #9e9e9e 100%)',
        backgroundColor: '#c4c4c4'
    }
};
let currentBackgroundKey = 'default';

function showInfoPopup(message, duration = 3500) {
    if (!infoPopup || !infoPopupText) return;
    infoPopupText.textContent = message;
    infoPopup.style.visibility = 'visible';
    infoPopup.style.opacity = '1';
    infoPopup.style.transform = 'translateY(0)';
    if (infoPopupTimeout) clearTimeout(infoPopupTimeout);
    if (infoPopupHideTimeout) clearTimeout(infoPopupHideTimeout);
    infoPopupTimeout = setTimeout(() => {
        infoPopup.style.opacity = '0';
        infoPopup.style.transform = 'translateY(20px)';
        infoPopupHideTimeout = setTimeout(() => {
            infoPopup.style.visibility = 'hidden';
        }, 400);
    }, duration);
}

function updateBackgroundByStatus(status, identityScore = 0) {
    let key = 'default';
    if (status === 'GENTRIFICADO') key = 'gentrified';
    else if (identityScore >= 60) key = 'historic';
    else if (status === 'EN TRANSICIÓN') key = 'transition';
    if (key === currentBackgroundKey) return;
    const theme = backgroundThemes[key] || backgroundThemes.default;
    document.body.style.transition = 'background 0.6s ease';
    document.body.style.backgroundImage = theme.backgroundImage;
    document.body.style.backgroundColor = theme.backgroundColor;
    currentBackgroundKey = key;
}

let radarColorPhase = 0;
let hoveredRadarIndex = null;

function getRadarFillGradient(ctx, cx, cy, radius) {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const hueA = (radarColorPhase + 10) % 360;
    const hueB = (radarColorPhase + 70) % 360;
    const hueC = (radarColorPhase + 150) % 360;
    gradient.addColorStop(0, `hsla(${hueA}, 85%, 72%, 0.95)`);
    gradient.addColorStop(0.55, `hsla(${hueB}, 75%, 55%, 0.9)`);
    gradient.addColorStop(1, `hsla(${hueC}, 70%, 38%, 0.85)`);
    return gradient;
}

const radarCustomRenderer = {
    id: 'radarCustomRenderer',
    beforeDraw(chart, args, opts) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales || !scales.r) return;
        const scale = scales.r;
        const cx = scale.xCenter;
        const cy = scale.yCenter;
        const radius = scale.drawingArea;
        const pointCount = chart.data.labels.length;
        const meta = chart.getDatasetMeta(0);
        const dataset = chart.data.datasets[0];
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
        ctx.restore();

        ctx.save();
        for (let i = 0; i < pointCount; i++) {
            const isHovered = hoveredRadarIndex === i;
            ctx.strokeStyle = isHovered ? `hsla(${(radarColorPhase + 120) % 360}, 95%, 52%, 0.9)` : '#000000';
            ctx.lineWidth = isHovered ? 3 : 2;
            const angle = scale.getIndexAngle(i);
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = isHovered ? '#ffffff' : '#000000';
            ctx.shadowColor = isHovered ? `hsla(${(radarColorPhase + 120) % 360}, 90%, 55%, 0.8)` : 'transparent';
            ctx.shadowBlur = isHovered ? 12 : 0;
            ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        if (!meta || !meta.data || !meta.data.length) return;
        ctx.save();
        const gradient = getRadarFillGradient(ctx, cx, cy, radius);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        meta.data.forEach((point, idx) => {
            const { x, y } = point.getProps(['x', 'y'], true);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        // Hover badge removed per design update
        ctx.restore();
    }
};

if (typeof Chart !== 'undefined' && Chart.register) {
    Chart.register(radarCustomRenderer);
}

const ctx = document.getElementById('statsChart').getContext('2d');

const chartLabels = indicatorMeta.map(meta => {
    const upper = meta.label.toUpperCase();
    const words = upper.split(' ');
    if (words.length === 1) return upper;
    const lines = [];
    let current = '';
    words.forEach(word => {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > 12 && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    });
    if (current) lines.push(current);
    return lines.join('\n');
});

const chart = new Chart(ctx, {
    type: 'radar',
    data: {
        labels: chartLabels,
        datasets: [{
            label: 'Indicadores barriales',
            data: indicatorMeta.map(() => 0),
            borderColor: 'rgba(0,0,0,0)',
            backgroundColor: 'rgba(0,0,0,0)',
            borderWidth: 0,
            pointBackgroundColor: '#0d0d0d',
            pointBorderColor: '#0d0d0d',
            pointHoverBorderColor: '#111111',
            pointHoverBackgroundColor: '#111111',
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                suggestedMax: 100,
                angleLines: { color: '#000000', lineWidth: 1 },
                grid: { color: 'rgba(0,0,0,0)', circular: false },
                borderColor: '#000000',
                pointLabels: {
                    display: false
                },
                ticks: { display: false }
            }
        },
        elements: { line: { tension: 0.2 } },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: false,
                external: context => {
                    const tooltip = context.tooltip;
                    if (!tooltip || tooltip.opacity === 0) {
                        radarTooltip.style.opacity = 0;
                        return;
                    }
                    const point = tooltip.dataPoints && tooltip.dataPoints[0];
                    if (!point) { radarTooltip.style.opacity = 0; return; }
                    const value = point.parsed.r ?? point.parsed ?? point.raw;
                    const indicator = indicatorMeta[point.dataIndex];
                    radarTooltip.innerHTML = `<strong>${indicator.label.toUpperCase()}:</strong> ${getLevelLabel(value)}`;
                    const rect = context.chart.canvas.getBoundingClientRect();
                    radarTooltip.style.opacity = 1;
                    radarTooltip.style.left = rect.left + window.scrollX + point.element.x + 'px';
                    radarTooltip.style.top = rect.top + window.scrollY + point.element.y - 25 + 'px';
                }
            }
        }
    },
    plugins: [radarCustomRenderer]
});

let radarPulseHandle = null;
function startRadarColorPulse() {
    if (radarPulseHandle) return;
    const pulse = () => {
        radarColorPhase = (radarColorPhase + 0.9) % 360;
        const dataset = chart && chart.data && chart.data.datasets ? chart.data.datasets[0] : null;
        if (dataset) {
            const palette = buildPointPalette(dataset.data, radarColorPhase);
            dataset.pointBackgroundColor = palette;
            dataset.pointBorderColor = palette;
            dataset.pointHoverBackgroundColor = palette;
            dataset.pointHoverBorderColor = palette;
        }
        chart.draw();
        radarPulseHandle = requestAnimationFrame(pulse);
    };
    radarPulseHandle = requestAnimationFrame(pulse);
}

startRadarColorPulse();

function handleRadarPointerMove(event) {
    if (!chart || !chart.scales || !chart.scales.r) return;
    const scale = chart.scales.r;
    const rect = chart.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = x - scale.xCenter;
    const dy = y - scale.yCenter;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < scale.drawingArea * 0.25 || distance > scale.drawingArea * 1.15) {
        if (hoveredRadarIndex !== null) {
            hoveredRadarIndex = null;
            chart.canvas.style.cursor = 'default';
            chart.draw();
        }
        return;
    }

    const pointerAngle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
    let closestIdx = null;
    let smallestDiff = Infinity;
    const labelCount = chart.data.labels.length;
    for (let i = 0; i < labelCount; i++) {
        let axisAngle = scale.getIndexAngle(i);
        axisAngle = (axisAngle + Math.PI * 2) % (Math.PI * 2);
        let diff = Math.abs(pointerAngle - axisAngle);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestIdx = i;
        }
    }

    if (closestIdx !== null) {
        chart.canvas.style.cursor = 'pointer';
        if (closestIdx !== hoveredRadarIndex) {
            hoveredRadarIndex = closestIdx;
            chart.draw();
        }
    }
}

function clearRadarHover() {
    if (hoveredRadarIndex === null) return;
    hoveredRadarIndex = null;
    if (chart && chart.canvas) chart.canvas.style.cursor = 'default';
    chart.draw();
}

if (chart && chart.canvas) {
    chart.canvas.addEventListener('pointermove', handleRadarPointerMove);
    chart.canvas.addEventListener('pointerleave', clearRadarHover);
    chart.canvas.addEventListener('pointerdown', handleRadarPointerMove);
}



// --- 2. THREE.JS SETUP ---

const container = document.getElementById('wrapper');

const width = container.clientWidth, height = container.clientHeight;

const scene = new THREE.Scene();

const clock = new THREE.Clock(); // Reloj para animaciones

scene.background = null;



const viewSize = 13, aspect = width / height;

const camera = new THREE.OrthographicCamera(-viewSize * aspect, viewSize * aspect, viewSize, -viewSize, 1, 1000);

camera.position.set(35, 35, 35); camera.lookAt(0, 0, 0);



const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(width, height);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

container.appendChild(renderer.domElement);



// Iluminación mejorada para resaltar modelos y reducir contraste con hojas UI
const ambientLight = new THREE.AmbientLight(0xffffff, 0.95); scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
dirLight.position.set(20, 50, 30); dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xddeeff, 0.6);
fillLight.position.set(-20, 20, -20); scene.add(fillLight);

// Hemispheric light para suavizar relleno entre sombras
const hemi = new THREE.HemisphereLight(0xe6f3ff, 0x666666, 0.45); scene.add(hemi);

// Luz puntual superior para brillo directo sobre el modelado
const topPoint = new THREE.PointLight(0xffffff, 0.6, 150); topPoint.position.set(0, 30, 0); scene.add(topPoint);

// Configuración de renderer para manejar mejor el color
try { renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMappingExposure = 1.0; } catch (e) { }



// --- 3. TEXTURAS Y MATERIALES ---

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function createTexture(type, colorA, colorB) {

    const s = 64, c = document.createElement('canvas'); c.width = s; c.height = s;

    const ctx = c.getContext('2d'); ctx.fillStyle = colorB; ctx.fillRect(0, 0, s, s);

    if (type === 'cobble') {
        ctx.fillStyle = colorA;
        for (let y = 0; y < s; y += 8) {
            const offset = (y / 8) % 2 === 0 ? 0 : 4;
            for (let x = 0; x < s; x += 8) {
                drawRoundedRect(ctx, x + offset + 1, y + 1, 6, 6, 2);
            }
        }
    } else if (type === 'asphalt') {
        ctx.fillStyle = colorA;
        for (let i = 0; i < 200; i++) ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    } else if (type === 'stripes') {
        ctx.fillStyle = colorA;
        for (let x = 0; x < s; x += 16) ctx.fillRect(x, 0, 8, s);
    }

    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; return t;

}



const pastelWallMaterials = [

    new THREE.MeshStandardMaterial({ color: 0xFFD700, flatShading: true }), new THREE.MeshStandardMaterial({ color: 0x41A6F2, flatShading: true }),

    new THREE.MeshStandardMaterial({ color: 0xFF69B4, flatShading: true }), new THREE.MeshStandardMaterial({ color: 0x32CD32, flatShading: true }),

    new THREE.MeshStandardMaterial({ color: 0xAF7AC5, flatShading: true })

];



const mats = {
    cobble: new THREE.MeshStandardMaterial({ map: createTexture('cobble', '#c7c7c7', '#e0e0e0'), flatShading: true }),
    asphalt: new THREE.MeshStandardMaterial({ map: createTexture('asphalt', '#464444ff', '#4f4f4f'), flatShading: true }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xeaeaea, flatShading: true }),       // <-- GRIS: Acera / Vereda
    wallBrick: new THREE.MeshStandardMaterial({ color: 0xffab9b, flatShading: true }),
    roofRed: new THREE.MeshStandardMaterial({ color: 0xfd9898, flatShading: true }),
    tank: new THREE.MeshStandardMaterial({ color: 0x9e9e9e, flatShading: true }),          // <-- GRIS: Tanque de agua
    awningRed: new THREE.MeshStandardMaterial({ map: createTexture('stripes', '#fd9898', '#ffffff') }),
    wood: new THREE.MeshStandardMaterial({ color: 0xc8ab7a, flatShading: true }),
    plasticRed: new THREE.MeshStandardMaterial({ color: 0xff8a8a, flatShading: true }),
    plasticYellow: new THREE.MeshStandardMaterial({ color: 0xfff0aa, flatShading: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcce0fa, transparent: true, opacity: 0.6, flatShading: true }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xecf0f1, flatShading: true }),    // <-- GRIS: Concreto / Hormigón
    // Grass should be slightly translucent so street silhouettes remain visible
    grass: new THREE.MeshStandardMaterial({ color: 0xa5d6a7, flatShading: true, transparent: true, opacity: 0.35 }),
    tree: new THREE.MeshStandardMaterial({ color: 0x8cbfa8, flatShading: true }),
    water: new THREE.MeshStandardMaterial({ color: 0xbde6e6, transparent: true, opacity: 0.8, flatShading: true }),
    smog: new THREE.MeshStandardMaterial({ color: 0xd1d8e0, transparent: true, opacity: 0.8, flatShading: true }), // <-- GRIS: Contaminación
    door: new THREE.MeshStandardMaterial({ color: 0x8B5A2B, flatShading: true }),
    window: new THREE.MeshStandardMaterial({ color: 0xA2D5F2, flatShading: true }),
    personNeighbor: new THREE.MeshStandardMaterial({ color: 0xffa726, flatShading: true }),
    personWorker: new THREE.MeshStandardMaterial({ color: 0x546e7a, flatShading: true }),
    carBody: new THREE.MeshStandardMaterial({ color: 0xd32f2f, flatShading: true }),
    carGlass: new THREE.MeshStandardMaterial({ color: 0x424242, flatShading: true }),      // <-- GRIS: Vidrio del auto
    light: new THREE.MeshBasicMaterial({ color: 0xf1c40f }),
};

// Materiales más distintivos para comercio/bodegón/fast-food
// Bodegón: colores más cálidos y con algo de brillo para destacar identidad local
mats.bodegonWall = new THREE.MeshStandardMaterial({ color: 0x6b3a1e, roughness: 0.45, metalness: 0.08, flatShading: true });
// Fast-food: estética glassmorphism azul para mostrar homogeneización
mats.fastFoodBody = new THREE.MeshPhysicalMaterial({
    color: 0x8ac7ff,
    metalness: 0.35,
    roughness: 0.08,
    transparent: true,
    opacity: 0.65,
    transmission: 0.8,
    thickness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.05
});
// Material para rótulos/neón
mats.neon = new THREE.MeshBasicMaterial({ color: 0x00ffd5, toneMapped: false });

// Variantes de color para techos de casas (vibrantes)
mats.roofVariants = [
    new THREE.MeshStandardMaterial({ color: 0xfd9898, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0xffd36b, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x9ad3b2, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0xa28fd0, flatShading: true })
];

// Fast-food roof material (vidrio azul)
mats.fastFoodRoof = new THREE.MeshPhysicalMaterial({
    color: 0x264978,
    metalness: 0.25,
    roughness: 0.1,
    transparent: true,
    opacity: 0.55,
    transmission: 0.7,
    thickness: 0.35,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08
});

mats.fastFoodAccent = new THREE.MeshStandardMaterial({ color: 0xdff4ff, roughness: 0.25, metalness: 0.2, flatShading: true });

// Material para gourmet: gris brutalista y snob
mats.gourmetBody = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95, metalness: 0.3, flatShading: true });
mats.gourmetRoof = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.98, flatShading: true });

// Función para crear símbolo de dólar 3D
function createDollarSymbol() {
    const group = new THREE.Group();
    // Cuerpo del símbolo
    const curve = new THREE.TorusGeometry(0.13, 0.03, 8, 40, Math.PI * 1.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
    const torus = new THREE.Mesh(curve, mat);
    torus.rotation.z = Math.PI / 2;
    group.add(torus);
    // Palo vertical
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32), mat);
    cyl.position.y = 0.01;
    group.add(cyl);
    // Pequeño giro para simular el símbolo
    group.rotation.x = Math.PI / 8;
    group.rotation.y = Math.random() * Math.PI * 2;
    group.position.y = 1.7 + Math.random() * 0.3;
    group.position.x = (Math.random() - 0.5) * 0.5;
    group.position.z = (Math.random() - 0.5) * 0.5;
    return group;
}

// Contenedor para comentarios flotantes (puede contener sprites o meshes 3D)
const floatingComments = [];
// Partículas verdes (indicadores de espacio verde) - lógica similar a smogParticles
const greenParticles = [];

function createGreenParticle(x, z) {
    // a bit more subtle/translucent so it doesn't fully occlude streets
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0x5ee37a, transparent: true, opacity: 0.7, emissive: 0x2fe060, emissiveIntensity: 0.35 }));
    g.position.set(x + (Math.random() - 0.5) * 1.2, 1.6 + Math.random() * 1.2, z + (Math.random() - 0.5) * 1.2);
    g.userData = { sx: (Math.random() - 0.5) * 0.02, sz: (Math.random() - 0.5) * 0.02, life: 3 + Math.random() * 2 };
    scene.add(g); greenParticles.push(g);
}

// Transformar una entidad existente a parque (no destruir, sino modificar y animar)
function transformToPark(ent) {
    if (!ent || ent.type === 'park' || ent._transforming) return;
    ent._transforming = true;
    // Guardamos tipo/subtipo original para poder revertir luego
    if (!ent._originalType) ent._originalType = ent.type;
    if (!ent._originalSubtype) ent._originalSubtype = ent.subtype;
    // guardar material original para posible restauración
    ent._originalMaterials = ent._originalMaterials || [];
    ent.mesh.traverse(node => { if (node.isMesh) ent._originalMaterials.push(node.material); });
    // agregar overlay de césped y árboles (grupo)
    const parkGroup = new THREE.Group();
    parkGroup.name = 'parkOverlay';
    const base = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.98, 0.08, blockSize * 0.98), mats.grass);
    base.position.y = 0.12; parkGroup.add(base);
    // crear algunos árboles escalables (crecen desde 0)
    for (let i = 0; i < 3; i++) {
        const tx = (Math.random() - 0.5) * (blockSize * 0.6);
        const tz = (Math.random() - 0.5) * (blockSize * 0.6);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), mats.wood);
        trunk.position.set(tx, 0.25, tz); trunk.scale.set(0.01, 0.01, 0.01); parkGroup.add(trunk);
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34), mats.tree);
        crown.position.set(tx, 0.6, tz); crown.scale.set(0.01,0.01,0.01); parkGroup.add(crown);
        // mark for growth animation
        trunk.userData.growing = true; trunk.userData.targetScale = 1.0;
        crown.userData.growing = true; crown.userData.targetScale = 1.0;
    }
    ent.mesh.add(parkGroup);
    // mark entity as park-like but keep type to allow restoration if needed
    ent._parkOverlay = parkGroup; ent._wasPark = true;
    // spawn some green particles above
    for (let i = 0; i < 6; i++) createGreenParticle(ent.mesh.position.x, ent.mesh.position.z);
    // small pulse animation marker
    ent.userData = ent.userData || {}; ent.userData.pulse = 1.15;
    setTimeout(() => { ent._transforming = false; ent.type = 'park'; ent.subtype = 'green'; }, 700);
}

// Restaurar entidad de parque a urbana (quita overlay)
function transformToUrban(ent) {
    if (!ent || !ent._wasPark) return;
    // animate shrinking of trees and then remove
    if (ent._parkOverlay) {
        ent._parkOverlay.traverse(node => { if (node.userData && node.userData.growing) node.userData.growing = false; });
        // set a timeout to remove after animation
        setTimeout(() => {
            try { ent.mesh.remove(ent._parkOverlay); } catch (e) {}
            ent._parkOverlay.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose(); });
            delete ent._parkOverlay; delete ent._wasPark;
            ent.type = ent._originalType || 'residential';
            ent.subtype = ent._originalSubtype || ent.subtype;
        }, 900);
    }
    ent.userData = ent.userData || {}; ent.userData.pulse = 0.9;
}

// Crear iconos 3D para onomatopeyas: 'city' (altos, saturados) y 'bird' (pequeños voladores)
function create3DIcon() {
    // Icon generation disabled per request to keep rooftops clean.
}

// --- 4. OBJETOS Y LÓGICA DE UI ---

const blockSize = 2.2, entities = [], smogParticles = [], vehicles = [], people = [];

let isInfraView = false, currentStatus = '';
let franchiseOverlay = null;

// track last business slider change so we only trigger wave effects on meaningful moves
let lastBusinessLevel = -1;
let lastCorrelationLock = false;



// Material y estado para la vista de infraestructura

const infraMaterial = new THREE.MeshBasicMaterial({

    color: 0xffffff,

    wireframe: true,

    transparent: true,

    opacity: 0

});

let infraTargetOpacity = 0;





function createTree(x, z, parent) {

    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.5), mats.wood);

    t.position.set(x, 0.25, z); t.castShadow = true; parent.add(t);

    const l = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4), mats.tree);

    l.position.set(x, 0.6, z); l.castShadow = true; parent.add(l);

}



function createSmog() {

    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), mats.smog);

    m.position.set((Math.random() - 0.5) * 15, 4 + Math.random() * 3, (Math.random() - 0.5) * 15);

    m.scale.setScalar(0.8 + Math.random());

    m.userData = { sx: (Math.random() - 0.5) * 0.02, sz: (Math.random() - 0.5) * 0.02, rot: Math.random() * 0.02 };

    scene.add(m); smogParticles.push(m);

}



function createBuilding(x, z) {

    const g = new THREE.Group(); g.position.set(x, 0, z);

    const sw = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.2, blockSize), mats.sidewalk);

    sw.receiveShadow = true; g.add(sw);

    const oldG = new THREE.Group();

    const h = 0.8 + Math.random() * 0.8, w = blockSize * (0.7 + Math.random() * 0.2), d = blockSize * (0.7 + Math.random() * 0.2);

    const mat = pastelWallMaterials[Math.floor(Math.random() * pastelWallMaterials.length)];

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

    body.position.y = h / 2 + 0.1; body.castShadow = true; oldG.add(body);

    if (Math.random() > 0.2) {

        const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.2, h * 0.4, 0.05), mats.door);

        door.position.set(-w * 0.2, (h * 0.4 / 2) - (h / 2) + 0.05, d / 2 + 0.01); body.add(door);

        const win = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w, h) * 0.15, Math.min(w, h) * 0.15, 0.05), mats.window);

        win.position.set(w * 0.2, h * 0.1, d / 2 + 0.01); body.add(win);

    }

    const roofMat = mats.roofVariants[Math.floor(Math.random() * mats.roofVariants.length)];
    const flatRoof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.08, d * 0.95), roofMat);
    flatRoof.position.y = h + 0.1;
    oldG.add(flatRoof);

    g.add(oldG);

    const newG = new THREE.Group(); newG.visible = false; const tH = 3.0;

    const tower = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.8, tH, blockSize * 0.8), mats.glass);

    tower.position.y = tH / 2; tower.userData = { anim: true, baseH: tH };

    for (let y = 0.5; y < tH; y += 0.8) {

        const bal = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.85, 0.05, blockSize * 0.85), mats.concrete);

        bal.position.y = y; bal.userData = { anim: true, baseH: y }; newG.add(bal);

    }

    newG.add(tower); g.add(newG);

    return { mesh: g, old: oldG, new: newG, type: 'residential', resistance: Math.random() * 100, scale: 1 };

}



function getBodegonColor(sliderValue) {
    const start = { r: 107, g: 58, b: 30 }; // marrón
    const end = { r: 74, g: 15, b: 31 }; // bordo profundo
    const r = Math.round(start.r + (end.r - start.r) * sliderValue);
    const g = Math.round(start.g + (end.g - start.g) * sliderValue);
    const b = Math.round(start.b + (end.b - start.b) * sliderValue);
    return (r << 16) + (g << 8) + b;
}
function getBodegonDetailColor(sliderValue) {
    const start = { r: 140, g: 75, b: 43 };
    const end = { r: 112, g: 20, b: 46 };
    const r = Math.round(start.r + (end.r - start.r) * sliderValue);
    const g = Math.round(start.g + (end.g - start.g) * sliderValue);
    const b = Math.round(start.b + (end.b - start.b) * sliderValue);
    return (r << 16) + (g << 8) + b;
}
function getBodegonLightColor(sliderValue) {
    const start = { r: 255, g: 179, b: 71 };
    const end = { r: 199, g: 44, b: 75 };
    const r = Math.round(start.r + (end.r - start.r) * sliderValue);
    const g = Math.round(start.g + (end.g - start.g) * sliderValue);
    const b = Math.round(start.b + (end.b - start.b) * sliderValue);
    return (r << 16) + (g << 8) + b;
}

// Ajusta materiales y luces de bodegones existentes según el valor del slider
function refreshBodegonPalette(ent, sliderValue) {
    if (!ent || !ent.bodegonParts) return;
    const normalized = Math.min(1, Math.max(0, sliderValue));
    const bodyColor = getBodegonColor(normalized);
    const detailColor = getBodegonDetailColor(normalized);
    const lightColor = getBodegonLightColor(normalized);

    if (ent.bodegonParts.bodyMaterial) ent.bodegonParts.bodyMaterial.color.setHex(bodyColor);
    ent.bodegonParts.detailMaterials.forEach(mat => mat.color.setHex(detailColor));
    ent.bodegonParts.emissiveMaterials.forEach(mat => { if (mat.emissive) mat.emissive.setHex(lightColor); });
    ent.bodegonParts.pointLights.forEach(light => light.color.setHex(lightColor));
}
function createCommerce(x, z, tipoForzado = null, sliderValue = null) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const sw = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.2, blockSize), mats.sidewalk);
    sw.receiveShadow = true; g.add(sw);
    const baseSlider = typeof sliderValue === 'number' ? sliderValue : (0.35 + Math.random() * 0.65);
    const normalizedSlider = Math.min(1, Math.max(0, baseSlider));
    const subtype = tipoForzado ? tipoForzado : (normalizedSlider < 0.5 ? 'bodegon' : 'gourmet');
    const oldG = new THREE.Group();
    const h = subtype === 'bodegon' ? 1.1 : 1.2;
    // Interpolación de color para bodegón/gourmet
    const wallMat = subtype === 'bodegon'
        ? new THREE.MeshStandardMaterial({ color: getBodegonColor(normalizedSlider), roughness: 0.5, metalness: 0.05, flatShading: true })
        : mats.gourmetBody;
    const body = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.9, h, blockSize * 0.9), wallMat);
    body.position.y = h / 2 + 0.1; body.castShadow = true; oldG.add(body);
    const bodegonParts = subtype === 'bodegon'
        ? { bodyMaterial: wallMat, detailMaterials: [], emissiveMaterials: [], pointLights: [] }
        : null;
    if (subtype === 'bodegon') {
        // Detalles bodegón con transición de color
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), mats.window);
        win.position.set(0, 0.6, blockSize * 0.45 + 0.01); body.add(win);
        const detailColor = getBodegonDetailColor(normalizedSlider);
        const lightColor = getBodegonLightColor(normalizedSlider);
        const registerDetailMaterial = mat => { bodegonParts.detailMaterials.push(mat); return mat; };
        const awn = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.95, 0.12, 0.4), registerDetailMaterial(new THREE.MeshStandardMaterial({ color: detailColor })));
        awn.position.set(0, 0.75, 0.3); oldG.add(awn);
        for (let i = 0; i < 2; i++) {
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.18), registerDetailMaterial(new THREE.MeshStandardMaterial({ color: detailColor })));
            crate.position.set(-0.3 + i * 0.6, 0.12, blockSize * 0.45 + 0.05); oldG.add(crate);
        }
        // Cartel y letras
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.25), registerDetailMaterial(new THREE.MeshStandardMaterial({ color: detailColor })));
        sign.position.set(0, 1.05, 0.36); sign.rotation.x = -0.05; oldG.add(sign);
        for (let i = 0; i < 6; i++) {
            const letter = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.02), registerDetailMaterial(new THREE.MeshStandardMaterial({ color: detailColor })));
            letter.position.set(-0.27 + i * 0.11, 1.09, 0.37); oldG.add(letter);
        }
        // Mesas y sillas
        for (let i = 0; i < 2; i++) {
            const table = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 12), registerDetailMaterial(new THREE.MeshStandardMaterial({ color: detailColor })));
            table.position.set(-0.25 + i * 0.5, 0.09, 0.7); oldG.add(table);
            for (let j = 0; j < 2; j++) {
                const chair = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.09), registerDetailMaterial(new THREE.MeshStandardMaterial({ color: detailColor })));
                chair.position.set(-0.25 + i * 0.5 + (j ? 0.15 : -0.15), 0.09, 0.82); oldG.add(chair);
            }
        }
        for (let i = 0; i < 3; i++) {
            const lanternMat = registerDetailMaterial(new THREE.MeshStandardMaterial({ color: detailColor, emissive: lightColor, emissiveIntensity: 0.8 }));
            bodegonParts.emissiveMaterials.push(lanternMat);
            const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), lanternMat);
            lantern.position.set(-0.3 + i * 0.3, 1.18, 0.36); oldG.add(lantern);
        }
        const bodegonLight = new THREE.PointLight(lightColor, 0.7, 2);
        bodegonParts.pointLights.push(bodegonLight);
        bodegonLight.position.set(0, 1.3, 0.36); oldG.add(bodegonLight);
    } else {
        // Gourmet: gris brutalista, snob, techo gris oscuro
        const roof = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.9, 0.12, blockSize * 0.9), mats.gourmetRoof);
        roof.position.y = h + 0.1; oldG.add(roof);
        for (let i = 0; i < 3; i++) {
            const dollar = createDollarSymbol();
            oldG.add(dollar);
        }
        const snobSign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.2 }));
        snobSign.position.set(0, 1.08, 0.36); snobSign.rotation.x = -0.05; oldG.add(snobSign);
        for (let i = 0; i < 5; i++) {
            const letter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.02), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }));
            letter.position.set(-0.25 + i * 0.13, 1.12, 0.37); oldG.add(letter);
        }
    }
    g.add(oldG);

    // Versión transformada (cadena de comida rápida)
    const newG = new THREE.Group(); newG.visible = false;
    // Cuerpo y techo con paleta saturada
    const ffBody = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.9, 1.2, blockSize * 0.9), mats.fastFoodBody);
    ffBody.position.y = 0.7; ffBody.castShadow = true; newG.add(ffBody);
    const ffRoof = new THREE.Mesh(new THREE.BoxGeometry(blockSize * 0.9, 0.08, blockSize * 0.9), mats.fastFoodRoof);
    ffRoof.position.y = 1.28; newG.add(ffRoof);
    // Cartel acento amarillo
    const ffSign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), mats.fastFoodAccent);
    ffSign.position.set(0, 1.08, 0.36); ffSign.rotation.x = -0.05; newG.add(ffSign);
    // Letras y mobiliario con contraste vibrante
    for (let i = 0; i < 5; i++) {
        const letter = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.14, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xe4f4ff, emissive: 0x9bd2ff, emissiveIntensity: 0.6 })
        );
        letter.position.set(-0.25 + i * 0.13, 1.12, 0.37); newG.add(letter);
    }
    for (let i = 0; i < 2; i++) {
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 12), mats.fastFoodAccent);
        table.position.set(-0.25 + i * 0.5, 0.09, 0.7); newG.add(table);
        for (let j = 0; j < 2; j++) {
            const chair = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.09), mats.fastFoodBody);
            chair.position.set(-0.25 + i * 0.5 + (j ? 0.15 : -0.15), 0.09, 0.82); newG.add(chair);
        }
    }
    // Eliminamos banderines calidos: todo vibra en paleta franquicia
    g.add(newG);

    const density = Math.floor(Math.random() * 6) + 2;
    for (let i = 0; i < density; i++) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.25 }));
        cube.position.set(0.5, 0.3 + i * 0.32, 0.5);
        g.add(cube);
    }

    return { mesh: g, old: oldG, new: newG, type: 'commerce', subtype, resistance: Math.random() * 100, bodegonParts, scale: 1 };
}



function createParkGreen(x, z) {

    const g = new THREE.Group(); g.position.set(x, 0, z);

    const gr = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.2, blockSize), mats.grass);

    gr.receiveShadow = true; g.add(gr);

    for (let i = 0; i < 3; i++) createTree((Math.random() - 0.5), (Math.random() - 0.5), g);

    return { mesh: g, type: 'park', subtype: 'green' };

}



function createParkFountain(x, z) {

    const g = new THREE.Group(); g.position.set(x, 0, z);

    const base = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.2, blockSize), mats.concrete);

    base.receiveShadow = true; g.add(base);

    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 8), mats.concrete);

    fBase.position.y = 0.35; g.add(fBase);

    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.1, 8), mats.water);

    water.position.y = 0.5; g.add(water);

    for (let i = 0; i < 2; i++) createTree((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, g);

    return { mesh: g, type: 'park', subtype: 'fountain' };

}



function createParkTables(x, z) {

    const g = new THREE.Group(); g.position.set(x, 0, z);

    const base = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.2, blockSize), mats.sidewalk);

    base.receiveShadow = true; g.add(base);

    for (let i = 0; i < 2; i++) {

        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05), mats.wood);

        t.position.set(i * 1 - 0.5, 0.3, 0); g.add(t);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25), mats.wood);

        leg.position.set(i * 1 - 0.5, 0.17, 0); g.add(leg);

    }

    for (let i = 0; i < 1; i++) createTree(0, 0, g);

    return { mesh: g, type: 'park', subtype: 'tables' };

}



function createPerson(type, makeComment = false) {
    const mat = type === 'neighbor' ? mats.personNeighbor : mats.personWorker;
    const personMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.35, 4, 8), mat);
    const axis = Math.random() > 0.5 ? 'x' : 'z';
    const laneBase = streetLines[Math.floor(Math.random() * streetLines.length)];
    const laneCoord = getPedestrianLane(laneBase);
    const start = (Math.random() * 2 - 1) * roadBoundary * 0.95;
    if (axis === 'x') personMesh.position.set(start, 0.28, laneCoord);
    else personMesh.position.set(laneCoord, 0.28, start);
    personMesh.castShadow = true;
    const person = {
        mesh: personMesh,
        type,
        axis,
        dir: Math.random() > 0.5 ? 1 : -1,
        lane: laneCoord,
        speed: 0.015 + Math.random() * 0.015,
        distance: 0,
        targetDistance: step * (0.6 + Math.random() * 0.8)
    };
    people.push(person);
    scene.add(personMesh);
    if (makeComment) {
        const iconType = type === 'neighbor' ? 'city' : 'bird';
        create3DIcon(iconType, personMesh.position);
    }
}



const gridSize = 6, step = blockSize + 0.6, offset = (gridSize * step) / 2 - step / 2;
const streetLines = Array.from({ length: gridSize }, (_, i) => i * step - offset);
const roadBoundary = offset + step / 2;
const pedestrianLaneOffsets = [-0.35, -0.18, 0.18, 0.35];

const getPedestrianLane = base => {
    const idx = Math.floor(Math.random() * pedestrianLaneOffsets.length);
    return base + pedestrianLaneOffsets[idx];
};



function createCar() {

    const carGroup = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.4), mats.carBody);

    body.castShadow = true; carGroup.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.35), mats.carGlass);

    cabin.position.set(0.1, 0.2, 0); carGroup.add(cabin);

    const path = Math.random() > 0.5; const dir = Math.random() > 0.5 ? 1 : -1;

    const laneBase = streetLines[Math.floor(Math.random() * streetLines.length)];
    const laneCoord = laneBase;

    if (path) {
        carGroup.position.set(dir > 0 ? -roadBoundary : roadBoundary, 0.15, laneCoord);
        carGroup.rotation.y = dir > 0 ? 0 : Math.PI;
    } else {
        carGroup.position.set(laneCoord, 0.15, dir > 0 ? -roadBoundary : roadBoundary);
        carGroup.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }

    const vehicle = { mesh: carGroup, speed: dir * (0.035 + Math.random() * 0.03), path, boundary: roadBoundary, laneCoord };

    vehicles.push(vehicle);

    scene.add(carGroup);

}



// --- 5. ESCENA Y LÓGICA PRINCIPAL ---

const cityGroup = new THREE.Group(); scene.add(cityGroup);



function createAnimatedGrid() {

    const gridMaterial = new THREE.ShaderMaterial({

        uniforms: {

            time: { value: 0 },

            opacity: { value: 0 }

        },

        vertexShader: `

            varying vec2 vUv;

            void main() {

                vUv = uv;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            }

        `,

        fragmentShader: `

            uniform float time;

            uniform float opacity;

            varying vec2 vUv;



            void main() {

                // Efecto de pulso suave para la grilla

                float pulse = sin(time * 2.0) * 0.1 + 0.9;



                // Grilla principal

                vec2 grid_uv = vUv * 20.0;

                vec2 grid_line = step(0.97, fract(grid_uv));

                float grid = max(grid_line.x, grid_line.y);



                // Sub-grilla más fina

                vec2 sub_grid_uv = vUv * 100.0;

                vec2 sub_grid_line = step(0.99, fract(sub_grid_uv));

                float sub_grid = max(sub_grid_line.x, sub_grid_line.y) * 0.2;

               

                float final_grid = max(grid, sub_grid) * pulse;

               

                if (final_grid < 0.1) discard;

               

                // Color blanco suave para la grilla

                gl_FragColor = vec4(vec3(0.9), final_grid * opacity);

            }

        `,

        transparent: true,

        depthWrite: false,

    });

   

    const gridMesh = new THREE.Mesh(

        new THREE.PlaneGeometry(30, 30, 1, 1),

        gridMaterial

    );

    gridMesh.rotation.x = -Math.PI / 2;

    gridMesh.position.y = -0.05;

    gridMesh.visible = false;

   

    return gridMesh;

}

const animatedGrid = createAnimatedGrid();

scene.add(animatedGrid);



for (let i = 0; i < gridSize; i++) { for (let j = 0; j < gridSize; j++) { const x = i * step - offset, z = j * step - offset; const rand = Math.random(); let ent; if (rand > 0.8) { const pR = Math.random(); if (pR < 0.33) ent = createParkGreen(x, z); else if (pR < 0.66) ent = createParkFountain(x, z); else ent = createParkTables(x, z); } else if (rand > 0.65) ent = createCommerce(x, z); else ent = createBuilding(x, z); cityGroup.add(ent.mesh); entities.push(ent); } }

const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mats.cobble);

ground.rotation.x = -Math.PI / 2; ground.position.y = -0.1; ground.receiveShadow = true;

ground.userData = { type: 'cobble' }; cityGroup.add(ground);

const overlayLocalColor = new THREE.Color(0x63d471);
const overlayFranchiseColor = new THREE.Color(0x7a7167);
franchiseOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: overlayLocalColor.clone(), transparent: true, opacity: 0.15, flatShading: true, depthWrite: false })
);
franchiseOverlay.rotation.x = -Math.PI / 2;
franchiseOverlay.position.y = ground.position.y + 0.02;
franchiseOverlay.visible = false;
cityGroup.add(franchiseOverlay);



function update() {

    const marketSlider = document.getElementById('market-slider');
    const commerceSlider = document.getElementById('commerce-slider');
    const businessSlider = document.getElementById('business-slider');

    const rawMarket = parseInt(marketSlider.value);
    const rawCommerce = parseInt(commerceSlider.value);
    const rawBusiness = parseInt(businessSlider.value);

    let m = rawMarket;
    let c = rawCommerce;
    let b = rawBusiness;

    const correlationTriggered = rawCommerce < rawMarket;
    if (correlationTriggered) {
        c = m;
        if (commerceSlider.value !== String(c)) commerceSlider.value = String(c);
    }
    if (correlationTriggered && !lastCorrelationLock) {
        showInfoPopup('Bloqueamos el perfil gastronómico porque debe acompañar la densidad actual del barrio.');
    }
    lastCorrelationLock = correlationTriggered;

    const commerceRatio = Math.min(1, Math.max(0, c / 100));
    const franchisePressure = Math.min(1, Math.max(0, b / 100));
    if (franchiseOverlay) {
        const targetOpacity = 0.05 + franchisePressure * 0.35;
        franchiseOverlay.visible = !isInfraView && franchisePressure > 0.02;
        franchiseOverlay.material.opacity += (targetOpacity - franchiseOverlay.material.opacity) * 0.2;
        franchiseOverlay.material.color.lerpColors(overlayLocalColor, overlayFranchiseColor, franchisePressure);
    }

    const gentrification = indicatorClamp(m * 0.4 + c * 0.35 + franchisePressure * 100 * 0.25);
    const indicatorValues = getIndicatorValues(gentrification);
    chart.data.datasets[0].data = indicatorValues;
    chart.update();

    const shockingMessage = getShockingMessage(indicatorValues);
    if (shockingMessage) {
        showInfoPopup(shockingMessage, 2800);
    }

    const pol = smogParticles.length * 5;

    const traffic = Math.floor(c * 0.35 + m * 0.25 + b * 0.2);

    const businessShift = franchisePressure * 40;
    const neighborDensity = Math.max(0, 100 - m - businessShift);
    const workerDensity = Math.min(100, m + businessShift);



    const desiredCars = Math.floor(traffic / 10);

    while (vehicles.length < desiredCars) createCar();

    while (vehicles.length > desiredCars) { scene.remove(vehicles.pop().mesh); }



    const desiredNeighbors = Math.floor(neighborDensity / 15);
    const desiredWorkers = Math.floor(workerDensity / 15);
    let currentNeighbors = people.filter(p => p.type === 'neighbor').length;
    let currentWorkers = people.filter(p => p.type === 'worker').length;
    while (currentNeighbors < desiredNeighbors) { createPerson('neighbor', true); currentNeighbors++; }
    while (currentWorkers < desiredWorkers) { createPerson('worker', true); currentWorkers++; }

    while (currentNeighbors > desiredNeighbors) { const idx = people.findIndex(p => p.type === 'neighbor'); if (idx > -1) { scene.remove(people[idx].mesh); people.splice(idx, 1); } currentNeighbors--; }

    while (currentWorkers > desiredWorkers) { const idx = people.findIndex(p => p.type === 'worker'); if (idx > -1) { scene.remove(people[idx].mesh); people.splice(idx, 1); } currentWorkers--; }



    if (!isInfraView) {

        if (m > 50 && ground.userData.type === 'cobble') { ground.material = mats.asphalt; ground.userData.type = 'asphalt'; }

        else if (m <= 50 && ground.userData.type === 'asphalt') { ground.material = mats.cobble; ground.userData.type = 'cobble'; }

    }

    if (lastBusinessLevel < 0) {
        lastBusinessLevel = b;
    } else if (Math.abs(b - lastBusinessLevel) > 6) {
        if (b < 30) {
            showInfoPopup('Vecinos reactivan comercios locales.');
            entities.forEach(ent => {
                if (ent && ent.type === 'commerce' && ent.new.visible && Math.random() < 0.25) {
                    ent.new.visible = false;
                    ent.old.visible = true;
                    ent._wasFF = false;
                    ent.userData = ent.userData || {};
                    ent.userData.pulse = 1.08;
                    if (Math.random() < 0.4) create3DIcon('bird', ent.mesh.position);
                }
            });
        } else if (b > 70) {
            showInfoPopup('Se expanden las cadenas y franquicias.');
            entities.forEach(ent => {
                if (ent && ent.type === 'commerce' && !ent.new.visible && Math.random() < 0.2) {
                    ent.new.visible = true;
                    ent.old.visible = false;
                    ent._wasFF = true;
                    ent.userData = ent.userData || {};
                    ent.userData.pulse = 1.12;
                    if (Math.random() < 0.4) create3DIcon('city', ent.mesh.position);
                }
            });
        }
        lastBusinessLevel = b;
    }



    let identity = (100 - m) * 0.45 + (100 - c) * 0.35 - pol * 0.2 - franchisePressure * 25;

    let econ = m * 0.7 + c * 0.3 + franchisePressure * 20;

    const airQuality = Math.max(0, Math.min(100, 100 - pol));
    identity = Math.max(0, Math.min(100, identity));
    econ = Math.max(0, Math.min(100, econ));
    const trafficScore = Math.max(0, Math.min(100, traffic));

    document.getElementById('val-identity').innerText = identity > 50 ? "FUERTE" : "PERDIDA"; document.getElementById('val-identity').style.color = identity > 50 ? "#2ecc71" : "#e74c3c";

    document.getElementById('val-air').innerText = pol < 20 ? "PURO" : "MALA"; document.getElementById('val-air').style.color = pol < 20 ? "#2ecc71" : "#e74c3c";



    const newStatus = (franchisePressure > 0.65 && m > 60) ? "GENTRIFICADO" : (m < 30 && franchisePressure < 0.4 ? "BARRIO HISTÓRICO" : "EN TRANSICIÓN");

    document.getElementById('status-indicator').innerText = newStatus;
    updateBackgroundByStatus(newStatus, identity);



    if (newStatus !== currentStatus) {

        currentStatus = newStatus; let message = '';

        if (newStatus === 'GENTRIFICADO') message = 'El barrio muestra signos claros de gentrificación: las franquicias copan las esquinas.';
        else if (newStatus === 'BARRIO HISTÓRICO') message = 'El barrio conserva su identidad comercial y la escala humana.';
        else message = 'El barrio está en transición: conviven negocios locales y cadenas.';

        showInfoPopup(message);

    }

    entities.forEach(ent => {
        // Actualización de viviendas (residential)
        if (ent.type === 'residential') {
            const marketPressure = m + franchisePressure * 30;
            const isGen = marketPressure > ent.resistance;
            if (isGen && !ent._wasGen) {
                ent._wasGen = true;
                showInfoPopup('Una vivienda está siendo transformada por el mercado.');
                create3DIcon('city', ent.mesh.position);
                ent.userData = ent.userData || {};
                ent.userData.pulse = 1.18;
            } else if (!isGen) {
                ent._wasGen = false;
            }
            ent.old.visible = !isGen; ent.new.visible = isGen; ent.scale = isGen ? 1 + (marketPressure / 120) : 1;
        }
        // Actualización de comercios (commerce)
        else if (ent.type === 'commerce') {
            const ffPressure = c + franchisePressure * 30;
            const isFF = ffPressure > ent.resistance;
            if (isFF && !ent._wasFF) {
                ent._wasFF = true;
                const msg = ent.subtype === 'bodegon' ? 'Un comercio local cambia a cadena de comida rápida.' : 'Comercio transforma su fachada.';
                showInfoPopup(msg);
                create3DIcon('city', ent.mesh.position);
                ent.userData = ent.userData || {};
                ent.userData.pulse = 1.12;
            } else if (!isFF) {
                ent._wasFF = false;
            }
            ent.old.visible = !isFF; ent.new.visible = isFF;
            if (!isFF) refreshBodegonPalette(ent, commerceRatio);
        }
        // Actualización de parques (park)
        else if (ent.type === 'park') {
            const parksVisible = franchisePressure < 0.6;
            if (ent.subtype === 'green') ent.mesh.visible = parksVisible;
        }
    });

}



// --- EVENT LISTENERS ---

['market-slider', 'commerce-slider', 'business-slider'].forEach(id => document.getElementById(id).addEventListener('input', update));

document.getElementById('btn-smog').addEventListener('click', () => { for (let i = 0; i < 3; i++) createSmog(); update(); });

document.getElementById('btn-clear').addEventListener('click', () => { smogParticles.forEach(p => scene.remove(p)); smogParticles.length = 0; update(); });



document.getElementById('btn-grid-view').addEventListener('click', () => {

    isInfraView = !isInfraView;
    showInfoPopup(isInfraView ? 'Red de infraestructura activada para analizar servicios y conexiones.' : 'Vista urbana restaurada: volvés al pulso cotidiano.');



    const displayNormal = !isInfraView;

    smogParticles.forEach(p => p.visible = displayNormal);

    vehicles.forEach(v => v.mesh.visible = displayNormal);

    people.forEach(p => p.mesh.visible = displayNormal);

    ground.visible = displayNormal;
    if (franchiseOverlay) {
        const sliderValue = parseInt(document.getElementById('business-slider').value);
        const pressure = Math.min(1, Math.max(0, sliderValue / 100));
        franchiseOverlay.visible = displayNormal && pressure > 0.02;
    }

    animatedGrid.visible = isInfraView;

   

    infraTargetOpacity = isInfraView ? 0.8 : 0;



    // Cuando activamos la vista de infraestructura:
    // 1) Guardamos y aplicamos el material infra
    // 2) Creamos líneas de aristas (edge helpers) para resaltar la estructura
    if (isInfraView) {
        cityGroup.traverse(child => {
            if (child.isMesh) {
                child.userData.originalMaterial = child.material;
                child.material = infraMaterial;

                // Crear helper de aristas (una sola vez por mesh)
                if (!child.userData.edgeHelper && child.geometry) {
                    const geo = new THREE.EdgesGeometry(child.geometry);
                    const matL = new THREE.LineBasicMaterial({ color: 0x00ffd5 });
                    const lines = new THREE.LineSegments(geo, matL);
                    // Colocar las aristas usando la matriz mundial del objeto
                    child.updateWorldMatrix(true, false);
                    lines.applyMatrix4(child.matrixWorld);
                    scene.add(lines);
                    child.userData.edgeHelper = lines;
                }
            }
        });
    }

});



function animate() {

    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    animatedGrid.material.uniforms.time.value = elapsedTime;



    // Animación de la vista de infraestructura

    if (Math.abs(infraMaterial.opacity - infraTargetOpacity) > 0.01) {

        const newOpacity = infraMaterial.opacity + (infraTargetOpacity - infraMaterial.opacity) * 0.1;

        infraMaterial.opacity = newOpacity;

        animatedGrid.material.uniforms.opacity.value = newOpacity;



        if (!isInfraView && infraMaterial.opacity < 0.05) {

            infraMaterial.opacity = 0;

            animatedGrid.material.uniforms.opacity.value = 0;

            cityGroup.traverse(child => {

                if (child.isMesh && child.userData.originalMaterial) {

                    child.material = child.userData.originalMaterial;

                    delete child.userData.originalMaterial;

                }

            });

        }

        // Eliminación de edge helpers añadidos durante la vista de infraestructura
        if (!isInfraView) {
            cityGroup.traverse(child => {
                if (child.isMesh && child.userData && child.userData.edgeHelper) {
                    try { scene.remove(child.userData.edgeHelper); } catch (e) {}
                    if (child.userData.edgeHelper.geometry) child.userData.edgeHelper.geometry.dispose();
                    if (child.userData.edgeHelper.material) child.userData.edgeHelper.material.dispose();
                    delete child.userData.edgeHelper;
                }
            });
        }

    }

   

    entities.forEach(ent => { if (ent.type === 'residential' && ent.new.visible) { ent.new.children.forEach(c => { if (c.userData.anim) { const cur = c.scale.y, tar = ent.scale; c.scale.y += (tar - cur) * 0.05; c.position.y = (c.userData.baseH * c.scale.y) / 2; } }); } });

    smogParticles.forEach(p => { p.position.x += p.userData.sx; p.position.z += p.userData.sz; p.rotation.x += p.userData.rot; if (Math.abs(p.position.x) > 15) p.userData.sx *= -1; if (Math.abs(p.position.z) > 15) p.userData.sz *= -1; });

    // Actualizar comentarios flotantes (tanto sprites como meshes 3D): suben y se desvanecen
    const dt = Math.min(0.06, clock.getDelta());
    cityGroup.rotation.y += dt * 0.25;
    for (let i = floatingComments.length - 1; i >= 0; i--) {
        const f = floatingComments[i];
        if (!f) { floatingComments.splice(i, 1); continue; }
        if (f.sprite) {
            f.sprite.position.y += (f.vel || 0.3) * dt * 0.9;
            f.life -= dt;
            if (f.sprite.material && f.sprite.material.opacity !== undefined) f.sprite.material.opacity = Math.max(0, f.life / 2.2);
            if (f.life <= 0) {
                try { scene.remove(f.sprite); } catch (e) {}
                if (f.tex) f.tex.dispose();
                if (f.sprite.material && f.sprite.material.map) f.sprite.material.map.dispose();
                if (f.sprite.material) f.sprite.material.dispose();
                floatingComments.splice(i, 1);
            }
        } else if (f.mesh) {
            f.mesh.position.y += (f.vel || 0.4) * dt;
            f.life -= dt;
            // desvanecer materiales si tienen propiedad
            f.mesh.traverse(node => { if (node.material && node.material.opacity !== undefined) node.material.opacity = Math.max(0, f.life / 2.6); });
            if (f.life <= 0) {
                try { scene.remove(f.mesh); } catch (e) {}
                f.mesh.traverse(node => {
                    if (node.geometry) node.geometry.dispose();
                    if (node.material) {
                        if (node.material.map) node.material.map.dispose();
                        node.material.dispose();
                    }
                });
                floatingComments.splice(i, 1);
            }
        }
    }
    // Actualizar green particles (suben, se desplazan y se extinguen similar a smog)
    for (let i = greenParticles.length - 1; i >= 0; i--) {
        const gp = greenParticles[i];
        if (!gp) { greenParticles.splice(i, 1); continue; }
        gp.position.x += gp.userData.sx; gp.position.z += gp.userData.sz; gp.position.y += 0.02;
        gp.userData.life -= dt;
        if (gp.material && gp.material.opacity !== undefined) gp.material.opacity = Math.max(0, gp.userData.life / 4);
        if (gp.userData.life <= 0) {
            try { scene.remove(gp); } catch (e) {}
            if (gp.geometry) gp.geometry.dispose(); if (gp.material) gp.material.dispose();
            greenParticles.splice(i, 1);
        }
    }

    // Animaciones: crecimiento de árboles en overlays y pulso de entidades al transformarse
    entities.forEach(ent => {
        if (ent && ent._parkOverlay) {
            ent._parkOverlay.traverse(node => {
                if (node.userData && node.userData.growing) {
                    const t = node.userData.targetScale || 1.0;
                    node.scale.lerp(new THREE.Vector3(t, t, t), 0.12);
                } else if (node.scale && (node.scale.x > 0.02)) {
                    node.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), 0.12);
                }
            });
        }
        if (ent && ent.userData && ent.userData.pulse) {
            const target = ent.userData.pulse;
            if (ent.mesh && ent.mesh.scale) ent.mesh.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
            // decay pulse towards 1
            ent.userData.pulse += (1 - ent.userData.pulse) * 0.06;
            if (Math.abs(ent.userData.pulse - 1) < 0.01) ent.userData.pulse = 1;
        }
    });

    vehicles.forEach(v => {
        if (v.path) {
            v.mesh.position.x += v.speed;
            if (v.speed > 0 && v.mesh.position.x > v.boundary) v.mesh.position.x = -v.boundary;
            if (v.speed < 0 && v.mesh.position.x < -v.boundary) v.mesh.position.x = v.boundary;
            v.mesh.position.z = v.laneCoord;
        } else {
            v.mesh.position.z += v.speed;
            if (v.speed > 0 && v.mesh.position.z > v.boundary) v.mesh.position.z = -v.boundary;
            if (v.speed < 0 && v.mesh.position.z < -v.boundary) v.mesh.position.z = v.boundary;
            v.mesh.position.x = v.laneCoord;
        }
    });

    people.forEach(p => {
        const move = p.speed * p.dir;
        if (p.axis === 'x') {
            p.mesh.position.x += move;
            if (p.mesh.position.x > roadBoundary) p.mesh.position.x = -roadBoundary;
            if (p.mesh.position.x < -roadBoundary) p.mesh.position.x = roadBoundary;
            p.mesh.position.z += (p.lane - p.mesh.position.z) * 0.3;
        } else {
            p.mesh.position.z += move;
            if (p.mesh.position.z > roadBoundary) p.mesh.position.z = -roadBoundary;
            if (p.mesh.position.z < -roadBoundary) p.mesh.position.z = roadBoundary;
            p.mesh.position.x += (p.lane - p.mesh.position.x) * 0.3;
        }

        p.distance += p.speed;
        if (p.distance >= p.targetDistance) {
            p.distance = 0;
            p.targetDistance = step * (0.6 + Math.random() * 0.8);
            if (Math.random() > 0.5) {
                p.axis = p.axis === 'x' ? 'z' : 'x';
                p.lane = getPedestrianLane(streetLines[Math.floor(Math.random() * streetLines.length)]);
                if (p.axis === 'x') p.mesh.position.z = p.lane; else p.mesh.position.x = p.lane;
                p.dir = Math.random() > 0.5 ? 1 : -1;
            } else {
                p.dir *= -1;
            }
        }
    });

    renderer.render(scene, camera);

}



animate();

update();