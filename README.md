# LETRIS - Tetris com Palavras em Português

Um jogo inovador que combina a mecânica clássica do Tetris com formação de palavras em português. As peças caem com letras aleatórias e o objetivo é formar palavras válidas para eliminá-las.

## 🎮 Como Jogar

- **Objetivo**: Forme palavras válidas em português para eliminar as peças do tabuleiro
- **Movimento**: Use WASD ou setas para mover e rotacionar as peças
- **Soltar**: Pressione ESPAÇO para soltar a peça rapidamente
- **Pausar**: Pressione P para pausar o jogo
- **Palavras**: Forme palavras com mínimo de 3 letras em qualquer direção (horizontal, vertical, diagonal)

## 🌟 Características

- **Sistema de Níveis Progressivo**: Comece com palavras simples e progrida para mais complexas
- **Letras Inteligentes**: Apenas letras que podem formar palavras válidas aparecem em cada nível
- **Visualização de Ajuda**: Veja todas as palavras válidas e letras disponíveis
- **Detecção Multidirecional**: Palavras são detectadas em todas as direções
- **Efeito Gravidade**: Após remover palavras, as peças caem naturalmente
- **Sistema de Pontuação**: Ganhe pontos baseados nas palavras formadas e nível atual

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passos para instalar

1. **Clone ou baixe os arquivos do projeto**

2. **Instale as dependências:**
```bash
npm install
```

3. **Execute o projeto em modo desenvolvimento:**
```bash
npm run dev
```

4. **Abra no navegador:**
Acesse `http://localhost:5173` para jogar

### Para fazer build de produção:
```bash
npm run build
npm run preview
```

## 📁 Estrutura do Projeto

```
letris-game/
├── public/
├── src/
│   └── main.tsx
├── components/
│   ├── LetrisGame.tsx      # Componente principal do jogo
│   ├── GameBoard.tsx       # Tabuleiro do jogo
│   ├── GameStats.tsx       # Estatísticas e controles
│   ├── TetrisPieces.tsx    # Lógica das peças
│   ├── WordDetector.tsx    # Detecção de palavras
│   ├── WordList.tsx        # Lista de palavras válidas
│   └── ui/                 # Componentes de interface
├── styles/
│   └── globals.css         # Estilos globais (Tailwind CSS)
├── App.tsx                 # Componente raiz
├── package.json
└── README.md
```

## 🎯 Níveis do Jogo

- **Nível 1**: 12 palavras básicas (SOL, LUA, MAR, etc.)
- **Nível 2**: Palavras do cotidiano (CASA, VIDA, ÁGUA, etc.)
- **Nível 3**: Palavras mais complexas (AMOR, TEMPO, MUNDO, etc.)
- **Nível 4**: Palavras com mais letras (CADEIRA, JANELA, etc.)
- **Nível 5**: Palavras avançadas (PEQUENO, SALGADO, etc.)
- **Nível 6**: Palavras complexas (DIFÍCIL, SEMPRE, etc.)

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **Vite** - Build tool e desenvolvimento
- **Radix UI** - Componentes acessíveis

## 🎮 Controles

| Tecla | Ação |
|-------|------|
| A / ← | Mover esquerda |
| D / → | Mover direita |
| S / ↓ | Acelerar queda |
| W / ↑ | Rotacionar |
| ESPAÇO | Soltar peça |
| P | Pausar/Continuar |

## 📝 Licença

MIT License - Veja o arquivo LICENSE para detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se livre para abrir issues ou enviar pull requests.

---

**Divirta-se jogando LETRIS!** 🎮🎯