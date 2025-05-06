// Função para carregar e parsear o .env
async function loadEnvConfig() {
    try {
        const response = await fetch('/.env');
        if (!response.ok) {
            throw new Error('Não foi possível carregar o arquivo .env');
        }
        const text = await response.text();
        const config = {};
        text.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split('=').map(part => part.trim());
                if (key && value) {
                    config[key] = value;
                }
            }
        });
        return config;
    } catch (error) {
        console.error('Erro ao carregar .env:', error);
        showErrorMessage('objetivos', 'Não foi possível carregar as configurações.');
        return {};
    }
}

// Constantes de configuração locais
const LOCAL_CONFIG = {
    featuredProjectCount: 3,
    animationDelay: 100,
    cacheTTL: 1000 * 60 * 60, // Cache de 1 hora
};

// Cache de dados
let cachedData = {
    curriculoInfo: null,
    githubProjects: null,
};

// Estado da interface
const uiState = {
    intersectionObserver: null,
    projectsLoaded: false,
    curriculoLoaded: false,
};

// Função principal que inicializa tudo
document.addEventListener('DOMContentLoaded', async () => {
    // Carregar configurações do .env
    const envConfig = await loadEnvConfig();
    const APP_CONFIG = { ...envConfig, ...LOCAL_CONFIG };

    // Atualizar imagens de perfil
    updateProfileImages(APP_CONFIG.PROFILE_IMAGE_URL || 'https://avatars.githubusercontent.com/u/165790519?v=4');

    setupThemeDetection();
    setupIntersectionObserver();
    setupScrollHandler();
    setupProfileImageClick();
    initializeProfileImage();
    setupSavePDFButton();

    try {
        // Verificar cache local
        const cachedCurriculo = loadFromLocalStorage('curriculoInfo');
        const cachedProjects = loadFromLocalStorage('githubProjects');

        if (cachedCurriculo) {
            cachedData.curriculoInfo = cachedCurriculo;
            uiState.curriculoLoaded = true;
            updateCurriculoUI(cachedCurriculo);
        }

        if (cachedProjects) {
            cachedData.githubProjects = cachedProjects;
            uiState.projectsLoaded = true;
            renderFeaturedProjects(cachedProjects);
            renderScrollingProjects(cachedProjects);
        }

        // Carregar dados em paralelo
        const curriculoPromise = cachedCurriculo ? Promise.resolve(cachedCurriculo) : fetchGistData();
        const githubPromise = cachedProjects ? Promise.resolve(cachedProjects) : fetchGitHubProjects();

        // Aguardar o carregamento dos dados do currículo
        await curriculoPromise;

        // Esperar os projetos carregarem
        githubPromise.catch(error => {
            console.error('Erro ao carregar projetos:', error);
            showErrorMessage('projetos', 'Não foi possível carregar os projetos do GitHub.');
        });
    } catch (error) {
        console.error('Erro ao inicializar a página:', error);
    }

    // Funções que dependem de APP_CONFIG
    async function fetchGistData() {
        try {
            const response = await fetch(`https://api.github.com/gists/${APP_CONFIG.GIST_ID}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            const gist = await response.json();
            if (!gist.files['curriculo.json']) {
                throw new Error('Arquivo curriculo.json não encontrado no Gist');
            }

            const data = JSON.parse(gist.files['curriculo.json'].content);
            cachedData.curriculoInfo = data;
            uiState.curriculoLoaded = true;
            saveToLocalStorage('curriculoInfo', data);
            updateCurriculoUI(data);

            return data;
        } catch (error) {
            console.error('Erro ao carregar Gist:', error);
            showErrorMessage('objetivos', 'Não foi possível carregar as informações do currículo.');
            throw error;
        }
    }

    async function fetchGitHubProjects() {
        try {
            const response = await fetch(`https://api.github.com/users/${APP_CONFIG.GITHUB_USERNAME}/repos?sort=created&direction=desc&per_page=100`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }

            const repos = await response.json();
            cachedData.githubProjects = repos;
            uiState.projectsLoaded = true;
            saveToLocalStorage('githubProjects', repos);
            renderFeaturedProjects(repos);
            renderScrollingProjects(repos);

            return repos;
        } catch (error) {
            console.error('Erro ao carregar repositórios:', error);
            showErrorMessage('projetos', 'Não foi possível carregar os projetos do GitHub.');
            throw error;
        }
    }
});

// Atualizar imagens de perfil
function updateProfileImages(url) {
    const profileImage = document.querySelector('.profile-image');
    const fixedProfileImage = document.querySelector('.fixed-profile-image');
    if (profileImage) profileImage.src = url;
    if (fixedProfileImage) fixedProfileImage.src = url;
}

// Configurar botão de salvar PDF
function setupSavePDFButton() {
    const saveButton = document.getElementById('save-pdf-button');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const element = document.querySelector('.container');
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: 'curriculo_reinaldo_coelho.pdf',
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    windowWidth: element.scrollWidth,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: {
                    unit: 'in',
                    format: 'a4',
                    orientation: 'portrait',
                    putOnlyUsedFonts: true,
                    floatPrecision: 16
                },
                pagebreak: {
                    mode: ['css', 'legacy'],
                    avoid: ['.section', '.project-card', '.timeline-item']
                }
            };
            html2pdf().set(opt).from(element).save();
        });
    }
}

// Configurar manipulador de rolagem
function setupScrollHandler() {
    const fixedHeader = document.querySelector('.fixed-header');
    const header = document.querySelector('header');
    const placeholder = document.querySelector('.header-placeholder');

    window.addEventListener('scroll', () => {
        const headerBottom = header.getBoundingClientRect().bottom;
        const headerStyles = window.getComputedStyle(header);
        const headerHeight = header.offsetHeight +
                            parseFloat(headerStyles.marginTop) +
                            parseFloat(headerStyles.marginBottom);

        if (headerBottom <= 0) {
            fixedHeader.classList.add('visible');
            placeholder.style.height = `${headerHeight}px`;
        } else {
            fixedHeader.classList.remove('visible');
            placeholder.style.height = '0';
        }
    });
}

// Configurar clique na imagem de perfil
function setupProfileImageClick() {
    const profileImage = document.querySelector('.profile-image');
    const fixedProfileImage = document.querySelector('.fixed-profile-image');

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (profileImage) {
        profileImage.addEventListener('click', scrollToTop);
    }

    if (fixedProfileImage) {
        fixedProfileImage.addEventListener('click', scrollToTop);
    }
}

// Observador de interseção
function setupIntersectionObserver() {
    uiState.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                uiState.intersectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.section').forEach(section => {
        uiState.intersectionObserver.observe(section);
    });
}

// Inicializar imagem de perfil
function initializeProfileImage() {
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        const initials = profileImage.getAttribute('data-initials') || 'JD';
        profileImage.setAttribute('data-initials', initials);
    }
}

// Detectar tema
function setupThemeDetection() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
        document.body.classList.add('dark-mode');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        document.body.classList.toggle('dark-mode', event.matches);
    });
}

// Exibir mensagem de erro
function showErrorMessage(sectionId, message) {
    const section = document.getElementById(sectionId);
    if (section) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <svg viewBox="0 0 24 24" class="error-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>${message}</p>
        `;
        section.appendChild(errorElement);
    }
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Formatar data relativa
function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'hoje';
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    const years = Math.floor(diffDays / 365);
    return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

// Carregar do localStorage
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return null;
        const { value, timestamp } = JSON.parse(data);
        if (Date.now() - timestamp > LOCAL_CONFIG.cacheTTL) {
            localStorage.removeItem(key);
            return null;
        }
        return value;
    } catch (error) {
        console.error(`Erro ao carregar ${key} do localStorage:`, error);
        return null;
    }
}

// Salvar no localStorage
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify({
            value,
            timestamp: Date.now(),
        }));
    } catch (error) {
        console.error(`Erro ao salvar ${key} no localStorage:`, error);
    }
}

// Atualizar interface do currículo
function updateCurriculoUI(data) {
    const updateText = (id, text) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    };

    const updateHTML = (id, html) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = html;
    };

    document.title = `Currículo - ${data.nome}`;
    updateText('nome-header', data.nome);
    updateText('fixed-nome-header', data.nome);
    updateText('nome-footer', data.nome);

    const nameParts = data.nome.split(' ');
    let initials = nameParts[0][0];
    if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1][0];
    }
    const profileImage = document.getElementById('profileImage');
    if (profileImage) profileImage.setAttribute('data-initials', initials.toUpperCase());

    updateHTML('email', `<a href="mailto:${data.contato.email}">${data.contato.email}</a>`);
    updateHTML('github', `<a href="${data.contato.github}" target="_blank">${data.contato.github.split('/').pop()}</a>`);
    updateHTML('telefone', `<a href="tel:${data.contato.telefone.replace(/\D/g, '')}">${data.contato.telefone}</a>`);

    updateText('objetivos-text', data.objetivos);

    const formacaoList = document.getElementById('formacao-list');
    if (formacaoList) {
        formacaoList.innerHTML = '';
        data.formacao.forEach((item, index) => {
            setTimeout(() => {
                const element = document.createElement('div');
                element.className = 'timeline-item';
                element.innerHTML = `
                    <div class="timeline-header">
                        <h3 class="timeline-title">${item.curso}</h3>
                        <span class="timeline-period">${item.periodo}</span>
                    </div>
                    <p class="timeline-subtitle">${item.instituicao}</p>
                `;
                formacaoList.appendChild(element);
            }, index * LOCAL_CONFIG.animationDelay);
        });
    }

    const experienciasList = document.getElementById('experiencias-list');
    if (experienciasList) {
        experienciasList.innerHTML = '';
        data.experiencias.forEach((item, index) => {
            setTimeout(() => {
                const element = document.createElement('div');
                element.className = 'timeline-item';
                element.innerHTML = `
                    <div class="timeline-header">
                        <h3 class="timeline-title">${item.cargo}</h3>
                        <span class="timeline-period">${item.periodo}</span>
                    </div>
                    <p class="timeline-subtitle">${item.empresa}</p>
                    <div class="timeline-content">${item.descricao}</div>
                `;
                experienciasList.appendChild(element);
            }, index * LOCAL_CONFIG.animationDelay);
        });
    }
}

// Cores por linguagem
function getLanguageColor(language) {
    const colorMap = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Python': '#3572A5',
        'Java': '#b07219',
        'C#': '#178600',
        'C++': '#f34b7d',
        'PHP': '#4F5D95',
        'Ruby': '#701516',
        'Go': '#00ADD8',
        'Swift': '#ffac45',
        'Kotlin': '#A97BFF',
        'Rust': '#dea584',
        'Dart': '#00B4AB',
    };
    return colorMap[language] || '#6b7280';
}

// Renderizar projetos em destaque
function renderFeaturedProjects(repos) {
    const featuredContainer = document.getElementById('featured-projects');
    if (!featuredContainer) return;

    featuredContainer.innerHTML = '';

    const featuredRepos = repos.slice(0, LOCAL_CONFIG.featuredProjectCount);

    featuredRepos.forEach((repo, index) => {
        setTimeout(() => {
            const card = document.createElement('div');
            card.className = 'project-card';

            const description = repo.description || 'Sem descrição disponível';
            const language = repo.language || 'Desconhecido';
            const languageColor = getLanguageColor(language);
            const hasHomepage = repo.homepage && repo.homepage !== '';
            const projectNameHTML = hasHomepage
                ? `<a href="${repo.homepage}" target="_blank">${repo.name} <span class="link-icon">🔗</span></a>`
                : `${repo.name}`;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-header">
                        <h3>${projectNameHTML}</h3>
                        <p class="creation-date">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                                <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm1-6.5c0 .28-.22.5-.5.5H5c-.28 0-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5h3V3.5c0-.28.22-.5.5-.5s.5.22.5.5v3c0 .28-.22.5-.5.5h-1v1z"></path>
                            </svg>
                            ${formatRelativeDate(repo.created_at)}
                        </p>
                    </div>
                    <div class="card-body">
                        <p class="card-description">${description}</p>
                        <div class="card-actions">
                            <a href="${repo.html_url}" target="_blank" class="card-button">
                                <svg viewBox="0 0 16 16" width="16" height="16" preserveAspectRatio="xMidYMid meet">
                                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-.62 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                </svg>
                                Ver Repositório
                            </a>
                            <span class="language-badge" style="background-color: ${languageColor}">${language}</span>
                        </div>
                    </div>
                </div>
            `;
            featuredContainer.appendChild(card);
        }, index * LOCAL_CONFIG.animationDelay);
    });
}

// Renderizar projetos com rolagem
function renderScrollingProjects(repos) {
    const projectTrack = document.getElementById('github-projects-track');
    if (!projectTrack) return;

    projectTrack.innerHTML = '';

    const scrollingRepos = repos.slice(LOCAL_CONFIG.featuredProjectCount);

    const cardWidth = 320;
    const minVisibleCards = Math.ceil(window.innerWidth / cardWidth) + 2;
    const duplicates = Math.max(2, Math.ceil(minVisibleCards / scrollingRepos.length));

    for (let i = 0; i < duplicates; i++) {
        scrollingRepos.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'project-card';

            const description = repo.description || 'Sem descrição';
            const language = repo.language || 'Desconhecido';
            const languageColor = getLanguageColor(language);
            const hasHomepage = repo.homepage && repo.homepage !== '';
            const projectNameHTML = hasHomepage
                ? `<a href="${repo.homepage}" target="_blank">${repo.name} <span class="link-icon">🔗</span></a>`
                : `${repo.name}`;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-header">
                        <h3>${projectNameHTML}</h3>
                        <p class="creation-date">
                            <svg viewBox="0 0 16 16" width="16" height="16">
                                <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm1-6.5c0 .28-.22.5-.5.5H5c-.28 0-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5h3V3.5c0-.28.22-.5.5-.5s.5.22.5.5v3c0 .28-.22.5-.5.5h-1v1z"></path>
                            </svg>
                            ${formatRelativeDate(repo.created_at)}
                        </p>
                    </div>
                    <div class="card-body">
                        <div class="card-actions">
                            <a href="${repo.html_url}" target="_blank" class="card-button">
                                <svg viewBox="0 0 16 16" width="16" height="16" preserveAspectRatio="xMidYMid meet">
                                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-.62 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                </svg>
                                Ver Repositório
                            </a>
                            <span class="language-badge" style="background-color: ${languageColor}">${language}</span>
                        </div>
                    </div>
                </div>
            `;
            projectTrack.appendChild(card);
        });
    }
}