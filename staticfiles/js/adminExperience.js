let allExperiences = [];

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
    fetchExperiences();
});

// Listar experiências
function fetchExperiences() {
    const tbody = document.getElementById("experience_table_body");
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-gray-500 italic">Carregando experiências...</td></tr>`;

    fetch("/api/experience/list/")
        .then(res => res.json())
        .then(data => {
            allExperiences = data.results || [];
            renderTable(allExperiences);
        })
        .catch(err => {
            console.error("Erro:", err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-red-600 italic">Erro ao carregar experiências.</td></tr>`;
        });
}

function renderTable(list) {
    const tbody = document.getElementById("experience_table_body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-gray-500 italic">Nenhuma experiência profissional cadastrada.</td></tr>`;
        return;
    }

    const isEn = (document.documentElement.lang || "pt-br").startsWith("en");

    list.forEach(e => {
        const start = e.ini_date ? e.ini_date.split("-").reverse().slice(1).reverse().join("/") : "";
        const displayEnd = isEn ? "Present" : "Atual";
        const end = e.end_date ? e.end_date.split("-").reverse().slice(1).reverse().join("/") : displayEnd;
        
        const position = (isEn && e.position_en) ? e.position_en : e.position;
        
        const row = document.createElement("tr");
        row.className = "border-b border-gray-200 hover:bg-gray-50 transition";
        row.innerHTML = `
            <td class="px-6 py-4 font-bold text-gray-900">${esc(position)}</td>
            <td class="px-6 py-4 text-gray-600">${esc(e.work_place)}</td>
            <td class="px-6 py-4 text-gray-600">${start} - ${end}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-4">
                    <button onclick="deleteExperience(${e.id})" class="text-red-600 hover:text-red-800 cursor-pointer" title="Excluir">
                        <i class="fa-solid fa-trash-can text-base"></i>
                    </button>
                    <button onclick="editExperience(${e.id})" class="text-teal-700 hover:text-teal-900 cursor-pointer" title="Editar">
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
    document.getElementById("modal_title").textContent = "Nova Experiência";
    document.getElementById("exp_id").value = "";
    document.getElementById("exp_position").value = "";
    document.getElementById("exp_position_en").value = "";
    document.getElementById("exp_work_place").value = "";
    document.getElementById("exp_description").value = "";
    document.getElementById("exp_description_en").value = "";
    document.getElementById("exp_ini_date").value = "";
    document.getElementById("exp_end_date").value = "";
    document.getElementById("exp_tags").value = "";

    const modal = document.getElementById("modal_experience");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
}

// Modal: fechar
function closeModal() {
    const modal = document.getElementById("modal_experience");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
}

// Editar: carregar localmente
function editExperience(id) {
    const exp = allExperiences.find(e => e.id === id);
    if (!exp) return;

    openModal();
    document.getElementById("modal_title").textContent = "Editar Experiência";
    document.getElementById("exp_id").value = exp.id;
    document.getElementById("exp_position").value = exp.position;
    document.getElementById("exp_position_en").value = exp.position_en || "";
    document.getElementById("exp_work_place").value = exp.work_place;
    document.getElementById("exp_description").value = exp.description;
    document.getElementById("exp_description_en").value = exp.description_en || "";
    document.getElementById("exp_ini_date").value = exp.ini_date || "";
    document.getElementById("exp_end_date").value = exp.end_date || "";
    document.getElementById("exp_tags").value = exp.tags || "";
}

// Deletar
function deleteExperience(id) {
    if (confirm("Remover esta experiência profissional permanentemente?")) {
        fetch(`/api/experience/${id}/delete/`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getCSRFToken() }
        })
        .then(res => {
            if (res.ok) {
                fetchExperiences();
                showToast("Experiência profissional excluída com sucesso!", "success");
            } else {
                showToast("Erro ao deletar experiência.", "error");
            }
        })
        .catch(err => console.error(err));
    }
}

// Salvar (Criar ou Atualizar)
function saveExperience(e) {
    e.preventDefault();

    const btn = document.getElementById("save_exp_btn");
    const oldText = btn.innerHTML;

    const id = document.getElementById("exp_id").value;
    const position = document.getElementById("exp_position").value.trim();
    const position_en = document.getElementById("exp_position_en").value.trim();
    const work_place = document.getElementById("exp_work_place").value.trim();
    const description = document.getElementById("exp_description").value.trim();
    const description_en = document.getElementById("exp_description_en").value.trim();
    const ini_date = document.getElementById("exp_ini_date").value;
    const end_date = document.getElementById("exp_end_date").value;
    const tags = document.getElementById("exp_tags").value.trim();

    if (!position || !work_place || !description || !ini_date) {
        showToast("Preencha todos os campos obrigatórios.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    const payload = {
        position: position,
        position_en: position_en,
        work_place: work_place,
        description: description,
        description_en: description_en,
        ini_date: ini_date,
        end_date: end_date || null,
        tags: tags
    };

    const url = id ? `/api/experience/${id}/update/` : "/api/experience/create/";
    const method = id ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar");
        return res.json();
    })
    .then(data => {
        closeModal();
        fetchExperiences();
        showToast(id ? "Experiência profissional atualizada!" : "Experiência profissional adicionada!", "success");
    })
    .catch(err => {
        console.error(err);
        showToast("Erro ao salvar experiência.", "error");
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = oldText;
    });
}
