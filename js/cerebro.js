/* ================================================================
   PARTE 2 — CÉREBRO DA MOSCA (ÁREA DE EDIÇÃO DO ALUNO)
   Aqui vive o "conectoma": a lista de neurônios e de sinapses.
   Este é o ÚNICO arquivo que o aluno precisa editar!
   ================================================================ */

// ---------------------------------------------------------------
// LISTA DE NEURÔNIOS
// Cada neurônio é um OBJETO com estas propriedades:
//   nome            -> texto que identifica o neurônio
//   ativacao        -> número que acumula estímulos (começa em 0)
//   limiar          -> se a ativação passar desse valor, ele DISPARA
//   taxaDeVazamento -> multiplicador de decaimento por frame
//                      (ex.: 0.9 = perde 10% da ativação por frame)
//   disparou        -> controlado pelo motor (true no frame do disparo)
// ---------------------------------------------------------------
const neuronios = [
  { nome: 'Sensor de Sombra',  ativacao: 0, limiar: 0.5, taxaDeVazamento: 0.80, disparou: false },
  { nome: 'Neurônio de Fuga',  ativacao: 0, limiar: 1.0, taxaDeVazamento: 0.90, disparou: false },
  { nome: 'Neurônio Motor',    ativacao: 0, limiar: 1.0, taxaDeVazamento: 0.95, disparou: false },
  // Desafio final: circuito da comida (começa "dormente")
  { nome: 'Sensor de Comida',  ativacao: 0, limiar: 0.5, taxaDeVazamento: 0.80, disparou: false },
  { nome: 'Neurônio de Busca', ativacao: 0, limiar: 1.0, taxaDeVazamento: 0.90, disparou: false }
];

// ---------------------------------------------------------------
// LISTA DE SINAPSES
// Cada sinapse é um OBJETO com:
//   origem  -> nome do neurônio que ENVIA o sinal
//   destino -> nome do neurônio que RECEBE o sinal
//   peso    -> ★ O NÚMERO QUE O ALUNO VAI EDITAR! ★
//              peso > 0  = excita (facilita o disparo do destino)
//              peso < 0  = inibe  (dificulta o disparo do destino)
//              peso = 0  = sinapse "cortada" (cérebro quebrado!)
// ---------------------------------------------------------------
const sinapses = [

  // >>> CIRCUITO DE FUGA (conserte estes pesos!) <<<
  { origem: 'Sensor de Sombra', destino: 'Neurônio de Fuga', peso: 0.0 },  // <-- EDITE AQUI
  { origem: 'Neurônio de Fuga', destino: 'Neurônio Motor',   peso: 0.0 },  // <-- EDITE AQUI

  // >>> CIRCUITO DE BUSCA POR COMIDA (desafio final) <<<
  { origem: 'Sensor de Comida',  destino: 'Neurônio de Busca', peso: 0.0 }, // <-- EDITE AQUI (desafio)
  { origem: 'Neurônio de Busca', destino: 'Neurônio Motor',    peso: 0.0 }, // <-- EDITE AQUI (desafio)

  // >>> PRIORIDADE: quando a mosca FUGE, o circuito de comida
  //     deve ser INIBIDO (peso negativo). Perigo vem primeiro! <<<
  { origem: 'Neurônio de Fuga', destino: 'Neurônio de Busca', peso: 0.0 }   // <-- EDITE AQUI (desafio)
];

// --- ÁREA DE EDIÇÃO DO ALUNO: Ajuste os pesos das sinapses aqui ---
//
//  MISSÃO: troque os pesos 0.0 acima para consertar o cérebro
//  e fazer a mosca SOBREVIVER 10 segundos à sombra!
//
//  ROTEIRO SUGERIDO:
//   1. 'Sensor de Sombra' -> 'Neurônio de Fuga':  0.0 vira 1.0
//   2. 'Neurônio de Fuga' -> 'Neurônio Motor':    0.0 vira 1.0
//   3. Rodou? A mosca agora sente o perigo e foge!
//
//  EXPERIMENTOS EXTRAS:
//   - Pesos maiores (ex.: 1.5) = reação mais forte/rápida.
//   - Pesos pequenos demais (ex.: 0.3) = mosca lenta, "sonolenta".
//   - Peso NEGATIVO inibe: tente inibir um circuito com -2.0.
//   - Você também pode ajustar 'limiar' e 'taxaDeVazamento'
//     na lista de neurônios e comparar o comportamento!
// -------------------------------------------------------------------

// ----- Constantes sensoriais e motoras (do motor do cérebro) -----
const DISTANCIA_PERIGO = 170; // distância sombra-mosca em que o sensor sente o predador
const DISTANCIA_COMIDA = 220; // distância mosca-maçã em que o sensor sente a comida
const VELOCIDADE_FUGA  = 3.2; // velocidade da mosca fugindo
const VELOCIDADE_BUSCA = 2.2; // velocidade da mosca buscando comida

// ---------------------------------------------------------------
// PASSO 1 do cérebro: os SENSORES sentem o mundo e ganham estímulo.
// ---------------------------------------------------------------
function sentirMundo() {
  const sensorSombra = neuronios.find(function(n) { return n.nome === 'Sensor de Sombra'; });
  const sensorComida = neuronios.find(function(n) { return n.nome === 'Sensor de Comida'; });

  // Quanto mais perto a sombra, mais forte o estímulo no sensor
  if (sombra) {
    const d = dist(sombra.x, sombra.y, mosca.x, mosca.y);
    if (d < DISTANCIA_PERIGO) {
      sensorSombra.ativacao += 1.0;
    }
  }

  // Se existe comida por perto, o sensor de comida sente
  if (comida) {
    const d = dist(comida.x, comida.y, mosca.x, mosca.y);
    if (d < DISTANCIA_COMIDA) {
      sensorComida.ativacao += 1.0;
    }
  }
}

// ---------------------------------------------------------------
// PASSO 2 do cérebro: verifica quais neurônios atingiram o limiar.
// Se ativacao >= limiar -> o neurônio DISPARA neste frame.
// ---------------------------------------------------------------
function detectarDisparos() {
  for (const n of neuronios) {
    n.disparou = n.ativacao >= n.limiar;
  }
}

// ---------------------------------------------------------------
// PASSO 3 do cérebro: propaga ativação pelas SINAPSES.
// Para cada sinapse cuja origem disparou, soma o PESO na
// ativação do neurônio de destino.
//   peso positivo -> excita | peso negativo -> inibe
// ---------------------------------------------------------------
function propagarSinapses() {
  for (const s of sinapses) {
    const origem  = neuronios.find(function(n) { return n.nome === s.origem; });
    const destino = neuronios.find(function(n) { return n.nome === s.destino; });
    if (origem && destino && origem.disparou) {
      destino.ativacao += s.peso; // <-- aqui o peso do aluno faz efeito!
    }
  }
}

// ---------------------------------------------------------------
// PASSO 4 do cérebro: VAZAMENTO. A ativação "esfria" a cada frame
// (multiplicação por taxaDeVazamento), impedindo excitação infinita.
// ---------------------------------------------------------------
function aplicarVazamento() {
  for (const n of neuronios) {
    n.ativacao = n.ativacao * n.taxaDeVazamento;
  }
}

// ---------------------------------------------------------------
// PASSO 5 do cérebro: AÇÃO. Se o Neurônio Motor disparou, a mosca
// se move na direção OPOSTA à sombra. Se o Neurônio de Busca
// disparou (e a fuga não estiver vencendo), ela vai até a comida.
// ---------------------------------------------------------------
function agir() {
  const motor = neuronios.find(function(n) { return n.nome === 'Neurônio Motor'; });
  const fuga  = neuronios.find(function(n) { return n.nome === 'Neurônio de Fuga';  });
  const busca = neuronios.find(function(n) { return n.nome === 'Neurônio de Busca'; });

  // Só existe movimento se o NEURÔNIO MOTOR disparou.
  // Ele recebe ativação de DOIS circuitos (convergência sináptica):
  // Fuga -> Motor e Busca -> Motor.
  if (motor && motor.disparou) {

    // PRIORIDADE 1 — FUGA: se o Neurônio de Fuga disparou neste
    // frame, a mosca corre na direção OPOSTA à sombra
    // (o vetor da sombra para a mosca aponta para longe do perigo).
    if (fuga && fuga.disparou) {
      mosca.angulo = atan2(mosca.y - sombra.y, mosca.x - sombra.x);
      mosca.mover(mosca.angulo, VELOCIDADE_FUGA);
    }

    // PRIORIDADE 2 — BUSCA (desafio): sem perigo por perto, se o
    // Neurônio de Busca disparou, a mosca anda em direção à comida.
    else if (busca && busca.disparou && comida) {
      mosca.angulo = atan2(comida.y - mosca.y, comida.x - mosca.x);
      mosca.mover(mosca.angulo, VELOCIDADE_BUSCA);

      // A mosca comeu a maçã? Uma nova nascerá em ~2 segundos.
      if (dist(mosca.x, mosca.y, comida.x, comida.y) < 22) {
        explodirFaiscas(comida.x, comida.y, [255, 201, 60], 25); // festa!
        comida = null;
        framesAteNovaComida = 120;
      }
    }
  }
}

// ---------------------------------------------------------------
// atualizarCerebro: roda 1 "tick" completo do cérebro por frame,
// na ordem certa: sentir -> disparar -> propagar -> agir -> vazar.
// ---------------------------------------------------------------
function atualizarCerebro() {
  sentirMundo();
  detectarDisparos();
  propagarSinapses();
  agir();
  aplicarVazamento();
}

/* ================================================================
   DESAFIO ADICIONAL (para casa): PRIORIDADE COMPORTAMENTAL
   ================================================================
   A maçã (brilhante e pulsante) nasce em posições aleatórias.

   1. Acenda o circuito da comida:
        { origem: 'Sensor de Comida',  destino: 'Neurônio de Busca', peso: 1.0 },
        { origem: 'Neurônio de Busca', destino: 'Neurônio Motor',    peso: 1.0 }

   2. Crie PRIORIDADE: quando a mosca precisa FUGIR, o circuito
      de busca deve ser INIBIDO. Troque o peso da última sinapse:
        { origem: 'Neurônio de Fuga', destino: 'Neurônio de Busca', peso: -3.0 }
      Agora, enquanto o Neurônio de Fuga dispara, ele desativa a
      busca: fugir do perigo sempre vence buscar comida.

   CONCEITO DE NEUROCIÊNCIA: é assim que cérebros reais resolvem
   conflitos entre comportamentos — inibindo circuitos rivais.
   Experimente também inibir o inverso (Busca -> Fuga) e observe
   a mosca "brigar" entre comer e fugir!

   OUTRAS IDEIAS:
   - Adicione um 'Sensor de Borda' que dispara quando a mosca
     chega perto das paredes (para ela não ficar presa no canto).
   - Crie um 'Neurônio de Pânico' com limiar alto que só dispara
     quando a sombra está MUITO perto, dando um turbo de velocidade.
   ================================================================ */
