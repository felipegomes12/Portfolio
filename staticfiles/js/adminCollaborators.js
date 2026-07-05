let allCollaborators = [];

// Helper para escapar HTML
function esc(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Obter CSRF Token
function getCSRFToken() {
    const input = document.querySelector("[name=csrfmiddlewaretoken]");
    if (input) return input.value;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrftoken=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
}

document.addEventListener("DOMContentLoaded", function() {
    fetchCollaborators();
});

// Listar Colaboradores
function fetchCollaborators() {
    const tbody = document.getElementById("collaborator_table_body");
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-gray-500 italic">Carregando colaboradores...</td></tr>`;

    fetch("/api/collaborators/list/")
        .then(res => res.json())
        .then(data => {
            allCollaborators = data.results || [];
            renderTable(allCollaborators);
        })
        .catch(err => {
            console.error("Erro:", err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-red-600 italic">Erro ao carregar colaboradores.</td></tr>`;
        });
}

function renderTable(list) {
    const tbody = document.getElementById("collaborator_table_body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-gray-500 italic">Nenhum colaborador cadastrado.</td></tr>`;
        return;
    }

    const isEn = (document.documentElement.lang || "pt-br").startsWith("en");

    list.forEach(c => {
        const name = c.name;
        const role = (isEn && c.role_en) ? c.role_en : c.role;
        
        // Render links column
        let linksHtml = `<div class="flex justify-center gap-3">`;
        if (c.github_link) {
            linksHtml += `<a href="${esc(c.github_link)}" target="_blank" class="text-gray-900 hover:text-teal-700" title="GitHub"><i class="fa-brands fa-github text-base"></i></a>`;
        }
        if (c.portfolio_link) {
            linksHtml += `<a href="${esc(c.portfolio_link)}" target="_blank" class="text-teal-700 hover:text-teal-900" title="Portfólio"><i class="fa-solid fa-globe text-base"></i></a>`;
        }
        if (!c.github_link && !c.portfolio_link) {
            linksHtml += `<span class="text-gray-400 italic text-[10px]">-</span>`;
        }
        linksHtml += `</div>`;

        // Render photo preview or icon placeholder
        let photoHtml = "";
        if (c.photo) {
            photoHtml = `<img src="${c.photo}" alt="${esc(name)}" class="w-8 h-8 rounded-full object-cover border border-teal-800 shadow-sm shrink-0">`;
        } else {
            photoHtml = `<div class="w-8 h-8 rounded-full bg-teal-950 border border-teal-800 flex items-center justify-center text-emerald-400 shrink-0"><i class="fa-solid fa-user-ninja text-xs"></i></div>`;
        }

        const row = document.createElement("tr");
        row.className = "border-b border-gray-200 hover:bg-gray-50 transition";
        row.innerHTML = `
            <td class="px-6 py-4 font-bold text-gray-900">
                <div class="flex items-center gap-3">
                    ${photoHtml}
                    <span>${esc(name)}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-600 font-semibold">${esc(role)}</td>
            <td class="px-6 py-4 text-center">${linksHtml}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-4">
                    <button onclick="deleteCollaborator(${c.id})" class="text-red-600 hover:text-red-800 cursor-pointer" title="Excluir">
                        <i class="fa-solid fa-trash-can text-base"></i>
                    </button>
                    <button onclick="editCollaborator(${c.id})" class="text-teal-700 hover:text-teal-900 cursor-pointer" title="Editar">
                        <i class="fa-solid fa-pen text-base"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Modal: abrir
function openModal() {
    document.getElementById("modal_title").textContent = "Novo Colaborador";
    document.getElementById("collab_id").value = "";
    document.getElementById("collab_name").value = "";
    document.getElementById("collab_role").value = "";
    document.getElementById("collab_role_en").value = "";
    document.getElementById("collab_bio").value = "";
    document.getElementById("collab_bio_en").value = "";
    document.getElementById("collab_portfolio").value = "";
    document.getElementById("collab_github").value = "";
    document.getElementById("collab_photo").value = null;
    document.getElementById("photo_preview").innerHTML = `<i class="fa-solid fa-user-ninja text-gray-300 text-2xl"></i>`;

    // Remove any existing clear flag input and remove photo button
    let existingFlag = document.getElementById("clear_photo_flag");
    if (existingFlag) existingFlag.remove();
    let removeBtn = document.getElementById("remove_photo_btn");
    if (removeBtn) removeBtn.remove();

    const modal = document.getElementById("modal_collaborator");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
}

// Modal: fechar
function closeModal() {
    const modal = document.getElementById("modal_collaborator");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
}

// Preview da foto
function previewPhoto(e) {
    const file = e.target.files[0];
    const preview = document.getElementById("photo_preview");
    if (!file) {
        preview.innerHTML = `<i class="fa-solid fa-user-ninja text-gray-300 text-2xl"></i>`;
        return;
    }

    // Set clear flag to false since a new photo is selected
    let flag = document.getElementById("clear_photo_flag");
    if (flag) flag.value = "false";

    const reader = new FileReader();
    reader.onload = function(event) {
        preview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
        
        // Ensure remove photo button exists
        let removeBtn = document.getElementById("remove_photo_btn");
        if (!removeBtn) {
            removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.id = "remove_photo_btn";
            removeBtn.onclick = clearPhoto;
            removeBtn.className = "text-[10px] text-red-600 hover:text-red-800 font-bold font-mono transition cursor-pointer mt-1 block text-center w-full";
            removeBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Remover`;
            preview.parentNode.appendChild(removeBtn);
        }
    };
    reader.readAsDataURL(file);
}

// Limpar foto localmente
function clearPhoto() {
    if (confirm("Marcar a foto atual para remoção?")) {
        let flag = document.getElementById("clear_photo_flag");
        if (!flag) {
            flag = document.createElement("input");
            flag.type = "hidden";
            flag.id = "clear_photo_flag";
            document.getElementById("collaborator_form").appendChild(flag);
        }
        flag.value = "true";
        document.getElementById("collab_photo").value = null; // Clear file input
        
        const preview = document.getElementById("photo_preview");
        preview.innerHTML = `<i class="fa-solid fa-user-ninja text-gray-300 text-2xl"></i>`;

        const btn = document.getElementById("remove_photo_btn");
        if (btn) btn.remove();
        showToast("Foto marcada para remoção. Lembre-se de salvar.", "info");
    }
}

// Editar: carregar localmente
function editCollaborator(id) {
    const collab = allCollaborators.find(c => c.id === id);
    if (!collab) return;

    openModal();
    document.getElementById("modal_title").textContent = "Editar Colaborador";
    document.getElementById("collab_id").value = collab.id;
    document.getElementById("collab_name").value = collab.name;
    document.getElementById("collab_role").value = collab.role;
    document.getElementById("collab_role_en").value = collab.role_en || "";
    document.getElementById("collab_bio").value = collab.bio;
    document.getElementById("collab_bio_en").value = collab.bio_en || "";
    document.getElementById("collab_portfolio").value = collab.portfolio_link || "";
    document.getElementById("collab_github").value = collab.github_link || "";
    
    // Create clear flag input for updates
    let flag = document.createElement("input");
    flag.type = "hidden";
    flag.id = "clear_photo_flag";
    flag.value = "false";
    document.getElementById("collaborator_form").appendChild(flag);

    if (collab.photo) {
        const preview = document.getElementById("photo_preview");
        preview.innerHTML = `<img src="${collab.photo}" class="w-full h-full object-cover">`;
        
        let removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.id = "remove_photo_btn";
        removeBtn.onclick = clearPhoto;
        removeBtn.className = "text-[10px] text-red-600 hover:text-red-800 font-bold font-mono transition cursor-pointer mt-1 block text-center w-full";
        removeBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Remover`;
        preview.parentNode.appendChild(removeBtn);
    }
}

// Deletar
function deleteCollaborator(id) {
    if (confirm("Remover este colaborador permanentemente?")) {
        fetch(`/api/collaborators/${id}/delete/`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getCSRFToken() }
        })
        .then(res => {
            if (res.ok) {
                fetchCollaborators();
                showToast("Colaborador excluído com sucesso!", "success");
            } else {
                showToast("Erro ao deletar colaborador.", "error");
            }
        })
        .catch(err => console.error(err));
    }
}

// Salvar (Criar ou Atualizar)
function saveCollaborator(e) {
    e.preventDefault();

    const btn = document.getElementById("save_collab_btn");
    const oldText = btn.innerHTML;

    const id = document.getElementById("collab_id").value;
    const name = document.getElementById("collab_name").value.trim();
    const role = document.getElementById("collab_role").value.trim();
    const role_en = document.getElementById("collab_role_en").value.trim();
    const bio = document.getElementById("collab_bio").value.trim();
    const bio_en = document.getElementById("collab_bio_en").value.trim();
    const portfolio = document.getElementById("collab_portfolio").value.trim();
    const github = document.getElementById("collab_github").value.trim();

    if (!name || !role || !bio) {
        showToast("Preencha todos os campos obrigatórios.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    const form = new FormData();
    form.append("name", name);
    form.append("role", role);
    form.append("role_en", role_en);
    form.append("bio", bio);
    form.append("bio_en", bio_en);
    form.append("portfolio_link", portfolio);
    form.append("github_link", github);

    const flag = document.getElementById("clear_photo_flag");
    if (flag) {
        form.append("clear_photo", flag.value);
    }

    const fileInput = document.getElementById("collab_photo");
    if (fileInput.files.length > 0) {
        form.append("photo", fileInput.files[0]);
    }

    const url = id ? `/api/collaborators/${id}/update/` : "/api/collaborators/create/";

    fetch(url, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: form
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar");
        return res.json();
    })
    .then(data => {
        closeModal();
        fetchCollaborators();
        showToast(id ? "Colaborador atualizado com sucesso!" : "Colaborador cadastrado com sucesso!", "success");
    })
    .catch(err => {
        console.error(err);
        showToast("Erro ao salvar colaborador.", "error");
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = oldText;
    });
}
