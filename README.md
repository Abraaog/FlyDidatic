# 🧠 FlyDidatic — Conectoma de Mosca

Simulador didático em **p5.js** para ensinar neurociência e pensamento
computacional no ensino médio: os alunos "consertam o cérebro quebrado"
de uma mosca virtual editando os **pesos das sinapses** de um modelo de
neurônios *leaky integrate-and-fire* (integra-e-dispara-com-vazamento).

> 🪰 Inspirado no conectoma real da *Drosophila melanogaster*.

## 🚀 Como rodar

O projeto usa **módulos JavaScript separados**, então precisa de um
servidor local (abrir o `index.html` direto do disco não funciona bem).

```bash
npm install   # baixa o servidor local (uma vez só)
npm start     # sobe o servidor em http://localhost:3000
```

Depois é só abrir **http://localhost:3000** no navegador.

> Alternativa sem npm: `npx serve .` ou a extensão *Live Server* do VS Code.

## 📁 Estrutura (sem arquivos-monstro!)

```
flydidatic/
├── index.html      # estrutura da página + ordem de carregamento
├── css/
│   └── estilo.css  # tema visual "laboratório neon"
├── js/
│   ├── motor.js    # PARTE 1: motor do jogo (aluno NÃO edita)
│   └── cerebro.js  # PARTE 2: conectoma (ÁREA DE EDIÇÃO DO ALUNO ⚡)
├── package.json    # script "npm start" (servidor local)
└── README.md
```

| Arquivo | Papel | Aluno edita? |
|---|---|---|
| `index.html` | Estrutura da página | ❌ |
| `css/estilo.css` | Cores, fontes e layout | Opcional (criativo!) |
| `js/motor.js` | Gráficos, sombra, colisões, HUD | ❌ |
| `js/cerebro.js` | **Neurônios e sinapses** | ✅ **É aqui!** |

## 🎮 Como funciona

1. **Você é o predador**: a sombra escura segue seu mouse e fica
   vermelha perto da mosca.
2. **A mosca está "paralisada"**: todas as sinapses começam com
   `peso: 0.0` (cérebro desconectado).
3. **Missão**: editar `js/cerebro.js` para que a mosca sobreviva
   **10 segundos** fugindo da sombra.

### O cérebro (modelo LIF simplificado)

A cada frame (60 FPS):

```
sentir -> disparar -> propagar -> agir -> vazar
```

- **Sensores** ganham ativação quando a sombra (ou a comida) está perto
- Se `ativacao >= limiar`, o neurônio **DISPARA** ⚡
- Cada sinapse cuja origem disparou soma seu **peso** na ativação do
  destino (peso > 0 excita; peso < 0 inibe)
- Toda ativação **vaza** (`*= taxaDeVazamento`) — o cérebro esfria
- Se o **Neurônio Motor** dispara, a mosca foge na direção oposta à sombra

## 🏆 Desafio extra (para casa)

Acenda o circuito da comida 🍎 e implemente **prioridade comportamental**
(sinapse inibitória `Fuga -> Busca`): perigo vence fome — exatamente como
cérebros reais resolvem conflitos entre circuitos rivais.

## 🎓 Sugestão de roteiro de aula

1. Rodar o jogo: a mosca fica parada e é capturada (motivação!)
2. Abrir `js/cerebro.js` e ligar as duas sinapses de fuga
3. Observar o painel lateral: ver os neurônios disparando em tempo real
4. Experimentar: pesos maiores/menores, limiares, taxas de vazamento
5. Desafio da comida + inibição (prioridade comportamental)
