// Helper para obter CSRF Token
function getCSRFToken() {
    const input = document.querySelector("[name=csrfmiddlewaretoken]");
    if (input) return input.value;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrftoken=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
}

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


// Carregar status e histórico
function loadSyncStatus() {
    fetch("/api/github-sync/status/")
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            document.getElementById("sync_enabled").checked = data.enabled;
            if (data.minutes) {
                document.getElementById("sync_minutes").value = String(data.minutes);
            }
            document.getElementById("next_run_display").textContent = data.enabled ? data.next_run : "Desativado";

            renderHistoryTable(data.history || []);
        })
        .catch(err => {
            console.error("Erro ao carregar status do agendador:", err);
        });
}

// Renderizar tabela de histórico
function renderHistoryTable(history) {
    const tbody = document.getElementById("history_table_body");
    if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic">Nenhuma execução registrada até o momento.</td></tr>`;
        return;
    }

    let html = "";
    history.forEach(item => {
        const statusBadge = item.success
            ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300"><i class="fa-solid fa-check"></i> Sucesso</span>`
            : `<span class="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-300"><i class="fa-solid fa-xmark"></i> Falha</span>`;

        html += `
            <tr class="border-b border-gray-200 hover:bg-gray-50 transition">
                <td class="p-3 font-mono font-bold text-gray-600">#${esc(item.id)}</td>
                <td class="p-3 font-mono">${esc(item.started)}</td>
                <td class="p-3 font-mono">${esc(item.time_taken)}s</td>
                <td class="p-3">${statusBadge}</td>
                <td class="p-3 font-mono text-gray-700 max-w-xs truncate" title="${esc(item.result)}">${esc(item.result)}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Salvar configurações de agendamento
function saveScheduleConfig(e) {
    e.preventDefault();
    const btn = document.getElementById("save_schedule_btn");
    btn.disabled = true;

    const enabled = document.getElementById("sync_enabled").checked;
    const minutes = document.getElementById("sync_minutes").value;

    const formData = new FormData();
    formData.append("enabled", enabled ? "true" : "false");
    formData.append("minutes", minutes);

    fetch("/api/github-sync/config/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        if (data.message) {
            showToast(data.message, "success");
            loadSyncStatus();
        } else if (data.error) {
            showToast(data.error, "error");
        }
    })
    .catch(err => {
        btn.disabled = false;
        showToast("Erro ao salvar configuração.", "error");
    });
}

// Executar sincronização manual imediata
function runSyncNow() {
    const btn = document.getElementById("run_now_btn");
    const textSpan = document.getElementById("run_now_text");
    const originalText = textSpan.textContent;

    btn.disabled = true;
    textSpan.textContent = "Sincronizando...";
    btn.classList.add("opacity-75");

    fetch("/api/github-sync/run/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
    .then(res => res.json())
    .then(data => {
        btn.disabled = false;
        textSpan.textContent = originalText;
        btn.classList.remove("opacity-75");

        if (data.message) {
            showToast(data.message, "success");
            loadSyncStatus();
        } else if (data.error) {
            showToast(data.error, "error");
        }
    })
    .catch(err => {
        btn.disabled = false;
        textSpan.textContent = originalText;
        btn.classList.remove("opacity-75");
        showToast("Erro ao executar sincronização.", "error");
    });
}

document.addEventListener("DOMContentLoaded", function() {
    loadSyncStatus();
});
