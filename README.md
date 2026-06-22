# Jornada Educacional 🚀
> Seu companheiro inteligente de estudos potencializado por Inteligência Artificial (Google Gemini).

A **Jornada Educacional** é uma aplicação mobile completa (desenvolvida em React Native/Expo e Django/PostgreSQL no backend) projetada para revolucionar o ciclo de aprendizado ativo. Por meio da captação de resumos em texto e gravações de voz, o aplicativo utiliza modelos de Inteligência Artificial para transcrever áudio, otimizar anotações, fornecer feedback pedagógico estruturado e gerar quizzes de memorização dinamicamente.

---

## 📱 Telas Úteis da Aplicação (10 Telas)

A aplicação conta com **10 telas principais**, totalmente integradas e desenhadas sob um padrão visual moderno e premium (tema roxo e indigo):

1. **Entrar na Jornada (`LoginScreen.js`)**: Tela de acesso elegante com design em cartão, campos de e-mail e senha com toggle de visibilidade do olho, loaders de carregamento e integração de sessão com persistência via `AsyncStorage`.
2. **Criar Nova Conta (`RegisterScreen.js`)**: Registro intuitivo de novos usuários na base de dados com feedback em tempo real e tratamento de erros integrado.
3. **Início/Painel (`DashboardScreen.js`)**: O coração do app. Mostra as saudações dinâmicas personalizadas com o nome do usuário logado, o resumo estudado mais recente real, contagem dinâmica dos temas por trilha de estudo e acessos rápidos aos recursos de criação de resumo e simulados.
4. **Criar Anotação (`CreateSummaryScreen.js`)**: Editor flexível contendo:
   - Seletor visual de trilha (`Desenvolvimento Web`, `Ciência de Dados`, `Inglês`, `Estruturas de Dados`, `Outros`).
   - Gravador de voz em tempo real usando a biblioteca `expo-av` com sinalizador pulsar de gravação ativa e temporizador. O áudio é transcrito automaticamente pela IA do Gemini.
   - Recurso "Aprimorar com Gemini" que melhora o texto bruto do aluno formatando-o didaticamente.
   - Opção para anexar e visualizar fotos integradas a câmera do celular.
5. **Anotações (`SummariesListScreen.js`)**: Lista organizada de todos os resumos do usuário com opção de exclusão. Permite filtrar resumos por trilhas específicas a partir do Dashboard e contém chip visual para limpar filtros ativos.
6. **Leitura/Detalhes (`SummaryDetailScreen.js`)**: Apresentação de anotações salvas (incluindo imagens). Dispõe do painel exclusivo do **Tutor de IA**: se já analisado, exibe os pontos fortes e próximos passos de estudo; se não, permite solicitar a análise pedagógica em tempo real.
7. **Tutor de IA (`AISuggestionsScreen.js`)**: Visualizador focado em tela cheia do feedback pedagógico e próximos tópicos recomendados de estudo.
8. **Quiz de Aprendizado Ativo (`ActiveRecallQuizScreen.js`)**: Simulados interativos com perguntas e respostas de múltipla escolha geradas em tempo real com base nas anotações do próprio usuário. Mostra justificativas explicativas após a seleção de cada alternativa.
9. **Meu Perfil (`ProfileScreen.js`)**: Espaço do usuário exibindo avatar, e-mail, estatísticas em tempo real (totalizador de resumos criados puxados da API), opção de navegação para a tela de progresso e botão estilizado de Logout.
10. **Estatísticas & Progresso (`StudentStatsScreen.js`)**: Painel de desempenho acadêmico exibindo metas semanais de resumos (barra de progresso), sequência ativa de dias estudados (streak), distribuição de temas criados e conquistas desbloqueadas dinamicamente (medalhas de engajamento).

---

## 🛠️ Arquitetura e Recursos de Inteligência Artificial

A aplicação está integrada com a API do **Google Gemini** no backend Django por meio das seguintes capacidades:
* **Melhoria Didática**: Otimização de anotações confusas, formatando o texto de forma clara em listas e tópicos acadêmicos.
* **Gerador de Quizzes**: Converte o conteúdo do resumo do aluno em um objeto estruturado JSON de perguntas, respostas corretas e explicações pedagógicas.
* **Tutor Acadêmico**: Análise cognitiva das anotações fornecendo feedback construtivo e gerando uma lista dinâmica de temas recomendados para aprofundar os estudos.
* **Transcritor Multimodal**: Processa dados de áudio bruto (gravação do celular) de formatos variados (M4A, CAF, WAV, etc.) convertendo-os diretamente em texto limpo em português.

---

## ⚙️ Pré-requisitos
Certifique-se de possuir em seu ambiente:
- **Node.js** (versão 18 ou superior)
- **Docker & Docker Desktop** (recomendado para banco e backend)
- **Expo Go** instalado em seu dispositivo móvel Android/iOS

---

## 🚀 Como Executar

O projeto é dividido em duas partes principais: `/backend` e `/mobile`.

### 1. Configurando e Executando o Backend (com Docker)

1. Entre no diretório `/backend`:
   ```bash
   cd backend
   ```
2. Crie um arquivo `.env` baseado no `.env.exemple` e insira sua chave do Gemini em `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=sua_chave_do_google_ai_studio
   ```
3. Inicie os containers do banco de dados PostgreSQL e do Django:
   ```bash
   docker compose up -d
   ```
4. Gere e aplique as migrações iniciais do banco de dados dentro do container:
   ```bash
   docker exec backend-web-1 python manage.py makemigrations
   docker exec backend-web-1 python manage.py migrate
   ```

### 2. Configurando e Executando o Mobile (React Native / Expo)

1. Abra um segundo terminal e entre no diretório `/mobile`:
   ```bash
   cd mobile
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o endereço IP correto do seu computador no arquivo de serviços em `src/services/api.js`:
   ```javascript
   const API_URL = 'http://192.168.0.XXX:8000/api/'; // Substitua pelo seu IPv4 local
   ```
4. Inicie o servidor do Expo:
   ```bash
   npx expo start --clear
   ```
5. Abra o aplicativo **Expo Go** em seu celular e escaneie o código QR exibido no terminal para carregar a aplicação.
