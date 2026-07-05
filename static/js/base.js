// Função global de notificações Toast (Retro / Moderno)
function showToast(message, type = "success") {
    // Busca ou cria o container de toasts no body
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm";
        document.body.appendChild(container);
    }

    // Criar elemento toast
    const toast = document.createElement("div");
    toast.className = "flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl text-xs font-mono font-bold text-white transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto border-2 border-teal-950";

    // Ícones e cores dependendo do tipo
    let icon = "";
    if (type === "success") {
        toast.classList.add("bg-emerald-600");
        icon = `<i class="fa-solid fa-circle-check text-base"></i>`;
    } else if (type === "error") {
        toast.classList.add("bg-red-600");
        icon = `<i class="fa-solid fa-circle-exclamation text-base"></i>`;
    } else {
        toast.classList.add("bg-blue-600");
        icon = `<i class="fa-solid fa-circle-info text-base"></i>`;
    }

    toast.innerHTML = `${icon} <span class="flex-grow">${message}</span>`;
    container.appendChild(toast);

    // Trigger de transição (slide in e fade in)
    requestAnimationFrame(() => {
        toast.classList.remove("translate-y-4", "opacity-0");
    });

    // Remover automaticamente após 4 segundos
    setTimeout(() => {
        toast.classList.add("translate-y-4", "opacity-0");
        toast.addEventListener("transitionend", function() {
            toast.remove();
        });
    }, 4000);
}

// Gerenciador de validação de campos ocultos
document.addEventListener("DOMContentLoaded", function() {
    const isEn = (document.documentElement.lang || "pt-br").startsWith("en");
    if (isEn) {
        // No modo inglês, remove o required dos campos PT-BR ocultos para evitar erros de validação invisíveis no navegador
        document.querySelectorAll(".lang-pt [required], .lang-pt input[required], .lang-pt textarea[required], .lang-pt select[required]").forEach(el => {
            el.removeAttribute("required");
        });
    } else {
        // No modo português, remove o required dos campos EN ocultos (caso existam)
        document.querySelectorAll(".lang-en [required], .lang-en input[required], .lang-en textarea[required], .lang-en select[required]").forEach(el => {
            el.removeAttribute("required");
        });
    }
});
