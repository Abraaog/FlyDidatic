/* ================================================================
   PARTE 1 — MOTOR DO JOGO (o aluno NÃO precisa mexer aqui)
   Contém: paleta, classe Mosca (só desenho), Sombra, comida,
   faíscas, cenário, colisões, HUD, painel de neurônios e o
   game loop (setup/draw do p5.js).
   ================================================================ */

// ----- Constantes do mundo -----
const LARGURA = 800;                    // largura do canvas
const ALTURA  = 600;                    // altura do canvas
const SEGUNDOS_PARA_VENCER = 10;        // sobreviver 10s = vitória
const FRAMES_PARA_VENCER   = SEGUNDOS_PARA_VENCER * 60; // 60 FPS

const COR_FUNDO = '#fdf6ec';            // "bancada" clara do laboratório

// ----- Paleta vibrante usada nos desenhos do canvas -----
const PALETA = {
  grid:      [124, 77, 255, 14],    // linhas do "caderno de laboratório"
  blobA:     [124, 77, 255, 10],    // mancha decorativa violeta
  blobB:     [0, 229, 160, 10],     // mancha decorativa menta
  perigo:    [255, 45, 85],
  rastroA:   null,                  // preenchidas no setup (cores p5)
  rastroB:   null,
  asa:       [180, 160, 255, 130],
  corpoTopo: [58, 42, 94],
  corpoBase: [36, 24, 64],
  brilhoOlho:[255, 255, 255, 200],
  painel:    [24, 14, 48, 235],     // vidro escuro do painel de neurônios
  vidro:     [255, 255, 255, 60]
};

// ----- Estado global do jogo -----
let mosca;                 // objeto da classe Mosca (só gráficos/movimento)
let comida   = null;       // maçã do desafio final (null = não existe ainda)
let fimDeJogo = false;     // virou true quando a sombra pega a mosca
let vitoria   = false;     // virou true ao sobreviver 10 segundos
let frameAtual = 0;        // contador de frames (60 por segundo)
let tempoSobrevivido = 0;  // segundos sobrevividos (para o placar)
let primeiroFrame = true;  // controla a tela de instruções inicial
let framesAteNovaComida = 180; // contador para nascer uma nova maçã

// FAÍSCAS — pequenas partículas festivas (efeitos visuais).
// Cada faísca é um OBJETO {x, y, vx, vy, vida, cor} num ARRAY;
// nascem quando um neurônio dispara ou a mosca come a maçã.
let faiscas = [];

// Cria um "explode" de faíscas coloridas numa posição
function explodirFaiscas(x, y, cor, quantidade) {
  for (let i = 0; i < quantidade; i++) {
    const angulo = random(0, TWO_PI);
    const forca  = random(1, 4);
    faiscas.push({
      x: x, y: y,
      vx: Math.cos(angulo) * forca,
      vy: Math.sin(angulo) * forca,
      vida: random(20, 40),
      cor: cor
    });
  }
}

// Atualiza e desenha as faíscas (chamado todo frame pelo draw)
function desenharFaiscas() {
  noStroke();
  for (let i = faiscas.length - 1; i >= 0; i--) {
    const f = faiscas[i];
    f.x += f.vx;
    f.y += f.vy;
    f.vx *= 0.95;                 // atrito (desacelera)
    f.vy *= 0.95;
    f.vida--;
    if (f.vida <= 0) { faiscas.splice(i, 1); continue; }
    fill(f.cor[0], f.cor[1], f.cor[2], f.vida * 6); // some devagar
    circle(f.x, f.y, map(f.vida, 0, 40, 1, 5));
  }
}

// ---------------------------------------------------------------
// CLASSE MOSCA — única classe do projeto (exceção didática!).
// Serve APENAS para organizar o desenho e o movimento da mosca.
// Trate-a como uma "caixa preta" do motor: o aluno não precisa
// entender Orientação a Objetos para jogar.
// ---------------------------------------------------------------
class Mosca {
  constructor() {
    this.x = LARGURA / 2;   // posição horizontal
    this.y = ALTURA / 2;    // posição vertical
    this.angulo = 0;        // direção para onde a mosca "olha"
    this.rastro = [];       // ARRAY de posições anteriores (efeito de velocidade)
  }

  // Move a mosca na direção `angulo` com a `velocidade` dada
  // e registra a posição no rastro.
  mover(angulo, velocidade) {
    // cos/sen convertem um ângulo em deslocamento no eixo x/y
    this.x += Math.cos(angulo) * velocidade;
    this.y += Math.sin(angulo) * velocidade;

    // Mantém a mosca dentro da tela
    this.x = constrain(this.x, 20, LARGURA - 20);
    this.y = constrain(this.y, 20, ALTURA - 20);

    // Guarda a posição no rastro (máximo de 15 pontos)
    this.rastro.push({ x: this.x, y: this.y });
    if (this.rastro.length > 15) this.rastro.shift();
  }

  // Desenha a mosca inteira: rastro, sombra, asas batendo, corpo e olhos.
  desenhar() {
    // 1) RASTRO — bolinhas que esmaecem num degradê menta -> violeta.
    //    (lerpColor mistura duas cores; i/len vai de 0 a 1)
    noStroke();
    for (let i = 0; i < this.rastro.length; i++) {
      const p = this.rastro[i];
      const t = i / this.rastro.length;              // 0 = antigo, 1 = recente
      const cor = lerpColor(PALETA.rastroA, PALETA.rastroB, t);
      cor.setAlpha(30 + t * 90);                     // recentes brilham mais
      fill(cor);
      circle(p.x, p.y, 4 + t * 5);                   // recentes são maiores
    }

    // 2) Sombra da mosca no chão (elipse achatada translúcida)
    noStroke();
    fill(30, 15, 60, 40);
    ellipse(this.x, this.y + 14, 26, 10);

    // 3) Corpo — desenhado num sistema de coordenadas próprio
    //    (translate vai para a posição da mosca, rotate gira a tela)
    push();
    translate(this.x, this.y);
    rotate(this.angulo);

    // ASAS — batem usando a função sin() e o número do frame atual.
    // sin() oscila suavemente entre -1 e 1; multiplicado por 0.5,
    // vira um ângulo de asa que vai e volta (a "batida").
    const anguloAsa = sin(frameCount * 0.5) * 0.5;
    noStroke();

    // Asa de cima (rotaciona para trás e para frente com a batida)
    push();
    rotate(-0.4 + anguloAsa);
    fill(PALETA.asa);
    ellipse(-4, -14, 10, 22);
    // brilho da asa (listra clara)
    fill(255, 255, 255, 60);
    ellipse(-4, -16, 3, 14);
    pop();

    // Asa de baixo (espelhada)
    push();
    rotate(0.4 - anguloAsa);
    fill(PALETA.asa);
    ellipse(-4, 14, 10, 22);
    fill(255, 255, 255, 60);
    ellipse(-4, 16, 3, 14);
    pop();

    // CORPO — tórax + abdômen em degradê violeta escuro com listras
    fill(PALETA.corpoBase);
    ellipse(-14, 0, 18, 12);    // abdômen (atrás)
    fill(PALETA.corpoTopo);
    ellipse(0, 0, 30, 16);      // tórax
    // reflexo de luz no tórax (elipse clara e translúcida)
    fill(190, 170, 255, 70);
    ellipse(2, -4, 14, 6);
    // listras do abdômen em tom elétrico
    stroke(0, 229, 160, 160);
    strokeWeight(1.5);
    line(-18, -4, -10, -4);
    line(-18, 4, -10, 4);
    noStroke();

    // CABEÇA + olhos vermelhos BRILHANTES (clássico da Drosophila!)
    fill(46, 32, 78);
    circle(16, 0, 14);
    fill(255, 45, 85);                    // vermelho vivo
    circle(19, -4, 6);
    circle(19, 4, 6);
    fill(PALETA.brilhoOlho);              // pontinho de luz no olho
    circle(20, -5, 2);
    circle(20, 3, 2);

    pop(); // volta ao sistema de coordenadas original da tela
  }
}

// ---------------------------------------------------------------
// SOMBRA — o predador. Objeto simples (sem classe) que segue o
// mouse com um pequeno atraso, como um pássaro se aproximando.
// ---------------------------------------------------------------
const sombra = {
  x: LARGURA / 2,
  y: ALTURA / 2,
  raio: 45,

  // Interpolação linear: a sombra anda 5% do caminho até o mouse
  // a cada frame -> movimento suave e "persguidor".
  // (O valor 0.05 é um ajuste de BALANCEAMENTO: torna a sombra
  // lenta o bastante para uma mosca com cérebro consertado
  // conseguir escapar em campo aberto — mas ela ainda pode ser
  // encurralada nos cantos!)
  atualizar() {
    this.x += (mouseX - this.x) * 0.05;
    this.y += (mouseY - this.y) * 0.05;
  },

  desenhar() {
    // A sombra fica VERMELHA quando está perto da mosca (perigo!)
    const d = dist(this.x, this.y, mosca.x, mosca.y);
    const perto = d < 150;

    // Aura em camadas: 3 círculos concêntricos translúcidos criam
    // um efeito de "gradiente radial" barato e bonito.
    noStroke();
    for (let camada = 3; camada >= 1; camada--) {
      const escala = 1 + camada * 0.22;
      if (perto) fill(255, 45, 85, 18 * camada);
      else       fill(25, 15, 50, 22 * camada);
      circle(this.x, this.y, this.raio * 2 * escala);
    }

    // Núcleo da sombra
    if (perto) fill('rgba(255, 45, 85, 0.75)');
    else       fill('rgba(22, 14, 44, 0.60)');
    circle(this.x, this.y, this.raio * 2);

    // Olhos do predador (dois pontos brilhantes) — dá "vida" à sombra
    fill(255, 220, 90, 220);
    circle(this.x - 8, this.y - 4, 6);
    circle(this.x + 8, this.y - 4, 6);

    // Anel pulsante de alerta quando o perigo é iminente
    if (perto) {
      noFill();
      stroke(255, 45, 85, 120 + 80 * sin(frameCount * 0.2));
      strokeWeight(3);
      circle(this.x, this.y, this.raio * 2 + 10 + 6 * sin(frameCount * 0.2));
      noStroke();
    }
  }
};

// ---------------------------------------------------------------
// COMIDA — Desafio adicional: a maçã que aparece aleatoriamente.
// ---------------------------------------------------------------
function talvezCriarComida() {
  if (comida) return; // já existe uma maçã na tela
  framesAteNovaComida--;
  if (framesAteNovaComida <= 0) {
    comida = {
      x: random(100, LARGURA - 280), // longe do painel de neurônios
      y: random(100, ALTURA - 100),
      pulso: random(0, TWO_PI),      // fase da animação de brilho
      desenhar() {
        // Anel de brilho pulsante (a maçã "chama" a mosca)
        this.pulso += 0.06;
        noFill();
        stroke(255, 201, 60, 90 + 60 * sin(this.pulso));
        strokeWeight(2);
        circle(this.x, this.y, 34 + 6 * sin(this.pulso));
        noStroke();

        // Corpo da maçã em vermelho vivo com brilho
        fill(235, 45, 60);
        circle(this.x, this.y, 20);
        fill(255, 255, 255, 90);
        ellipse(this.x - 4, this.y - 5, 6, 4);   // reflexo de luz
        // Folha e cabinho
        fill(60, 200, 90);
        ellipse(this.x + 7, this.y - 12, 10, 5);
        stroke(110, 70, 35);
        strokeWeight(2);
        line(this.x, this.y - 8, this.x, this.y - 14);
        noStroke();
      }
    };
  }
}

// ---------------------------------------------------------------
// CENÁRIO — grade de caderno + manchas suaves decorativas.
// Desenhado atrás de todo o resto para dar profundidade.
// ---------------------------------------------------------------
function desenharCenario() {
  background(COR_FUNDO);

  // Grade fina (linhas verticais e horizontais a cada 40 px)
  stroke(PALETA.grid);
  strokeWeight(1);
  for (let x = 40; x < LARGURA; x += 40) line(x, 0, x, ALTURA);
  for (let y = 40; y < ALTURA;  y += 40) line(0, y, LARGURA, y);
  noStroke();

  // Duas manchas grandes e suaves (profundidade de laboratório)
  fill(PALETA.blobA);
  circle(150, ALTURA - 80, 320);
  fill(PALETA.blobB);
  circle(LARGURA - 200, ALTURA - 120, 260);
}

// ---------------------------------------------------------------
// SETUP — roda UMA vez quando a página carrega.
// ---------------------------------------------------------------
function setup() {
  const canvas = createCanvas(LARGURA, ALTURA);
  canvas.parent('canvas-wrap');
  frameRate(60); // game loop a 60 FPS

  // Cores do rastro (criadas aqui porque precisam do p5 carregado)
  PALETA.rastroA = color(0, 229, 160);   // menta
  PALETA.rastroB = color(124, 77, 255);  // violeta

  reiniciarJogo();
}

// ---------------------------------------------------------------
// DRAW — o GAME LOOP. O p5.js chama esta função ~60 vezes por
// segundo. Ordem: atualizar mundo -> cérebro -> colisões -> desenhar.
// ---------------------------------------------------------------
function draw() {
  desenharCenario();

  // O jogo só começa de verdade depois que o aluno fecha a tela
  // de instruções (com um clique) — o cronômetro não corre antes.
  if (!primeiroFrame && !fimDeJogo && !vitoria) {
    frameAtual++;
    tempoSobrevivido = frameAtual / 60;

    // 1) O mundo se atualiza (a sombra persegue o mouse)
    sombra.atualizar();

    // 2) A comida pode nascer ou já pode existir na tela
    talvezCriarComida();

    // 3) CÉREBRO: sensores, sinapses, disparos e movimento da mosca
    atualizarCerebro();

    // 4) COLISÃO: sombra tocou a mosca? Fim de jogo (com explosão!)
    if (dist(sombra.x, sombra.y, mosca.x, mosca.y) < sombra.raio + 8) {
      fimDeJogo = true;
      explodirFaiscas(mosca.x, mosca.y, PALETA.perigo, 40);
    }

    // 5) VITÓRIA: sobreviveu aos 10 segundos? (com festa!)
    if (frameAtual >= FRAMES_PARA_VENCER) {
      vitoria = true;
      explodirFaiscas(mosca.x, mosca.y, [0, 229, 160], 60);
      explodirFaiscas(mosca.x, mosca.y, [255, 201, 60], 40);
    }
  }

  // 6) Desenha o mundo, a mosca e as camadas de interface
  if (comida) comida.desenhar();
  sombra.desenhar();
  mosca.desenhar();
  desenharFaiscas();
  desenharPainelNeuronios();
  desenharHUD();
}

// ---------------------------------------------------------------
// Reinicia todas as variáveis de estado do jogo.
// (Os PESOS das sinapses NÃO são resetados: assim o aluno pode
// testar melhorias sem perder suas edições a cada partida.)
// ---------------------------------------------------------------
function reiniciarJogo() {
  mosca = new Mosca();
  sombra.x = LARGURA / 2;
  sombra.y = ALTURA - 60;
  comida = null;
  frameAtual = 0;
  tempoSobrevivido = 0;
  fimDeJogo = false;
  vitoria = false;
  primeiroFrame = true;
  framesAteNovaComida = 180;
  faiscas = [];
  for (const n of neuronios) n.ativacao = 0; // cérebro "acorda" do zero
}

// Reinício com a tecla R (apenas no fim de jogo ou na vitória)
function keyReleased() {
  if ((fimDeJogo || vitoria) && (key === 'r' || key === 'R')) {
    reiniciarJogo();
  }
}

// Clique também tira a tela de instruções
function mousePressed() {
  primeiroFrame = false;
}

// ---------------------------------------------------------------
// HUD — instruções, placar e telas de início/fim/vitória.
// ---------------------------------------------------------------
function desenharHUD() {
  noStroke();

  // Barra de progresso estilizada no topo (pílula com degradê)
  const progresso = constrain(tempoSobrevivido / SEGUNDOS_PARA_VENCER, 0, 1);
  const px = LARGURA / 2 - 110;
  fill(30, 20, 55, 180);
  rect(px - 4, 34, 228, 24, 12);
  if (progresso > 0) {
    // degradê menta -> amarelo conforme se aproxima da vitória
    fill(lerpColor(color(0, 229, 160), color(255, 201, 60), progresso));
    rect(px, 38, 220 * progresso, 16, 8);
  }
  fill(255);
  textAlign(CENTER, TOP);
  textSize(13);
  textStyle(BOLD);
  text(tempoSobrevivido.toFixed(1) + 's / ' + SEGUNDOS_PARA_VENCER + 's',
       LARGURA / 2, 38);
  textStyle(NORMAL);

  // Dica rápida logo abaixo da barra
  textSize(12);
  fill(120, 100, 160);
  text('🖱️ Mova o mouse para controlar a sombra. Ajuste as sinapses para a mosca fugir!',
       LARGURA / 2, 64);

  // TELA DE INSTRUÇÕES (painel de boas-vindas)
  if (primeiroFrame && !fimDeJogo && !vitoria) {
    fill(18, 11, 46, 200);                    // véu escuro sobre o jogo
    rect(0, 0, LARGURA, ALTURA);

    // Cartão central em vidro com borda neon
    fill(30, 20, 60, 240);
    stroke(124, 77, 255);
    strokeWeight(2);
    rect(LARGURA / 2 - 300, ALTURA / 2 - 150, 600, 300, 24);
    noStroke();

    fill(255, 201, 60);
    textSize(40);
    text('🧠', LARGURA / 2, ALTURA / 2 - 130);
    fill(255);
    textSize(26);
    textStyle(BOLD);
    text('Bem-vindo ao laboratório de conectomas!', LARGURA / 2, ALTURA / 2 - 78);
    textStyle(NORMAL);

    textSize(16);
    fill(220, 205, 255);
    text('Esta mosca teve o cérebro "desligado": as sinapses estão sem peso.', LARGURA / 2, ALTURA / 2 - 34);
    text('Abra o código e ajuste os pesos na', LARGURA / 2, ALTURA / 2 + 0);
    text('ÁREA DE EDIÇÃO DO ALUNO para reacendê-las.', LARGURA / 2, ALTURA / 2 + 24);
    fill(0, 229, 160);
    text('Missão: sobreviver 10 segundos à sombra! 🏆', LARGURA / 2, ALTURA / 2 + 64);

    // Chamada para ação piscando
    fill(255, 255, 255, 150 + 100 * sin(frameCount * 0.1));
    textSize(14);
    text('(clique para começar)', LARGURA / 2, ALTURA / 2 + 110);
  }

  // FIM DE JOGO — tela vermelha vibrante
  if (fimDeJogo) {
    fill(60, 8, 20, 200);                     // véu vermelho-escuro
    rect(0, 0, LARGURA, ALTURA);

    fill(40, 10, 24, 240);
    stroke(255, 45, 85);
    strokeWeight(2);
    rect(LARGURA / 2 - 280, ALTURA / 2 - 120, 560, 240, 24);
    noStroke();

    fill(255, 90, 110);
    textSize(52);
    textStyle(BOLD);
    text('💀 FIM DE JOGO', LARGURA / 2, ALTURA / 2 - 84);
    textStyle(NORMAL);
    fill(255, 220, 225);
    textSize(18);
    text('A sombra alcançou a mosca! O cérebro dela não reagiu a tempo.', LARGURA / 2, ALTURA / 2 - 6);
    fill(255);
    textSize(15);
    text('Dica: aumente o peso Sensor de Sombra -> Neurônio de Fuga.', LARGURA / 2, ALTURA / 2 + 30);
    fill(255, 201, 60);
    textSize(16);
    textStyle(BOLD);
    text('⌨️ Pressione R para reiniciar', LARGURA / 2, ALTURA / 2 + 72);
    textStyle(NORMAL);
  }

  // VITÓRIA — tela verde-festa
  if (vitoria) {
    fill(6, 45, 35, 200);                     // véu verde-escuro
    rect(0, 0, LARGURA, ALTURA);

    fill(12, 40, 34, 240);
    stroke(0, 229, 160);
    strokeWeight(2);
    rect(LARGURA / 2 - 300, ALTURA / 2 - 120, 600, 240, 24);
    noStroke();

    fill(120, 255, 200);
    textSize(46);
    textStyle(BOLD);
    text('🎉 SOBREVIVEU!', LARGURA / 2, ALTURA / 2 - 80);
    textStyle(NORMAL);
    fill(230, 255, 245);
    textSize(18);
    text('A mosca desviou da sombra por 10 segundos. Seu conectoma funciona!', LARGURA / 2, ALTURA / 2 - 4);
    fill(255, 201, 60);
    textSize(15);
    text('Desafio extra: acenda o circuito da comida e crie PRIORIDADE! 🍎', LARGURA / 2, ALTURA / 2 + 32);
    fill(255);
    textSize(16);
    textStyle(BOLD);
    text('⌨️ Pressione R para reiniciar', LARGURA / 2, ALTURA / 2 + 74);
    textStyle(NORMAL);
  }
}

// ---------------------------------------------------------------
// Painel lateral: mostra a ativação de cada neurônio em BARRAS
// coloridas dentro de um cartão de vidro escuro. Cada neurônio
// tem sua COR própria e ganha faíscas quando dispara.
// ---------------------------------------------------------------
// Cor de cada neurônio (o motor procura pelo nome)
function corDoNeuronio(nome) {
  if (nome === 'Sensor de Sombra')  return [255, 93, 115];  // coral
  if (nome === 'Neurônio de Fuga')  return [255, 159, 67];  // laranja
  if (nome === 'Neurônio Motor')    return [0, 229, 160];   // menta
  if (nome === 'Sensor de Comida')  return [255, 201, 60];  // âmbar
  if (nome === 'Neurônio de Busca') return [77, 208, 255];  // azul
  return [200, 200, 200];
}

function desenharPainelNeuronios() {
  const x0 = LARGURA - 240;
  const y0 = 96;

  // Cartão de vidro escuro com borda suave
  noStroke();
  fill(PALETA.painel);
  rect(x0 - 14, y0 - 34, 240, 52 + neuronios.length * 44, 16);
  fill(255, 255, 255, 18);
  rect(x0 - 14, y0 - 34, 240, 6, 3);   // "brilho" no topo do cartão

  fill(200, 180, 255);
  textAlign(LEFT, TOP);
  textSize(13);
  textStyle(BOLD);
  text('⚡ Ativação dos neurônios', x0, y0 - 26);
  textStyle(NORMAL);

  // Uma barra por neurônio: cor própria; FLASH branco quando dispara
  neuronios.forEach(function(n, i) {
    const y = y0 + 8 + i * 44;
    const cor = corDoNeuronio(n.nome);

    // Nome do neurônio na cor dele
    fill(cor);
    textSize(12);
    textStyle(BOLD);
    text((n.disparou ? '⚡ ' : '   ') + n.nome, x0, y);
    textStyle(NORMAL);

    // Trilho da barra + preenchimento colorido
    fill(255, 255, 255, 30);
    rect(x0, y + 15, 200, 10, 5);
    const largura = map(constrain(n.ativacao, 0, n.limiar * 2), 0, n.limiar * 2, 0, 200);
    fill(cor[0], cor[1], cor[2], n.disparou ? 255 : 170);
    rect(x0, y + 15, largura, 10, 5);

    // Marcador do LIMIAR (linha branca: cruzou aqui = dispara!)
    const xLimiar = map(n.limiar, 0, n.limiar * 2, 0, 200);
    stroke(255, 255, 255, 120);
    strokeWeight(1);
    line(x0 + xLimiar, y + 13, x0 + xLimiar, y + 27);
    noStroke();

    // FAÍSCAS no momento do disparo (efeito "zap!")
    if (n.disparou && frameAtual % 6 === 0) {
      explodirFaiscas(x0 + 8 + xLimiar * 0.3, y + 20, cor, 2);
    }
  });
}
