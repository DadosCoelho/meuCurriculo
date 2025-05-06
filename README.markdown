# Currículo Dinâmico

Este é um projeto de currículo web dinâmico que exibe informações pessoais, formação, experiências e projetos de um desenvolvedor, puxando dados de um Gist do GitHub e da API de repositórios do GitHub. O currículo é responsivo, suporta temas claro/escuro, e permite salvar o conteúdo como PDF.

## Funcionalidades

- **Informações Dinâmicas**: Dados do currículo (nome, contato, formação, experiências) são carregados de um arquivo `curriculo.json` hospedado em um Gist do GitHub.
- **Projetos do GitHub**: Exibe repositórios do GitHub em seções de destaque e carrossel, com links para sites (se disponíveis, indicados por um ícone de corrente 🔗) ou repositórios.
- **Tema Responsivo**: Suporta modo claro e escuro com base nas preferências do sistema do usuário.
- **Exportação para PDF**: Permite salvar o currículo como PDF usando a biblioteca `html2pdf.js`.
- **Animações**: Efeitos de transição para seções e projetos, usando Intersection Observer.
- **Cache Local**: Armazena dados em `localStorage` para reduzir chamadas à API.

## Estrutura do Projeto

```
├── index.html        # Página principal do currículo
├── styles.css        # Estilos da interface
├── script.js         # Lógica principal (carregamento de dados, renderização)
├── config.js         # Configurações sensíveis (gistId, githubUsername)
└── .gitignore        # Ignora arquivos sensíveis e temporários
```

### Arquivos Principais

- **`index.html`**: Contém a estrutura HTML do currículo, incluindo referências a `config.js` e `script.js`.
- **`styles.css`**: Define o layout, temas e animações.
- **`script.js`**: Gerencia o carregamento de dados do Gist e repositórios, renderização de projetos, e funcionalidades como salvar PDF.
- **`config.js`**: Armazena chaves sensíveis (`gistId` e `githubUsername`). **Não versionado** (ignorado pelo `.gitignore`).
- **`.gitignore`**: Protege `config.js` e outros arquivos sensíveis (ex.: `node_modules`, `.env`).

## Estrutura do Gist

O currículo carrega dados de um arquivo `curriculo.json` hospedado em um Gist do GitHub, identificado pelo `gistId` em `config.js`. O arquivo JSON deve seguir a estrutura abaixo:

```json
{
  "nome": "Seu Nome Completo",
  "contato": {
    "email": "seu.email@exemplo.com",
    "github": "https://github.com/seu-usuario",
    "telefone": "+55 (11) 99999-9999"
  },
  "objetivos": "Descrição dos seus objetivos profissionais.",
  "formacao": [
    {
      "curso": "Nome do Curso",
      "instituicao": "Nome da Instituição",
      "periodo": "MM/AAAA - MM/AAAA"
    }
    // ... mais formações
  ],
  "experiencias": [
    {
      "cargo": "Cargo Ocupado",
      "empresa": "Nome da Empresa",
      "periodo": "MM/AAAA - MM/AAAA",
      "descricao": "Descrição das responsabilidades e conquistas."
    }
    // ... mais experiências
  ]
}
```

### Explicação dos Campos

- **`nome`**: Seu nome completo, exibido no cabeçalho e rodapé.
- **`contato`**: Objeto com:
  - `email`: Endereço de e-mail, exibido como link clicável.
  - `github`: URL do perfil do GitHub, exibido como link.
  - `telefone`: Número de telefone, exibido como link clicável.
- **`objetivos`**: Texto descrevendo seus objetivos profissionais.
- **`formacao`**: Array de objetos, cada um com:
  - `curso`: Nome do curso (ex.: "Ciência da Computação").
  - `instituicao`: Nome da instituição (ex.: "Universidade XYZ").
  - `periodo`: Período do curso (ex.: "01/2018 - 12/2022").
- **`experiencias`**: Array de objetos, cada um com:
  - `cargo`: Cargo ocupado (ex.: "Desenvolvedor Frontend").
  - `empresa`: Nome da empresa (ex.: "Empresa ABC").
  - `periodo`: Período de trabalho (ex.: "06/2020 - Presente").
  - `descricao`: Descrição detalhada das responsabilidades.

### Como Criar o Gist

1. Acesse [gist.github.com](https://gist.github.com/).
2. Crie um novo Gist com um arquivo chamado `curriculo.json`.
3. Cole o JSON com a estrutura acima, preenchendo com seus dados.
4. Torne o Gist público (ou secreto, se preferir, mas garanta que a API possa acessá-lo).
5. Copie o ID do Gist (ex.: `1848e354f2c127682042a4ec9b611b5b`) e adicione-o ao `config.js`.

## Configuração

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Safari, etc.).
- Conexão com a internet para carregar dados da API do GitHub.
- Servidor local (recomendado) para evitar problemas de CORS ao testar localmente (ex.: `npx http-server`).

### Passos para Executar

1. **Clone o Repositório**:
   ```bash
   git clone https://github.com/DadosCoelho/seu-repositorio.git
   cd seu-repositorio
   ```

2. **Crie o Arquivo `config.js`**:
   - Crie um arquivo `config.js` na raiz do projeto com o seguinte conteúdo:
     ```javascript
     window.CONFIG = {
         gistId: 'SEU_GIST_ID',
         githubUsername: 'SEU_GITHUB_USERNAME'
     };
     ```
   - Substitua `SEU_GIST_ID` pelo ID do Gist que contém o arquivo `curriculo.json`.
   - Substitua `SEU_GITHUB_USERNAME` pelo seu nome de usuário do GitHub.
   - **Nota**: Este arquivo é ignorado pelo `.gitignore` para proteger suas chaves.

3. **Verifique o `index.html`**:
   - Certifique-se de que `index.html` inclui os scripts na ordem correta:
     ```html
     <script src="config.js"></script>
     <script src="script.js"></script>
     ```
   - Os scripts devem estar no `<head>` ou no final do `<body>`.

4. **Execute o Projeto**:
   - Inicie um servidor local:
     ```bash
     npx http-server
     ```
   - Acesse `http://localhost:8080` no navegador.
   - Alternativamente, abra `index.html` diretamente, mas isso pode causar problemas de CORS.

5. **Teste as Funcionalidades**:
   - Verifique se os dados do Gist e repositórios são carregados.
   - Teste o botão de salvar PDF.
   - Confirme que os links de projetos com `homepage` mostram o ícone de corrente (`🔗`).

## Segurança

- **Chaves Sensíveis**: O `gistId` e `githubUsername` são armazenados em `config.js`, que é ignorado pelo `.gitignore` para evitar exposição no repositório Git.
- **Limitações**: Como o projeto é estático, `config.js` é acessível no navegador em um site público. Para maior segurança, considere:
  - Usar um token de acesso pessoal do GitHub com permissões restritas.
  - Configurar um backend ou proxy para chamadas à API.
  - Hospedar o Gist em um repositório privado.
- **Cache Seguro**: Dados armazenados no `localStorage` têm um TTL de 1 hora e não incluem informações sensíveis.

## Personalização

- **Estilização**: Edite `styles.css` para ajustar cores, fontes ou animações.
- **Configurações**: Modifique `script.js` para alterar o número de projetos em destaque (`featuredProjectCount`) ou o atraso das animações (`animationDelay`).
- **Dados do Currículo**: Atualize o arquivo `curriculo.json` no Gist para refletir suas informações pessoais, formação e experiências.

## Dependências

- **html2pdf.js**: Usado para gerar PDFs do currículo. Incluído via CDN.
- **API do GitHub**: Usada para carregar dados do Gist e repositórios.

## Contribuição

1. Faça um fork do repositório.
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b minha-feature
   ```
3. Commite suas alterações:
   ```bash
   git commit -m "Adiciona minha feature"
   ```
4. Envie para o repositório remoto:
   ```bash
   git push origin minha-feature
   ```
5. Abra um Pull Request.

## Licença

[MIT License](LICENSE) - Sinta-se à vontade para usar, modificar e distribuir este projeto.

## Contato

- **GitHub**: [DadosCoelho](https://github.com/DadosCoelho)
- **Email**: Disponível no currículo renderizado.