let allFormations = [];

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
    fetchFormations();
});

// Listar Formações
function fetchFormations() {
    const tbody = document.getElementById("formation_table_body");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6 text-center text-gray-500 italic">Carregando formações...</td></tr>`;

    fetch("/api/formation/list/")
        .then(res => res.json())
        .then(data => {
            allFormations = data.results || [];
            renderTable(allFormations);
        })
        .catch(err => {
            console.error("Erro:", err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6 text-center text-red-600 italic">Erro ao carregar formações.</td></tr>`;
        });
}

function renderTable(list) {
    const tbody = document.getElementById("formation_table_body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6 text-center text-gray-500 italic">Nenhuma formação ou curso cadastrado.</td></tr>`;
        return;
    }

    const isEn = (document.documentElement.lang || "pt-br").startsWith("en");

    list.forEach(f => {
        const start = f.ini_date ? f.ini_date.split("-")[0] : "";
        const displayEnd = isEn ? "In Progress" : "Cursando";
        const end = f.end_date ? f.end_date.split("-")[0] : displayEnd;
        
        const title = (isEn && f.title_en) ? f.title_en : f.title;
        const tipe = (isEn && f.tipe_en) ? f.tipe_en : f.tipe;
        
        const row = document.createElement("tr");
        row.className = "border-b border-gray-200 hover:bg-gray-50 transition";
        row.innerHTML = `
            <td class="px-6 py-4 font-bold text-gray-900">${esc(title)} <span class="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200 ml-2 font-bold">${esc(tipe)}</span></td>
            <td class="px-6 py-4 text-gray-600">${esc(f.institution)}</td>
            <td class="px-6 py-4 text-gray-600">${start} - ${end}</td>
            <td class="px-6 py-4 text-center font-mono">${esc(f.weight)}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-4">
                    <button onclick="deleteFormation(${f.id})" class="text-red-600 hover:text-red-800 cursor-pointer" title="Excluir">
                        <i class="fa-solid fa-trash-can text-base"></i>
                    </button>
                    <button onclick="editFormation(${f.id})" class="text-teal-700 hover:text-teal-900 cursor-pointer" title="Editar">
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
    document.getElementById("modal_title").textContent = "Nova Formação / Curso";
    document.getElementById("form_id").value = "";
    document.getElementById("form_title").value = "";
    document.getElementById("form_title_en").value = "";
    document.getElementById("form_institution").value = "";
    document.getElementById("form_tipe").value = "Curso Livre";
    document.getElementById("form_tipe_en").value = "";
    document.getElementById("form_ini_date").value = "";
    document.getElementById("form_end_date").value = "";
    document.getElementById("form_weight").value = "0";
    document.getElementById("form_certificate").value = null;
    document.getElementById("certificate_preview").innerHTML = `<i class="fa-solid fa-award text-gray-300 text-2xl"></i>`;

    const modal = document.getElementById("modal_formation");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
}

// Modal: fechar
function closeModal() {
    const modal = document.getElementById("modal_formation");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
}

// Preview do certificado
function previewCertificate(e) {
    const file = e.target.files[0];
    const preview = document.getElementById("certificate_preview");
    if (!file) {
        preview.innerHTML = `<i class="fa-solid fa-award text-gray-300 text-2xl"></i>`;
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        preview.innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
    };
    reader.readAsDataURL(file);
}

// Editar: carregar localmente
function editFormation(id) {
    const form = allFormations.find(f => f.id === id);
    if (!form) return;

    openModal();
    document.getElementById("modal_title").textContent = "Editar Formação";
    document.getElementById("form_id").value = form.id;
    document.getElementById("form_title").value = form.title;
    document.getElementById("form_title_en").value = form.title_en || "";
    document.getElementById("form_institution").value = form.institution;
    document.getElementById("form_tipe").value = form.tipe || "Curso Livre";
    document.getElementById("form_tipe_en").value = form.tipe_en || "";
    document.getElementById("form_ini_date").value = form.ini_date || "";
    document.getElementById("form_end_date").value = form.end_date || "";
    document.getElementById("form_weight").value = form.weight || 0;
    
    if (form.certificate) {
        document.getElementById("certificate_preview").innerHTML = `<img src="${form.certificate}" class="w-full h-full object-cover">`;
    }
}

// Deletar
function deleteFormation(id) {
    if (confirm("Remover esta formação permanentemente?")) {
        fetch(`/api/formation/${id}/delete/`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getCSRFToken() }
        })
        .then(res => {
            if (res.ok) {
                fetchFormations();
                showToast("Formação/Curso excluído com sucesso!", "success");
            } else {
                showToast("Erro ao deletar formação.", "error");
            }
        })
        .catch(err => console.error(err));
    }
}

// Salvar (Criar ou Atualizar)
function saveFormation(e) {
    e.preventDefault();

    const btn = document.getElementById("save_form_btn");
    const oldText = btn.innerHTML;

    const id = document.getElementById("form_id").value;
    const title = document.getElementById("form_title").value.trim();
    const title_en = document.getElementById("form_title_en").value.trim();
    const institution = document.getElementById("form_institution").value.trim();
    const tipe = document.getElementById("form_tipe").value;
    const tipe_en = document.getElementById("form_tipe_en").value.trim();
    const ini_date = document.getElementById("form_ini_date").value;
    const end_date = document.getElementById("form_end_date").value;
    const weight = document.getElementById("form_weight").value;
 
    if (!title || !institution || !ini_date) {
        showToast("Preencha todos os campos obrigatórios.", "error");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    // FormData para suportar arquivo
    const form = new FormData();
    form.append("title", title);
    form.append("title_en", title_en);
    form.append("institution", institution);
    form.append("tipe", tipe);
    form.append("tipe_en", tipe_en);
    form.append("ini_date", ini_date);
    if (end_date) form.append("end_date", end_date);
    else form.append("end_date", "");
    form.append("weight", weight);

    const fileInput = document.getElementById("form_certificate");
    if (fileInput.files.length > 0) {
        form.append("certificate", fileInput.files[0]);
    }

    const url = id ? `/api/formation/${id}/update/` : "/api/formation/create/";
    
    // Tanto criação quanto edição de certificado usam POST no nosso view devido ao arquivo
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
        fetchFormations();
        showToast(id ? "Formação/Curso atualizada com sucesso!" : "Formação/Curso adicionada com sucesso!", "success");
    })
    .catch(err => {
        console.error(err);
        showToast("Erro ao salvar formação.", "error");
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = oldText;
    });
}
