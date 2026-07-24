// Variables de estado
let currentPage = 1;
let searchTerm = "";
let uploadedGalleryIds = []; // IDs de novas imagens enviadas na sessão
let existingGalleryIds = []; // IDs de imagens já existentes (usado na edição)

// Helper para escapar HTML
function esc(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Obter CSRF Token para requisições Django
function getCSRFToken() {
    const input = document.querySelector("[name=csrfmiddlewaretoken]");
    if (input) return input.value;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrftoken=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
}

// Carregar lista de projetos ao inicializar
document.addEventListener("DOMContentLoaded", function() {
    fetchProjects(1);
});

// Buscar projetos
function fetchProjects(page = 1) {
    currentPage = page;
    const url = `/api/projects/list/?page=${page}&limit=8&search=${encodeURIComponent(searchTerm)}`;
    
    const infoSpan = document.getElementById("pagination_info");
    if (infoSpan) infoSpan.textContent = "Buscando projetos...";

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Erro de rede");
            return res.json();
        })
        .then(data => {
            renderTable(data.results);
            renderPagination(data.pagination);
        })
        .catch(err => {
            console.error("Erro ao buscar projetos:", err);
            const tbody = document.getElementById("projects_table_body");
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-600 italic">Erro ao carregar dados. Tente novamente.</td></tr>`;
            }
        });
}

// Debounce para busca
let debounceTimeout;
function debouncedFetch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        searchTerm = document.getElementById("search_input").value;
        fetchProjects(1);
    }, 300);
}

// Renderizar tabela de projetos
function renderTable(projects) {
    const tbody = document.getElementById("projects_table_body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!projects || projects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500 italic">Nenhum projeto cadastrado.</td></tr>`;
        return;
    }

    const isEn = (document.documentElement.lang || "pt-br").startsWith("en");

    projects.forEach(p => {
        const title = (isEn && p.project_title_en) ? p.project_title_en : p.project_title;
        
        const row = document.createElement("tr");
        row.className = "border-b border-gray-200 hover:bg-gray-50 transition";
        row.innerHTML = `
            <td class="px-6 py-4 font-bold text-gray-900">${esc(title)}</td>
            <td class="px-6 py-4 font-mono text-gray-600">
                ${p.project_github_rep_link ? `<a href="${esc(p.project_github_rep_link)}" target="_blank" class="text-teal-700 hover:underline"><i class="fa-brands fa-github"></i> Ver repositório</a>` : "-"}
            </td>
            <td class="px-6 py-4 text-center text-gray-600">${esc(p.weight)}</td>
            <td class="px-6 py-4 text-gray-600">${esc(p.add_on.split(" ")[0])}</td>
            <td class="px-6 py-4 text-center">
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" ${p.is_active ? 'checked' : ''} onchange="toggleProjectActive(${p.id}, this.checked)">
                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-4">
                    <button onclick="deleteProject(${p.id})" class="text-red-600 hover:text-red-800 cursor-pointer transition" title="Excluir">
                        <i class="fa-solid fa-trash-can text-base"></i>
                    </button>
                    <button onclick="editProject(${p.id})" class="text-teal-700 hover:text-teal-900 cursor-pointer transition" title="Editar">
                        <i class="fa-solid fa-pen text-base"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Renderizar paginação
function renderPagination(pag) {
    const infoSpan = document.getElementById("pagination_info");
    const buttonsDiv = document.getElementById("pagination_buttons");
    if (!infoSpan || !buttonsDiv) return;

    if (!pag) {
        infoSpan.textContent = "";
        buttonsDiv.innerHTML = "";
        return;
    }

    const start = (pag.page - 1) * 8 + 1;
    const end = Math.min(pag.page * 8, pag.total);
    infoSpan.textContent = pag.total > 0 ? `Mostrando ${start} até ${end} de ${pag.total} resultados` : "Nenhum resultado";

    buttonsDiv.innerHTML = "";

    // Botão Anterior
    if (pag.has_previous) {
        buttonsDiv.innerHTML += `<button onclick="fetchProjects(${pag.page - 1})" class="px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-100 transition cursor-pointer"><i class="fa-solid fa-chevron-left"></i></button>`;
    } else {
        buttonsDiv.innerHTML += `<button disabled class="px-3 py-1 rounded bg-gray-100 border border-gray-300 text-gray-400 opacity-60"><i class="fa-solid fa-chevron-left"></i></button>`;
    }

    // Páginas numéricas
    for (let i = 1; i <= pag.pages; i++) {
        if (i === pag.page) {
            buttonsDiv.innerHTML += `<button class="px-3 py-1 rounded bg-teal-700 text-white font-bold">${i}</button>`;
        } else {
            buttonsDiv.innerHTML += `<button onclick="fetchProjects(${i})" class="px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-100 transition cursor-pointer">${i}</button>`;
        }
    }

    // Botão Próximo
    if (pag.has_next) {
        buttonsDiv.innerHTML += `<button onclick="fetchProjects(${pag.page + 1})" class="px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-100 transition cursor-pointer"><i class="fa-solid fa-chevron-right"></i></button>`;
    } else {
        buttonsDiv.innerHTML += `<button disabled class="px-3 py-1 rounded bg-gray-100 border border-gray-300 text-gray-400 opacity-60"><i class="fa-solid fa-chevron-right"></i></button>`;
    }
}

// Modal: abrir para criação
function openModal() {
    document.getElementById("modal_title").textContent = "Novo Projeto";
    document.getElementById("project_id").value = "";
    
    // Limpar campos de texto
    document.getElementById("project_title").value = "";
    document.getElementById("project_title_en").value = "";
    document.getElementById("project_github_rep_link").value = "";
    document.getElementById("project_description").value = "";
    document.getElementById("project_description_en").value = "";
    document.getElementById("project_tags").value = "";
    document.getElementById("project_resorce_title").value = "";
    document.getElementById("project_resorce_title_en").value = "";
    document.getElementById("project_resorce_list").value = "";
    document.getElementById("project_resorce_list_en").value = "";
    document.getElementById("project_resorce_tags").value = "";
    document.getElementById("project_resorce_tags_en").value = "";
    document.getElementById("project_note").value = "";
    document.getElementById("project_note_en").value = "";
    document.getElementById("project_weight").value = "0";
    
    // Limpar inputs de file e previews
    document.getElementById("project_icon").value = null;
    document.getElementById("project_gallery_input").value = null;
    document.getElementById("icon_preview_container").innerHTML = `<i class="fa-solid fa-image text-gray-300 text-3xl"></i>`;
    document.getElementById("gallery_preview_container").innerHTML = `<span class="text-xs text-gray-400 italic">Nenhuma imagem selecionada.</span>`;
    
    // Limpar tópicos
    document.getElementById("topics_container").innerHTML = "";
    uploadedGalleryIds = [];
    existingGalleryIds = [];

    // Exibir modal
    const modal = document.getElementById("modal_new_project");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
}

// Modal: fechar
function closeModal() {
    const modal = document.getElementById("modal_new_project");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
}

// Preview do ícone selecionado
function previewIcon(e) {
    const file = e.target.files[0];
    const preview = document.getElementById("icon_preview_container");
    if (!file) {
        preview.innerHTML = `<i class="fa-solid fa-image text-gray-300 text-3xl"></i>`;
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        preview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
    };
    reader.readAsDataURL(file);
}

// Preview da galeria selecionada
function previewGallery(e) {
    const files = e.target.files;
    const preview = document.getElementById("gallery_preview_container");
    preview.innerHTML = "";
    
    if (files.length === 0) {
        preview.innerHTML = `<span class="text-xs text-gray-400 italic">Nenhuma imagem selecionada.</span>`;
        return;
    }

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        const div = document.createElement("div");
        div.className = "w-14 h-14 border border-gray-300 rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative";
        
        reader.onload = function(event) {
            div.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
        };
        reader.readAsDataURL(file);
        preview.appendChild(div);
    });
}

// Adicionar campo de tópico dinâmico
function addTopicInput(title = "", bullets = "", topicId = "", titleEn = "", bulletsEn = "") {
    const container = document.getElementById("topics_container");
    const div = document.createElement("div");
    div.className = "topic-entry border border-gray-300 rounded-xl p-4 bg-gray-50 flex flex-col gap-3 relative";
    div.setAttribute("data-id", topicId);
    
    div.innerHTML = `
        <button type="button" onclick="removeTopicInput(this)" class="absolute top-3 right-3 text-red-500 hover:text-red-700 cursor-pointer">
            <i class="fa-solid fa-trash"></i>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
                <label class="font-bold text-xs text-gray-600">Título do Tópico</label>
                <input type="text" class="topic-title-input bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none" placeholder="Ex: Virtualização com KVM" value="${esc(title)}">
            </div>
            <div class="flex flex-col gap-1">
                <label class="font-bold text-xs text-gray-600">Título do Tópico (EN)</label>
                <input type="text" class="topic-title-en-input bg-white border border-gray-300 rounded px-3 py-1.5 focus:outline-none" placeholder="Ex: KVM Virtualization" value="${esc(titleEn)}">
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
                <label class="font-bold text-xs text-gray-600">Pontos/Balas (Um por linha)</label>
                <textarea rows="2" class="topic-bullets-input bg-white border border-gray-300 rounded px-3 py-1.5 resize-none focus:outline-none" placeholder="Suporte a VMs de alta performance&#10;Armazenamento ZFS">${esc(bullets)}</textarea>
            </div>
            <div class="flex flex-col gap-1">
                <label class="font-bold text-xs text-gray-600">Pontos/Balas (EN) (Um por linha)</label>
                <textarea rows="2" class="topic-bullets-en-input bg-white border border-gray-300 rounded px-3 py-1.5 resize-none focus:outline-none" placeholder="Support for high performance VMs&#10;ZFS storage">${esc(bulletsEn)}</textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

// Remover tópico dinâmico
function removeTopicInput(button) {
    const entry = button.closest(".topic-entry");
    const topicId = entry.getAttribute("data-id");
    
    if (topicId) {
        // Se já existe no banco, podemos enviar requisição para apagar
        if (confirm("Deseja apagar esse tópico do banco de dados permanentemente?")) {
            fetch(`/api/topics/${topicId}/delete/`, {
                method: "DELETE",
                headers: { "X-CSRFToken": getCSRFToken() }
            })
            .then(res => {
                if (res.ok) {
                    entry.remove();
                    showToast("Tópico excluído com sucesso!", "success");
                } else {
                    showToast("Erro ao deletar tópico.", "error");
                }
            })
            .catch(err => console.error(err));
        }
    } else {
        entry.remove();
    }
}

// Editar Projeto: carregar dados no formulário
function editProject(id) {
    openModal();
    document.getElementById("modal_title").textContent = "Editar Projeto";
    document.getElementById("project_id").value = id;

    fetch(`/api/project/details/${id}/`)
        .then(res => {
            if (!res.ok) throw new Error("Erro ao carregar detalhes");
            return res.json();
        })
        .then(p => {
            document.getElementById("project_title").value = p.project_title || "";
            document.getElementById("project_title_en").value = p.project_title_en || "";
            document.getElementById("project_github_rep_link").value = p.project_github_rep_link || "";
            document.getElementById("project_description").value = p.project_description || "";
            document.getElementById("project_description_en").value = p.project_description_en || "";
            document.getElementById("project_tags").value = p.project_tags ? p.project_tags.join(", ") : "";
            document.getElementById("project_resorce_title").value = p.project_resorce_title || "";
            document.getElementById("project_resorce_title_en").value = p.project_resorce_title_en || "";
            document.getElementById("project_resorce_list").value = p.project_resorce_list ? p.project_resorce_list.join("\n") : "";
            document.getElementById("project_resorce_list_en").value = p.project_resorce_list_en ? p.project_resorce_list_en.join("\n") : "";
            document.getElementById("project_resorce_tags").value = p.project_resorce_tags ? p.project_resorce_tags.join("\n") : "";
            document.getElementById("project_resorce_tags_en").value = p.project_resorce_tags_en ? p.project_resorce_tags_en.join("\n") : "";
            document.getElementById("project_note").value = p.project_note || "";
            document.getElementById("project_note_en").value = p.project_note_en || "";
            document.getElementById("project_weight").value = p.weight || "0";

            // Preview do ícone
            if (p.project_icon) {
                document.getElementById("icon_preview_container").innerHTML = `<img src="${p.project_icon}" class="w-full h-full object-cover">`;
            }

            // Previews da galeria e guardar IDs existentes
            const galleryPreview = document.getElementById("gallery_preview_container");
            galleryPreview.innerHTML = "";
            existingGalleryIds = [];
            
            if (p.project_gallery && p.project_gallery.length > 0) {
                p.project_gallery.forEach(imgObj => {
                    existingGalleryIds.push(imgObj.id);
                    const div = document.createElement("div");
                    div.className = "w-14 h-14 border border-gray-300 rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative";
                    div.innerHTML = `
                        <img src="${imgObj.img}" class="w-full h-full object-cover">
                        <button type="button" onclick="removeGalleryImage(this, ${imgObj.id})" class="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition text-[10px] font-bold">
                            Apagar
                        </button>
                    `;
                    galleryPreview.appendChild(div);
                });
            } else {
                galleryPreview.innerHTML = `<span class="text-xs text-gray-400 italic">Nenhuma imagem cadastrada.</span>`;
            }

            // Carregar tópicos
            const topicsContainer = document.getElementById("topics_container");
            topicsContainer.innerHTML = "";
            if (p.project_topics && p.project_topics.length > 0) {
                p.project_topics.forEach(t => {
                    addTopicInput(t.topics_title, t.topics.join("\n"), t.id, t.topics_title_en, t.topics_en ? t.topics_en.join("\n") : "");
                });
            }
        })
        .catch(err => {
            console.error(err);
            showToast("Não foi possível carregar os detalhes do projeto.", "error");
            closeModal();
        });
}

// Remover imagem individual da galeria na edição
function removeGalleryImage(button, imgId) {
    if (confirm("Remover esta imagem da galeria?")) {
        fetch(`/api/gallery/${imgId}/delete/`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getCSRFToken() }
        })
        .then(res => {
            if (res.ok) {
                existingGalleryIds = existingGalleryIds.filter(id => id !== imgId);
                button.closest("div").remove();
                if (existingGalleryIds.length === 0) {
                    document.getElementById("gallery_preview_container").innerHTML = `<span class="text-xs text-gray-400 italic">Nenhuma imagem cadastrada.</span>`;
                }
                showToast("Imagem removida com sucesso!", "success");
            } else {
                showToast("Erro ao remover imagem.", "error");
            }
        })
        .catch(err => console.error(err));
    }
}

// Excluir Projeto
function deleteProject(id) {
    if (confirm("Tem certeza que deseja excluir permanentemente este projeto?")) {
        fetch(`/api/projects/${id}/delete/`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getCSRFToken() }
        })
        .then(res => {
            if (res.ok) {
                fetchProjects(currentPage);
                showToast("Projeto excluído com sucesso!", "success");
            } else {
                showToast("Erro ao deletar projeto.", "error");
            }
        })
        .catch(err => console.error(err));
    }
}

// Salvar Projeto (Criar ou Atualizar)
async function saveProject() {
    const btn = document.getElementById("save_project_btn");
    const oldText = btn.innerHTML;
    
    // Obter dados básicos
    const id = document.getElementById("project_id").value;
    const title = document.getElementById("project_title").value.trim();
    const description = document.getElementById("project_description").value.trim();

    if (!title || !description) {
        showToast("Título e Descrição são campos obrigatórios.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    try {
        const csrfToken = getCSRFToken();

        // ── 1. Salvar os Tópicos Dinâmicos ─────────────────────────
        const topicIds = [];
        const topicEntries = document.querySelectorAll(".topic-entry");
        
        for (const entry of topicEntries) {
            const topicId = entry.getAttribute("data-id");
            const tTitle = entry.querySelector(".topic-title-input").value.trim();
            const tTitleEn = entry.querySelector(".topic-title-en-input").value.trim();
            const tBulletsRaw = entry.querySelector(".topic-bullets-input").value.trim();
            const tBullets = tBulletsRaw.split("\n").map(b => b.trim()).filter(b => b.length > 0);
            const tBulletsEnRaw = entry.querySelector(".topic-bullets-en-input").value.trim();
            const tBulletsEn = tBulletsEnRaw.split("\n").map(b => b.trim()).filter(b => b.length > 0);

            if (!tTitle || tBullets.length === 0) continue;

            const payload = { 
                topics_title: tTitle,
                topics_title_en: tTitleEn,
                topics: tBullets,
                topics_en: tBulletsEn
            };
            
            if (topicId) {
                // Atualiza tópico
                const res = await fetch(`/api/topics/${topicId}/update/`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) topicIds.push(parseInt(topicId));
            } else {
                // Cria tópico
                const res = await fetch("/topics/create/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfToken
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    topicIds.push(data.id);
                }
            }
        }

        // ── 2. Fazer upload de novas imagens da Galeria ────────────
        const galleryInput = document.getElementById("project_gallery_input");
        const newGalleryIds = [];
        
        if (galleryInput.files.length > 0) {
            for (const file of galleryInput.files) {
                const formImg = new FormData();
                formImg.append("img", file);
                
                const res = await fetch("/gallery/create/", {
                    method: "POST",
                    headers: { "X-CSRFToken": csrfToken },
                    body: formImg
                });
                if (res.ok) {
                    const data = await res.json();
                    newGalleryIds.push(data.id);
                }
            }
        }

        // Unir galeria antiga com as novas imagens
        const totalGalleryIds = [...existingGalleryIds, ...newGalleryIds];

        // ── 3. Compilar e Salvar o Projeto ──────────────────────────
        const formProj = new FormData();
        formProj.append("project_title", title);
        formProj.append("project_title_en", document.getElementById("project_title_en").value.trim());
        formProj.append("project_description", description);
        formProj.append("project_description_en", document.getElementById("project_description_en").value.trim());
        formProj.append("project_github_rep_link", document.getElementById("project_github_rep_link").value.trim());
        formProj.append("project_tags", document.getElementById("project_tags").value.trim());
        formProj.append("project_resorce_title", document.getElementById("project_resorce_title").value.trim());
        formProj.append("project_resorce_title_en", document.getElementById("project_resorce_title_en").value.trim());
        formProj.append("project_resorce_list", document.getElementById("project_resorce_list").value);
        formProj.append("project_resorce_list_en", document.getElementById("project_resorce_list_en").value);
        formProj.append("project_resorce_tags", document.getElementById("project_resorce_tags").value);
        formProj.append("project_resorce_tags_en", document.getElementById("project_resorce_tags_en").value);
        formProj.append("project_note", document.getElementById("project_note").value.trim());
        formProj.append("project_note_en", document.getElementById("project_note_en").value.trim());
        formProj.append("weight", document.getElementById("project_weight").value.trim() || "0");
        
        // Relacionamentos JSON arrays
        formProj.append("project_topics", JSON.stringify(topicIds));
        formProj.append("project_gallery", JSON.stringify(totalGalleryIds));

        // Adicionar ícone de capa se selecionado
        const iconInput = document.getElementById("project_icon");
        if (iconInput.files.length > 0) {
            formProj.append("project_icon", iconInput.files[0]);
        }

        let resProj;
        if (id) {
            // Edição
            resProj = await fetch(`/api/projects/${id}/update/`, {
                method: "POST", // Usando POST com FormData
                headers: { "X-CSRFToken": csrfToken },
                body: formProj
            });
        } else {
            // Criação
            resProj = await fetch("/projects/create", {
                method: "POST",
                headers: { "X-CSRFToken": csrfToken },
                body: formProj
            });
        }

        if (resProj.ok) {
            closeModal();
            fetchProjects(id ? currentPage : 1);
            showToast(id ? "Projeto atualizado com sucesso!" : "Projeto adicionado com sucesso!", "success");
        } else {
            const errData = await resProj.json();
            showToast("Erro ao salvar projeto: " + (errData.error || "Desconhecido"), "error");
        }

    } catch (err) {
        console.error(err);
        showToast("Erro crítico no envio do formulário.", "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
    }
}

// Ativar/Desativar Projeto diretamente da lista
function toggleProjectActive(id, isActive) {
    const csrfToken = getCSRFToken();
    fetch(`/api/projects/${id}/update/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({ is_active: isActive })
    })
    .then(res => {
        if (res.ok) {
            showToast(isActive ? "Projeto ativado com sucesso!" : "Projeto desativado com sucesso!", "success");
        } else {
            showToast("Erro ao alterar status do projeto.", "error");
            fetchProjects(currentPage); // Reverte o switch na interface
        }
    })
    .catch(err => {
        console.error("Erro ao alterar status:", err);
        showToast("Erro de rede ao alterar status do projeto.", "error");
        fetchProjects(currentPage); // Reverte o switch na interface
    });
}
