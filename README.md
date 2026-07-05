# 💻 Portfólio Hacker & Painel Administrativo

Este é um projeto de **Portfólio Pessoal Interativo** com temática retro/hacker, desenvolvido em **Django 6** e **Tailwind CSS**. Além da interface pública altamente estilizada, o projeto conta com um **Painel de Controle Administrativo customizado**, sistema de **análise de acessos (Analytics)** em tempo real e até mesmo um **emulador clássico de Doom (1993)** jogável no navegador como Easter Egg.

---

## 🚀 Principais Funcionalidades

### 🌐 Site Público (Front-end)
*   **Design Retro & Premium:** Estilização com estética dark, tons de verde-esmeralda/teal, cantos arredondados imitando janelas de sistema operacional, e fundo animado com partículas flutuantes (`tsParticles`).
*   **Multilíngue Completo (i18n):** Suporte total a **Português (PT-BR)** e **Inglês (EN)**. A troca de idioma traduz dinamicamente as interfaces e exibe os campos traduzidos no banco de dados.
*   **Ajuste Fino da Foto de Perfil:** Renderização com posicionamento (X/Y) e zoom definidos diretamente pelo banco de dados por meio de transformações CSS.
*   **Busca e Filtro Dinâmico de Projetos:** Pesquisa instantânea por nome ou tecnologias utilizadas, além de filtros rápidos por categorias de tags.
*   **Linha do Tempo Interativa:** Histórico profissional e educacional organizado em formato de terminal (arquivos de log `.log`) com expansão animada no hover.
*   **Easter Egg DOOM:** Um fliperama virtual que emula o clássico *DOOM (1993)* diretamente na página usando `JS-DOS`.

### 🛡️ Painel Administrativo Customizado (`/panel/admin/`)
*   **Dashboard Estatístico:** Exibe contagens gerais de projetos, experiências, colaboradores e formações.
*   **Analytics Integrado:** Monitora o tráfego do site por meio de um gráfico de acessos diários dos últimos 7 dias, lista de principais visitantes (IPs) e log em tempo real com informações de User Agent.
*   **Configuração de Perfil:** Formulário dedicado para atualizar informações básicas, biografia, redes sociais e gerenciar o upload, zoom e deslocamento espacial da foto de perfil.
*   **Gerenciador de Projetos & Portfólio:** CRUD completo para criação e edição de projetos com carregamento dinâmico de tópicos, recursos e galeria de imagens.
*   **Gestão de Linha do Tempo e Colaboradores:** Controle simplificado de formações/certificados, experiências profissionais anteriores e cadastro de pessoas parceiras.

---

## 🛠️ Tecnologias Utilizadas

### Back-end
*   **Python 3.11+**
*   **Django 6.0.3** (Framework Web robusto com controle de sessões e autenticação)
*   **PostgreSQL / SQLite** (Configuração pronta para Postgres com fallback para SQLite local)
*   **Pillow** (Processamento e manipulação de uploads de imagem)
*   **Python-Markdown** (Renderização dinâmica de textos em formato markdown salvos no banco de dados)

### Front-end
*   **Tailwind CSS v4** (Design moderno, flexível e responsivo)
*   **FontAwesome Icons** (Biblioteca de ícones vetoriais)
*   **tsParticles** (Partículas animadas em JavaScript no plano de fundo)
*   **JS-DOS** (Emulação do DOS no navegador usando WebAssembly)

---

## 📂 Estrutura do Projeto

```text
├── MainApp/                 # App principal do Django contendo lógica de negócios
│   ├── migrations/          # Histórico de alterações do banco de dados
│   ├── templatetags/        # Filtros customizados do Django (ex: renderizador de markdown)
│   ├── middleware.py        # Middleware de rastreamento de acessos (Analytics)
│   ├── models.py            # Modelos de dados (Perfil, Projeto, Formação, Logs, etc.)
│   ├── views.py             # Lógica das views públicas e da API do Painel Admin
│   └── urls.py              # Definição das rotas da aplicação
├── project/                 # Diretório de configurações do projeto Django
│   ├── settings.py          # Configurações de banco, caminhos, segurança e i18n
│   └── urls.py              # Rotas globais e arquivos de mídia
├── static/                  # Arquivos estáticos (JavaScript, CSS, favicon)
├── templates/               # Arquivos HTML estruturados em Jinja/Django templates
│   ├── admin/               # Telas do Painel Administrativo customizado
│   ├── base.html            # Estrutura base comum
│   ├── index.html           # Página inicial pública
│   └── doom.html            # Página de easter egg do Doom
├── locale/                  # Arquivos de tradução (.po e .mo)
├── manage.py                # Script utilitário do Django
├── requirements.txt         # Dependências do Python
└── openapi.yaml             # Especificação Open API (Swagger) para documentação da API
```

---

## 💻 Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/felipegomes12/Portifolio.git
cd Portifolio
```

### 2. Configurar o Ambiente Virtual (venv)
```bash
python -m venv venv
# No Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# No Linux/Mac:
source venv/bin/activate
```

### 3. Instalar Dependências
```bash
pip install -r requirements.txt
```

### 4. Configurar as Variáveis de Ambiente (`.env`)
Para rodar este projeto, você deve criar um arquivo `.env` na raiz do projeto. Ele é ignorado pelo Git (configurado no `.gitignore`) para proteger suas credenciais sensíveis.

Crie um arquivo chamado `.env` e adicione as seguintes chaves com os valores correspondentes ao seu ambiente:

```env
# Configurações do Django
DJANGO_SECRET_KEY="sua_chave_secreta_aqui"
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS="127.0.0.1, localhost, portfolio.fegds-domain.pro"
DJANGO_CSRF_TRUSTED_ORIGINS="http://192.168.1.246:8080, https://portfolio.fegds-domain.pro, http://127.0.0.1:8080"

# Configurações do Banco de Dados
DB_ENGINE="django.db.backends.sqlite3"  # ou django.db.backends.postgresql
DB_NAME="db.sqlite3"                     # nome do banco SQLite ou do PostgreSQL

# Se utilizar PostgreSQL (DB_ENGINE="django.db.backends.postgresql"), configure também:
# DB_USER="seu_usuario"
# DB_PASSWORD="sua_senha"
# DB_HOST="192.168.1.237"
# DB_PORT="5432"
```

#### 🔑 Como gerar uma nova `SECRET_KEY` do Django:
Você pode gerar uma nova chave segura de forma automática executando o seguinte comando no terminal (com o ambiente virtual ativado):
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Copie a saída gerada e cole no campo `DJANGO_SECRET_KEY` dentro do seu `.env`.

### 5. Executar as Migrações
```bash
python manage.py migrate
```

### 6. Criar um Superusuário (Acesso ao Painel Admin)
```bash
python manage.py createsuperuser
```

### 7. Iniciar o Servidor de Desenvolvimento
```bash
python manage.py runserver
```
Agora você pode acessar a aplicação em seu navegador através do endereço [http://127.0.0.1:8000](http://127.0.0.1:8000).

O painel administrativo personalizado pode ser acessado em [http://127.0.0.1:8000/panel/admin/](http://127.0.0.1:8000/panel/admin/).
