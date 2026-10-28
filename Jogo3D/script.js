
import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";


// =====================================
// ELEMENTOS DA PÁGINA
// =====================================

const menu = document.getElementById("menu");
const iniciar = document.getElementById("iniciar");
const comoJogar = document.getElementById("comoJogar");
const regras = document.getElementById("regras");

const hud = document.getElementById("hud");
const gps = document.getElementById("painel-gps");
const controles = document.getElementById("controles");
const mensagem = document.getElementById("mensagem");

const velocidadeTexto = document.getElementById("velocidade");
const dinheiroTexto = document.getElementById("dinheiro");
const corridasTexto = document.getElementById("corridas");
const passageirosTexto = document.getElementById("passageiros");
const objetivoTexto = document.getElementById("objetivo");
const distanciaTexto = document.getElementById("distancia");

const minimapa = document.getElementById("minimapa");
const ctx = minimapa.getContext("2d");

// =====================================
// CENA THREE.JS
// =====================================

const cena = new THREE.Scene();
cena.background = new THREE.Color(0x8dc9f2);
cena.fog = new THREE.Fog(0x8dc9f2, 150, 500);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.className = "jogo3d";

document.body.appendChild(renderer.domElement);

// =====================================
// ILUMINAÇÃO
// =====================================

const luzAmbiente = new THREE.HemisphereLight(
    0xffffff,
    0x738f73,
    2.1
);
cena.add(luzAmbiente);

const sol = new THREE.DirectionalLight(0xffffff, 2.5);
sol.position.set(80, 150, 70);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
sol.shadow.camera.left = -230;
sol.shadow.camera.right = 230;
sol.shadow.camera.top = 230;
sol.shadow.camera.bottom = -230;
cena.add(sol);

// =====================================
// FUNÇÕES PARA CRIAR OBJETOS
// =====================================

function material(cor, metal = 0, rugosidade = 0.7) {
    return new THREE.MeshStandardMaterial({
        color: cor,
        metalness: metal,
        roughness: rugosidade
    });
}

const vidro = new THREE.MeshStandardMaterial({
    color: 0x183c55,
    metalness: 0.15,
    roughness: 0.12,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide
});

function caixa(
    grupo, largura, altura, profundidade,
    cor, x, y, z
) {
    const objeto = new THREE.Mesh(
        new THREE.BoxGeometry(
            largura, altura, profundidade
        ),
        typeof cor === "number" ? material(cor) : cor
    );

    objeto.position.set(x, y, z);
    objeto.castShadow = true;
    objeto.receiveShadow = true;
    grupo.add(objeto);

    return objeto;
}

function cilindro(
    grupo, raio, altura, cor,
    x, y, z, rotacao = 0
) {
    const objeto = new THREE.Mesh(
        new THREE.CylinderGeometry(
            raio, raio, altura, 16
        ),
        material(cor)
    );

    objeto.position.set(x, y, z);
    objeto.rotation.z = rotacao;
    objeto.castShadow = true;
    grupo.add(objeto);

    return objeto;
}

// =====================================
// CHÃO E RUAS
// =====================================

const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    material(0x4d9250)
);

chao.rotation.x = -Math.PI / 2;
chao.receiveShadow = true;
cena.add(chao);

const ruas = [-180, -120, -60, 0, 60, 120, 180];

for (const x of ruas) {
    caixa(cena, 19, 0.12, 440, 0x34383d, x, 0.06, 0);

    for (let z = -210; z <= 210; z += 14) {
        caixa(cena, 0.25, 0.02, 6, 0xf4eab1, x, 0.14, z);
    }
}

for (const z of ruas) {
    caixa(cena, 440, 0.13, 19, 0x34383d, 0, 0.07, z);

    for (let x = -210; x <= 210; x += 14) {
        caixa(cena, 6, 0.02, 0.25, 0xf4eab1, x, 0.15, z);
    }
}

// =====================================
// PRÉDIOS E CIDADE
// =====================================

const coresPredios = [
    0xd3d8dc,
    0xe4c9a8,
    0xb8c5d1,
    0xd6b3a4,
    0xa6b5b7
];

function criarPredio(x, z, altura, cor) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0, z);

    caixa(grupo, 24, altura, 24, cor, 0, altura / 2, 0);

    // Fachada com janelas
    for (let y = 4; y < altura - 2; y += 5) {
        for (let px = -8; px <= 8; px += 8) {
            caixa(
                grupo, 4, 2.8, 0.15,
                0x426c83, px, y, -12.1
            );

            caixa(
                grupo, 4, 2.8, 0.15,
                0x426c83, px, y, 12.1
            );
        }
    }

    caixa(grupo, 25, 0.6, 25, 0x777777, 0, altura, 0);

    cena.add(grupo);
}

for (let ix = -3; ix < 3; ix++) {
    for (let iz = -3; iz < 3; iz++) {
        const x = ix * 60 + 30;
        const z = iz * 60 + 30;

        const altura = 15 + ((Math.abs(ix * 7 + iz * 11) * 9) % 35);

        criarPredio(
            x,
            z,
            altura,
            coresPredios[Math.abs(ix + iz + 10) % coresPredios.length]
        );
    }
}

// =====================================
// ÁRVORES
// =====================================

function criarArvore(x, z) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0, z);

    cilindro(grupo, 0.5, 5, 0x68472c, 0, 2.5, 0);

    const copa = new THREE.Mesh(
        new THREE.SphereGeometry(3, 12, 10),
        material(0x2f7839)
    );

    copa.position.y = 6;
    copa.castShadow = true;
    grupo.add(copa);

    cena.add(grupo);
}

for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
        criarArvore(i * 60 + 12, j * 60 + 12);
        criarArvore(i * 60 + 46, j * 60 + 46);
    }
}

// =====================================
// ÔNIBUS URBANO BRASILEIRO
// =====================================

const onibus = new THREE.Group();
cena.add(onibus);

// Ferrari original do exemplo Three.js
const draco = new DRACOLoader();

draco.setDecoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/gltf/"
);

const carregadorFerrari = new GLTFLoader();
carregadorFerrari.setDRACOLoader(draco);

carregadorFerrari.load(
    "https://threejs.org/examples/models/gltf/ferrari.glb",

    (gltf) => {
        const ferrari = gltf.scene;

        // Ajusta o tamanho do carro
        const tamanho = new THREE.Box3()
            .setFromObject(ferrari)
            .getSize(new THREE.Vector3());

        const escala = 4.8 / Math.max(tamanho.x, tamanho.z);

        ferrari.scale.setScalar(escala);

        // Centraliza e coloca sobre o chão
        ferrari.updateMatrixWorld(true);

        const caixaFerrari = new THREE.Box3().setFromObject(ferrari);
        const centro = caixaFerrari.getCenter(new THREE.Vector3());

        ferrari.position.x -= centro.x;
        ferrari.position.z -= centro.z;
        ferrari.position.y -= caixaFerrari.min.y;

        // A frente da Ferrari deve apontar para -Z
        ferrari.rotation.y = 0;

        // Esconde o ônibus antigo
        carroceria.visible = false;

        // Coloca a Ferrari no mesmo grupo controlável
        onibus.add(ferrari);

        mostrarMensagem("Ferrari 3D carregada!");
    },

    undefined,

    (erro) => {
        console.error("Erro ao carregar a Ferrari:", erro);
        mostrarMensagem("Não foi possível carregar a Ferrari.");
    }
);


// Frente do ônibus aponta para -Z
const carroceria = new THREE.Group();
onibus.add(carroceria);

// Chassi
caixa(
    carroceria, 3.15, 0.65, 10.5,
    0x33363c, 0, 1.05, 0
);

// Piso
caixa(
    carroceria, 3.1, 0.16, 10.2,
    0x66686b, 0, 1.65, 0
);

// Corpo branco
caixa(
    carroceria, 3.12, 2.6, 10.25,
    0xf0f1f0, 0, 2.95, 0
);

// Faixa azul lateral
for (const lado of [-1, 1]) {
    caixa(
        carroceria, 0.035, 0.75, 10.1,
        0x0069b4, lado * 1.58, 2.15, 0
    );

    caixa(
        carroceria, 0.045, 0.12, 10.1,
        0xffd334, lado * 1.61, 2.62, 0
    );
}

// Teto arredondado visualmente
caixa(
    carroceria, 3.25, 0.28, 10.4,
    0xe8e8e8, 0, 4.35, 0
);

// Ar-condicionado no teto
caixa(
    carroceria, 2, 0.35, 3.1,
    0xe2e2e2, 0, 4.65, 1.1
);

// Janelas laterais
for (const lado of [-1, 1]) {
    for (let z = -3.4; z <= 3.5; z += 1.65) {
        caixa(
            carroceria, 0.055, 1.15, 1.4,
            vidro, lado * 1.59, 3.45, z
        );
    }
}

// Para-brisa frontal
caixa(
    carroceria, 2.85, 1.45, 0.06,
    vidro, 0, 3.45, -5.17
);

// Janela traseira
caixa(
    carroceria, 2.5, 1.05, 0.06,
    vidro, 0, 3.55, 5.17
);

// Painel de destino
caixa(
    carroceria, 2.5, 0.5, 0.09,
    0x111b22, 0, 4.04, -5.24
);

// Luzes do painel de destino
for (let x = -0.9; x <= 0.9; x += 0.3) {
    caixa(
        carroceria, 0.16, 0.06, 0.02,
        0xffbb00, x, 4.06, -5.30
    );
}

// Faróis
for (const lado of [-1, 1]) {
    caixa(
        carroceria, 0.65, 0.35, 0.12,
        0xfff3c1, lado * 1.05, 1.65, -5.24
    );

    caixa(
        carroceria, 0.48, 0.3, 0.1,
        0xe02d2d, lado * 1.08, 1.7, 5.24
    );
}

// Para-choques
caixa(
    carroceria, 3.2, 0.3, 0.3,
    0x22272d, 0, 1.1, -5.28
);

caixa(
    carroceria, 3.2, 0.3, 0.3,
    0x22272d, 0, 1.1, 5.28
);

// Retrovisores
for (const lado of [-1, 1]) {
    caixa(
        carroceria, 0.15, 0.1, 0.8,
        0x222222, lado * 1.78, 3.85, -4.6
    );

    caixa(
        carroceria, 0.22, 0.75, 0.5,
        0x222222, lado * 1.95, 3.6, -4.85
    );
}

// Portas do ônibus no lado direito
for (const z of [-3.15, 2.65]) {
    caixa(
        carroceria, 0.07, 2.25, 1.35,
        0x222b33, 1.63, 2.75, z
    );

    caixa(
        carroceria, 0.08, 1.35, 0.55,
        vidro, 1.69, 3.12, z - 0.34
    );

    caixa(
        carroceria, 0.08, 1.35, 0.55,
        vidro, 1.69, 3.12, z + 0.34
    );

    caixa(
        carroceria, 0.1, 2.2, 0.05,
        0xe2e2e2, 1.73, 2.75, z
    );
}

// Rodas
const rodas = [];

function criarRoda(x, z) {
    const roda = new THREE.Group();

    const pneu = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.68, 0.35, 24),
        material(0x17191c)
    );

    pneu.rotation.z = Math.PI / 2;
    pneu.castShadow = true;
    roda.add(pneu);

    const calota = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.37, 20),
        material(0xb7bec4, 0.7, 0.3)
    );

    calota.rotation.z = Math.PI / 2;
    roda.add(calota);

    roda.position.set(x, 0.75, z);
    carroceria.add(roda);
    rodas.push(roda);
}

for (const lado of [-1, 1]) {
    criarRoda(lado * 1.48, -3.4);
    criarRoda(lado * 1.48, 3.35);
}

// Bancos dentro do ônibus
for (let z = -2.4; z <= 3.7; z += 1.2) {
    for (const x of [-0.8, 0.8]) {
        caixa(
            carroceria, 0.9, 0.18, 0.85,
            0x224b78, x, 2.12, z
        );

        caixa(
            carroceria, 0.9, 0.9, 0.15,
            0x224b78, x, 2.55, z + 0.37
        );
    }
}

// Volante
const volante = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.055, 8, 18),
    material(0x1a1a1a)
);

volante.position.set(-0.85, 2.85, -4.3);
volante.rotation.x = 0.6;
carroceria.add(volante);

// Posição inicial
onibus.position.set(0, 0, 0);

// =====================================
// PERSONAGENS 3D
// =====================================

function criarPessoa(corRoupa = 0x2871b7) {
    const pessoa = new THREE.Group();

    // Pernas
    caixa(pessoa, 0.25, 0.85, 0.3, 0x283341, -0.18, 0.45, 0);
    caixa(pessoa, 0.25, 0.85, 0.3, 0x283341, 0.18, 0.45, 0);

    // Corpo
    caixa(pessoa, 0.85, 1.05, 0.45, corRoupa, 0, 1.35, 0);

    // Braços
    caixa(pessoa, 0.2, 0.95, 0.3, 0xb77e59, -0.55, 1.35, 0);
    caixa(pessoa, 0.2, 0.95, 0.3, 0xb77e59, 0.55, 1.35, 0);

    // Cabeça
    const cabeca = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 10),
        material(0xc38b65)
    );

    cabeca.position.y = 2.18;
    pessoa.add(cabeca);

    // Cabelo
    const cabelo = new THREE.Mesh(
        new THREE.SphereGeometry(0.33, 12, 8),
        material(0x30221b)
    );

    cabelo.scale.y = 0.45;
    cabelo.position.y = 2.42;
    pessoa.add(cabelo);

    return pessoa;
}

// =====================================
// PONTOS DE ÔNIBUS
// =====================================

const pontos = [];

function criarPonto(x, z) {
    const grupo = new THREE.Group();
    grupo.position.set(x, 0, z);

    // Plataforma
    caixa(grupo, 6, 0.2, 3, 0xb9b9b9, 0, 0.1, 0);

    // Cobertura
    caixa(grupo, 5.5, 0.25, 2.7, 0x2584bb, 0, 3.2, 0);

    // Colunas
    for (const lado of [-1, 1]) {
        caixa(
            grupo, 0.18, 3, 0.18,
            0x555555, lado * 2.35, 1.6, 0.9
        );
    }

    // Banco
    caixa(grupo, 3.2, 0.2, 0.6, 0x555555, 0, 1, 0.7);
    caixa(grupo, 3.2, 0.9, 0.15, 0x555555, 0, 1.5, 1);

    cena.add(grupo);
    pontos.push(grupo);

    return grupo;
}

// Rotas próximas às ruas

const rotas = [
    {
        embarque: { x: 7, z: -180 },
        destino: { x: 187, z: 180 }
    },
    {
        embarque: { x: 187, z: 180 },
        destino: { x: -173, z: -180 }
    },
    {
        embarque: { x: -173, z: -180 },
        destino: { x: 187, z: -120 }
    },
    {
        embarque: { x: 187, z: -120 },
        destino: { x: -173, z: 180 }
    }
];


const pessoasEsperando = [];

for (const rota of rotas) {
    for (const local of [rota.embarque, rota.destino]) {
        criarPonto(local.x + 7, local.z + 7);
    }

    const grupo = new THREE.Group();
    grupo.position.set(rota.embarque.x + 7, 0.2, rota.embarque.z + 5);

    for (let i = 0; i < 3; i++) {
        const pessoa = criarPessoa(
            [0xd64b43, 0x2675bd, 0x4c9858][i]
        );

        pessoa.position.x = (i - 1) * 1.4;
        grupo.add(pessoa);
    }

    cena.add(grupo);
    pessoasEsperando.push(grupo);
}

// =====================================
// MARCADOR DO OBJETIVO
// =====================================

const marcador = new THREE.Group();

const circulo = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.2, 8, 32),
    new THREE.MeshBasicMaterial({
        color: 0x00ffb3
    })
);

circulo.rotation.x = Math.PI / 2;
circulo.position.y = 0.35;
marcador.add(circulo);

const seta = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 2, 12),
    new THREE.MeshBasicMaterial({
        color: 0xffdd00
    })
);

seta.position.y = 5;
seta.rotation.z = Math.PI;
marcador.add(seta);

cena.add(marcador);

// =====================================
// SISTEMA DE MISSÕES
// =====================================

let indiceRota = 0;
let fase = "embarque";
let passageiros = 0;
let dinheiro = 0;
let corridas = 0;

function objetivoAtual() {
    const rota = rotas[indiceRota];

    return fase === "embarque"
        ? rota.embarque
        : rota.destino;
}

function atualizarObjetivo() {
    const alvo = objetivoAtual();

    marcador.position.set(alvo.x, 0, alvo.z);

    objetivoTexto.textContent =
        fase === "embarque"
            ? "Vá até o ponto e aperte F"
            : "Leve os passageiros ao destino";

    passageirosTexto.textContent = passageiros;
    dinheiroTexto.textContent = dinheiro;
    corridasTexto.textContent = corridas;
}

function mostrarMensagem(texto) {
    mensagem.textContent = texto;
    mensagem.classList.remove("oculto");
}

function distanciaAteAlvo() {
    const alvo = objetivoAtual();

    return Math.hypot(
        onibus.position.x - alvo.x,
        onibus.position.z - alvo.z
    );
}

function interagirPonto() {
    if (!jogando) return;

    const distancia = distanciaAteAlvo();

    if (distancia > 13) {
        mostrarMensagem("Chegue mais perto do ponto de ônibus!");
        return;
    }

    if (Math.abs(velocidade) > 1) {
        mostrarMensagem("Pare o ônibus antes de abrir as portas!");
        return;
    }

    if (fase === "embarque") {
        passageiros = 3;
        pessoasEsperando[indiceRota].visible = false;
        fase = "destino";

        mostrarMensagem("3 passageiros embarcaram! Siga o GPS.");
    } else {
        passageiros = 0;
        dinheiro += 45;
        corridas++;

        indiceRota = (indiceRota + 1) % rotas.length;
        fase = "embarque";

        pessoasEsperando[indiceRota].visible = true;

        mostrarMensagem("Corrida concluída! Você ganhou R$ 45.");
    }

    atualizarObjetivo();
}

atualizarObjetivo();

// =====================================
// CONTROLES DO ÔNIBUS
// =====================================

const teclas = {};
let jogando = false;
let velocidade = 0;
let tipoCamera = 0;

window.addEventListener("keydown", (evento) => {
    const tecla = evento.key.toLowerCase();

    if (["w", "a", "s", "d", " ", "arrowup", "arrowdown"].includes(tecla)) {
        evento.preventDefault();
    }

    teclas[tecla] = true;

    if (evento.repeat) return;

    if (tecla === "f") {
        interagirPonto();
    }

    if (tecla === "c" && jogando) {
        tipoCamera = (tipoCamera + 1) % 3;
    }

    if (tecla === "escape") {
        if (jogando) {
            abrirMenu();
            document.getElementById("abrirGaragem").classList.add("oculto");
        } else {
            comecarJogo();
            document.getElementById("abrirGaragem").classList.remove("oculto");
        }
    }
});

window.addEventListener("keyup", (evento) => {
    teclas[evento.key.toLowerCase()] = false;
});

// Evita que o ônibus continue acelerando ao trocar de janela
window.addEventListener("blur", () => {
    for (const tecla in teclas) {
        teclas[tecla] = false;
    }
});

// =====================================
// BOTÕES DO MENU
// =====================================


function comecarJogo() {
    jogando = true;

    menu.classList.add("oculto");
    hud.classList.remove("oculto");
    gps.classList.remove("oculto");
    controles.classList.remove("oculto");

    // Mostra os botões do celular
    document.getElementById("controles-mobile").classList.remove("oculto");

    mostrarMensagem("🏎️ Dirija sua Ferrari até o primeiro objetivo!");
}


function abrirMenu() {
    jogando = false;
    velocidade = 0;

    menu.classList.remove("oculto");
    hud.classList.add("oculto");
    gps.classList.add("oculto");
    controles.classList.add("oculto");
    mensagem.classList.add("oculto");

    document.getElementById("controles-mobile").classList.add("oculto");
}

iniciar.addEventListener("click", comecarJogo);

comoJogar.addEventListener("click", () => {
    regras.classList.toggle("oculto");
});



// =====================================
// MOVIMENTO DO ÔNIBUS
// =====================================

const relogio = new THREE.Clock();

function moverOnibus(delta) {
    if (!jogando) return;

    const aceleracao = 18;
    const freio = 35;
   const maxima = velocidadeMaximaCarro;
    const reMaxima = -10;

    if (teclas["w"] || teclas["arrowup"]) {
        velocidade += aceleracao * delta;
    } else if (teclas["s"] || teclas["arrowdown"]) {
        velocidade -= aceleracao * delta;
    } else {
        velocidade *= Math.pow(0.97, delta * 60);
    }

    if (teclas[" "]) {
        const reducao = freio * delta;

        if (Math.abs(velocidade) <= reducao) {
            velocidade = 0;
        } else {
            velocidade -= Math.sign(velocidade) * reducao;
        }
    }

    velocidade = THREE.MathUtils.clamp(
        velocidade,
        reMaxima,
        maxima
    );

    if (Math.abs(velocidade) < 0.03) {
        velocidade = 0;
    }

    // Direção com A e D
    if (Math.abs(velocidade) > 0.15) {
        const sentido = Math.sign(velocidade);
        const giro = 0.65 * delta * sentido;

        if (teclas["a"]) {
            onibus.rotation.y += giro;
        }

        if (teclas["d"]) {
            onibus.rotation.y -= giro;
        }
    }

    // Frente do ônibus = -Z
    const direcao = new THREE.Vector3(
        -Math.sin(onibus.rotation.y),
        0,
        -Math.cos(onibus.rotation.y)
    );

    onibus.position.addScaledVector(
        direcao,
        velocidade * delta
    );

    // Limite da cidade
    onibus.position.x = THREE.MathUtils.clamp(
        onibus.position.x, -215, 215
    );

    onibus.position.z = THREE.MathUtils.clamp(
        onibus.position.z, -215, 215
    );

    // Rodas girando
    for (const roda of rodas) {
        roda.rotation.x -= velocidade * delta / 0.68;
    }

    // Velocidade mostrada no painel
    velocidadeTexto.textContent = Math.round(
        Math.abs(velocidade) * 3.6
    );

    distanciaTexto.textContent = Math.round(
        distanciaAteAlvo()
    );

    // Marcador animado
    marcador.position.y =
        Math.sin(performance.now() * 0.003) * 0.3;
}

// =====================================
// CÂMERAS
// =====================================

function atualizarCamera(delta) {
    const angulo = onibus.rotation.y;

    let deslocamento;

    if (tipoCamera === 0) {
        // Atrás do ônibus
        deslocamento = new THREE.Vector3(
            Math.sin(angulo) * 17,
            9,
            Math.cos(angulo) * 17
        );
    } else if (tipoCamera === 1) {
        // Câmera mais distante
        deslocamento = new THREE.Vector3(
            Math.sin(angulo) * 27,
            18,
            Math.cos(angulo) * 27
        );
    } else {
        // Câmera elevada
        deslocamento = new THREE.Vector3(0, 40, 12);
    }

    const destino = onibus.position.clone().add(deslocamento);

    camera.position.lerp(
        destino,
        Math.min(1, delta * 5)
    );

    const olhar = onibus.position.clone();
    olhar.y += 2;

    camera.lookAt(olhar);
}

// =====================================
// GPS / MINIMAPA
// =====================================

function desenharGPS() {
    const largura = minimapa.width;
    const altura = minimapa.height;

    ctx.clearRect(0, 0, largura, altura);

    ctx.fillStyle = "#193e3c";
    ctx.fillRect(0, 0, largura, altura);

    const escala = 0.48;

    function converter(x, z) {
        return {
            x: largura / 2 + (x - onibus.position.x) * escala,
            y: altura / 2 + (z - onibus.position.z) * escala
        };
    }

    // Ruas
    ctx.strokeStyle = "#777f83";
    ctx.lineWidth = 7;

    for (const x of ruas) {
        const inicio = converter(x, -220);
        const fim = converter(x, 220);

        ctx.beginPath();
        ctx.moveTo(inicio.x, inicio.y);
        ctx.lineTo(fim.x, fim.y);
        ctx.stroke();
    }

    for (const z of ruas) {
        const inicio = converter(-220, z);
        const fim = converter(220, z);

        ctx.beginPath();
        ctx.moveTo(inicio.x, inicio.y);
        ctx.lineTo(fim.x, fim.y);
        ctx.stroke();
    }

    // Objetivo
    const alvo = objetivoAtual();
    const ponto = converter(alvo.x, alvo.z);

    ctx.strokeStyle = "#ffdf35";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]);

    ctx.beginPath();
    ctx.moveTo(largura / 2, altura / 2);
    ctx.lineTo(ponto.x, ponto.y);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.fillStyle = "#ffdf35";
    ctx.beginPath();
    ctx.arc(ponto.x, ponto.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ônibus no centro do mapa
    ctx.save();
    ctx.translate(largura / 2, altura / 2);
    ctx.rotate(-onibus.rotation.y);

    ctx.fillStyle = "#00d5ff";
    ctx.fillRect(-5, -10, 10, 20);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-3, -9, 6, 4);

    ctx.restore();
}

// =====================================
// INICIALIZAÇÃO E ANIMAÇÃO
// =====================================

camera.position.set(0, 12, 20);
camera.lookAt(0, 2, 0);

function animar() {
    requestAnimationFrame(animar);

    const delta = Math.min(relogio.getDelta(), 0.05);

    moverOnibus(delta);
    atualizarCamera(delta);
    desenharGPS();

    renderer.render(cena, camera);
}

animar();

// Ajustar tela quando mudar o tamanho
window.addEventListener("resize", () => {
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

console.log("City Bus 3D iniciado com sucesso!");


// =====================================
// CONTROLES DO CELULAR
// =====================================

// Liga um botão da tela a uma tecla do jogo
function configurarBotaoMobile(id, tecla) {
    const botao = document.getElementById(id);

    if (!botao) return;

    function pressionar(evento) {
        evento.preventDefault();
        if (!jogando) return;

        teclas[tecla] = true;

        if (evento.pointerId !== undefined) {
            botao.setPointerCapture(evento.pointerId);
        }
    }

    function soltar(evento) {
        evento.preventDefault();
        teclas[tecla] = false;
    }

    botao.addEventListener("pointerdown", pressionar);
    botao.addEventListener("pointerup", soltar);
    botao.addEventListener("pointercancel", soltar);
    botao.addEventListener("lostpointercapture", () => {
        teclas[tecla] = false;
    });
}

// Botões de movimento
configurarBotaoMobile("btn-acelerar", "w");
configurarBotaoMobile("btn-re", "s");
configurarBotaoMobile("btn-esquerda", "a");
configurarBotaoMobile("btn-direita", "d");
configurarBotaoMobile("btn-frear", " ");

// Botão para completar missões
document.getElementById("btn-interagir")
    .addEventListener("click", () => {
        if (jogando) interagirPonto();
    });

// Botão para trocar câmera
document.getElementById("btn-camera")
    .addEventListener("click", () => {
        if (jogando) {
            tipoCamera = (tipoCamera + 1) % 3;
        }
    });

// Botão para abrir menu
document.getElementById("btn-menu-mobile")
    .addEventListener("click", () => {
        if (jogando) abrirMenu();
    });

    
// =====================================
// CONCESSIONÁRIA DE CARROS
// =====================================

// Carros disponíveis para comprar
const carrosLoja = [
    {
        nome: "Ferrari Vermelha",
        preco: 0,
        cor: 0xe21d2f,
        velocidade: 35,
        tipo: "original"
    },
    {
        nome: "Esportivo Azul",
        preco: 90,
        cor: 0x1379ed,
        velocidade: 42,
        tipo: "esportivo"
    },
    {
        nome: "Supercarro Roxo",
        preco: 180,
        cor: 0x8735d9,
        velocidade: 49,
        tipo: "supercarro"
    },
    {
        nome: "Hipercarro Dourado",
        preco: 300,
        cor: 0xe4b62c,
        velocidade: 58,
        tipo: "hipercarro"
    }
];

let carroSelecionado = 0;
let velocidadeMaximaCarro = 35;
let garagemAberta = false;

// Guarda os carros já comprados
const carrosComprados = new Set([0]);

// Referência do carro criado por código
let carroExtra = null;

// Elementos da garagem
const garagem = document.getElementById("garagem");
const abrirGaragem = document.getElementById("abrirGaragem");
const fecharGaragem = document.getElementById("fecharGaragem");
const listaCarros = document.getElementById("listaCarros");
const saldoGaragem = document.getElementById("saldoGaragem");

// Cria um carro esportivo com formas 3D
function criarCarroNovo(tipo, cor) {
    const grupo = new THREE.Group();

    const pintura = new THREE.MeshPhysicalMaterial({
        color: cor,
        metalness: 0.55,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.1
    });

    const vidroCarro = new THREE.MeshStandardMaterial({
        color: 0x163449,
        metalness: 0.25,
        roughness: 0.12
    });

    function parte(l, a, p, mat, x, y, z) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(l, a, p),
            mat
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        grupo.add(mesh);

        return mesh;
    }

    // Chassi
    parte(2.2, 0.45, 4.7, pintura, 0, 0.85, 0);

    // Capô
    parte(2.05, 0.22, 1.45, pintura, 0, 1.1, -1.5);

    // Cabine
    const cabine = parte(
        1.7, 0.65, 2,
        vidroCarro, 0, 1.45, 0.15
    );

    cabine.rotation.x = -0.08;

    // Teto
    parte(1.6, 0.13, 1.25, pintura, 0, 1.85, 0.2);

    // Frente
    parte(2.1, 0.2, 0.15, 0x111111, 0, 0.65, -2.35);

    // Faróis
    for (const lado of [-1, 1]) {
        parte(
            0.45, 0.15, 0.07,
            0xffffff, lado * 0.78, 1, -2.38
        );

        parte(
            0.4, 0.15, 0.07,
            0xff2020, lado * 0.78, 1, 2.38
        );
    }

    // Rodas
    for (const x of [-1.12, 1.12]) {
        for (const z of [-1.5, 1.5]) {
            const roda = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 0.3, 20),
                new THREE.MeshStandardMaterial({
                    color: 0x171717
                })
            );

            roda.rotation.z = Math.PI / 2;
            roda.position.set(x, 0.5, z);
            grupo.add(roda);
        }
    }

    // Aerofólio para os carros mais caros
    if (tipo === "supercarro" || tipo === "hipercarro") {
        parte(2.3, 0.12, 0.45, pintura, 0, 1.55, 2.1);

        for (const x of [-0.75, 0.75]) {
            parte(0.12, 0.5, 0.12, 0x222222, x, 1.28, 2.1);
        }
    }

    // Detalhe exclusivo do hipercarro
    if (tipo === "hipercarro") {
        parte(0.15, 0.04, 4.3, 0x111111, 0, 1.13, 0);
    }

    return grupo;
}

// Troca o veículo que o jogador dirige
function escolherCarro(indice) {
    const carro = carrosLoja[indice];

    if (!carrosComprados.has(indice)) {
        mostrarMensagem("Você ainda não comprou esse carro!");
        return;
    }

    carroSelecionado = indice;
    velocidadeMaximaCarro = carro.velocidade;
    velocidade = 0;

    // Remove o carro extra anterior
    if (carroExtra) {
        onibus.remove(carroExtra);
        carroExtra = null;
    }

    // Esconde ou mostra a Ferrari original
    if (indice === 0) {
        // A Ferrari carregada fica dentro do grupo onibus
        onibus.children.forEach((objeto) => {
            if (objeto !== carroceria) {
                objeto.visible = true;
            }
        });
    } else {
        // Esconde a Ferrari original
        onibus.children.forEach((objeto) => {
            if (objeto !== carroceria) {
                objeto.visible = false;
            }
        });

        carroExtra = criarCarroNovo(carro.tipo, carro.cor);
        onibus.add(carroExtra);
    }

    mostrarMensagem("Agora você está dirigindo: " + carro.nome);
}

// Atualiza os carros disponíveis
function atualizarGaragem() {
    saldoGaragem.textContent = dinheiro;
    listaCarros.innerHTML = "";

    carrosLoja.forEach((carro, indice) => {
        const comprado = carrosComprados.has(indice);
        const selecionado = carroSelecionado === indice;

        const card = document.createElement("div");
        card.className = "carro-loja";

        const amostra = document.createElement("div");
        amostra.className = "amostra-carro";
        amostra.style.width = "80%";
        amostra.style.backgroundColor =
            "#" + carro.cor.toString(16).padStart(6, "0");

        const titulo = document.createElement("h3");
        titulo.textContent = carro.nome;

        const preco = document.createElement("p");
        preco.textContent = carro.preco === 0
            ? "GRÁTIS"
            : "R$ " + carro.preco;

        const velocidadeInfo = document.createElement("p");
        velocidadeInfo.textContent =
            "Máx.: " + Math.round(carro.velocidade * 3.6) + " km/h";

        const botao = document.createElement("button");

        botao.textContent = selecionado
            ? "EM USO"
            : comprado
                ? "USAR CARRO"
                : "COMPRAR";

        botao.disabled = selecionado;

        botao.addEventListener("click", () => {
            if (!carrosComprados.has(indice)) {
                if (dinheiro < carro.preco) {
                    alert("Você precisa de mais dinheiro!");
                    return;
                }

                const confirmar = confirm(
                    "Comprar " + carro.nome +
                    " por R$ " + carro.preco + "?"
                );

                if (!confirmar) return;

                dinheiro -= carro.preco;
                carrosComprados.add(indice);
                dinheiroTexto.textContent = dinheiro;
            }

            escolherCarro(indice);
            atualizarGaragem();
        });

        card.append(
            amostra,
            titulo,
            preco,
            velocidadeInfo,
            botao
        );

        listaCarros.appendChild(card);
    });
}

// Abre a garagem
abrirGaragem.addEventListener("click", () => {
    if (!jogando) return;

    garagemAberta = true;
    jogando = false;
    velocidade = 0;

    atualizarGaragem();
    garagem.classList.remove("oculto");

    const mobile = document.getElementById("controles-mobile");
    if (mobile) mobile.classList.add("oculto");
});

// Fecha a garagem
fecharGaragem.addEventListener("click", () => {
    garagemAberta = false;
    garagem.classList.add("oculto");
    jogando = true;

    const mobile = document.getElementById("controles-mobile");
    if (mobile) mobile.classList.remove("oculto");
});
