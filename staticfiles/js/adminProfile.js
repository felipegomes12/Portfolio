// Obter CSRF Token para requisições Django
function getCSRFToken() {
    const input = document.querySelector("[name=csrfmiddlewaretoken]");
    if (input) return input.value;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrftoken=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
}

// Preview da imagem de perfil selecionada
function previewProfileImage(e) {
    const file = e.target.files[0];
    const preview = document.getElementById("profile_img_preview");
    if (!file) {
        return;
    }
    
    // Desmarca a flag de exclusão pois um novo arquivo foi selecionado
    document.getElementById("clear_profile_img").value = "false";

    // Reseta os sliders para os padrões para a nova imagem começar centralizada e sem zoom
    document.getElementById("img_zoom").value = 1.0;
    document.getElementById("img_x").value = 0;
    document.getElementById("img_y").value = 0;

    document.getElementById("zoom_val").textContent = "1.0";
    document.getElementById("x_val").textContent = "0";
    document.getElementById("y_val").textContent = "0";
    
    const reader = new FileReader();
    reader.onload = function(event) {
        preview.innerHTML = `<img id="profile_img_tag" src="${event.target.result}" class="min-w-full min-h-full w-auto h-auto max-w-none max-h-none block">`;
        
        // Garante a existência do botão de exclusão
        let removeBtn = document.getElementById("remove_photo_btn");
        if (!removeBtn) {
            removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.id = "remove_photo_btn";
            removeBtn.onclick = clearProfileImage;
            removeBtn.className = "text-[10px] text-red-600 hover:text-red-800 font-bold font-mono transition cursor-pointer mt-1";
            removeBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Remover Foto`;
            preview.parentNode.appendChild(removeBtn);
        }
        
        updateImageTransform();
    };
    reader.readAsDataURL(file);
}

// Limpar foto de perfil local e marcar para exclusão no banco de dados
function clearProfileImage() {
    if (confirm("Deseja marcar a foto de perfil atual para remoção?")) {
        document.getElementById("clear_profile_img").value = "true";
        document.getElementById("profile_img").value = null; // Limpa input de arquivo

        // Substitui a imagem pelo ninja placeholder
        const preview = document.getElementById("profile_img_preview");
        preview.innerHTML = `<i id="profile_icon_placeholder" class="fa-solid fa-user-ninja text-gray-300 text-4xl"></i>`;

        // Reseta os sliders para os padrões
        document.getElementById("img_zoom").value = 1.0;
        document.getElementById("img_x").value = 0;
        document.getElementById("img_y").value = 0;

        document.getElementById("zoom_val").textContent = "1.0";
        document.getElementById("x_val").textContent = "0";
        document.getElementById("y_val").textContent = "0";

        // Remove o botão de exclusão da tela
        const btn = document.getElementById("remove_photo_btn");
        if (btn) btn.remove();

        showToast("Foto marcada para remoção. Clique em 'Salvar Perfil' para confirmar.", "info");
    }
}

// Atualizar live transform
function updateImageTransform() {
    const img = document.getElementById("profile_img_tag");
    if (!img) return;

    const zoom = document.getElementById("img_zoom").value;
    const x = document.getElementById("img_x").value;
    const y = document.getElementById("img_y").value;

    document.getElementById("zoom_val").textContent = zoom;
    document.getElementById("x_val").textContent = x;
    document.getElementById("y_val").textContent = y;

    img.style.transform = `scale(${zoom}) translate(${x}px, ${y}px)`;
    img.style.transformOrigin = "center";
}

// Salvar Perfil via AJAX
function saveProfile(e) {
    e.preventDefault();

    const btn = document.getElementById("save_profile_btn");
    const oldText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    // Criar FormData para upload
    const form = new FormData();
    form.append("name", document.getElementById("name").value.trim());
    form.append("expertise", document.getElementById("expertise").value.trim());
    form.append("expertise_en", document.getElementById("expertise_en").value.trim());
    form.append("bio", document.getElementById("bio").value.trim());
    form.append("bio_en", document.getElementById("bio_en").value.trim());
    form.append("about_me", document.getElementById("about_me").value.trim());
    form.append("about_me_en", document.getElementById("about_me_en").value.trim());
    form.append("location", document.getElementById("location").value.trim());
    form.append("location_en", document.getElementById("location_en").value.trim());
    form.append("email", document.getElementById("email").value.trim());
    form.append("contact", document.getElementById("contact").value.trim());
    form.append("github_user", document.getElementById("github_user").value.trim());
    form.append("linkedin_link", document.getElementById("linkedin_link").value.trim());
    
    // Ajustes de Imagem
    form.append("img_zoom", document.getElementById("img_zoom").value);
    form.append("img_x", document.getElementById("img_x").value);
    form.append("img_y", document.getElementById("img_y").value);
    form.append("clear_profile_img", document.getElementById("clear_profile_img").value);
    form.append("clear_resume", document.getElementById("clear_resume").value);
    const clearResumeEnEl = document.getElementById("clear_resume_en");
    if (clearResumeEnEl) form.append("clear_resume_en", clearResumeEnEl.value);
    
    // Datas
    const dateBirth = document.getElementById("date_birth").value;
    const iniDateExp = document.getElementById("ini_date_exp").value;
    if (dateBirth) form.append("date_birth", dateBirth);
    if (iniDateExp) form.append("ini_date_exp", iniDateExp);

    // Foto de perfil
    const fileInput = document.getElementById("profile_img");
    if (fileInput.files.length > 0) {
        form.append("profile_img", fileInput.files[0]);
    }

    // Currículo PT
    const resumeInput = document.getElementById("resume");
    if (resumeInput && resumeInput.files.length > 0) {
        form.append("resume", resumeInput.files[0]);
    }

    // Currículo EN
    const resumeEnInput = document.getElementById("resume_en");
    if (resumeEnInput && resumeEnInput.files.length > 0) {
        form.append("resume_en", resumeEnInput.files[0]);
    }


    // Tags (Skills)
    const tagCheckboxes = document.querySelectorAll("input[name='tag_checkboxes']:checked");
    const selectedTagIds = Array.from(tagCheckboxes).map(cb => parseInt(cb.value));
    form.append("tags", JSON.stringify(selectedTagIds));

    // Enviar dados
    fetch("/api/profile/update/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: form
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao salvar perfil");
        return res.json();
    })
    .then(data => {
        showToast(data.message || "Perfil atualizado com sucesso!", "success");
        setTimeout(() => {
            location.reload();
        }, 1000);
    })
    .catch(err => {
        console.error(err);
        showToast("Ocorreu um erro ao salvar o perfil. Tente novamente.", "error");
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = oldText;
    });
}

// Criar nova Skill / Tag diretamente via AJAX e injetar no DOM
function createNewTag() {
    const titleInput = document.getElementById("new_tag_title");
    const iconInput = document.getElementById("new_tag_icon");

    const title = titleInput.value.trim();
    const icon = iconInput.value.trim();

    if (!title) {
        showToast("O nome da skill é obrigatório.", "error");
        return;
    }

    const form = new FormData();
    form.append("title", title);
    form.append("fontawesome_icon", icon);

    fetch("/api/tags/create/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: form
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro ao criar tag");
        return res.json();
    })
    .then(data => {
        // Limpar inputs
        titleInput.value = "";
        iconInput.value = "";

        // Remover placeholder se estiver vazio
        const noSkillsMsg = document.getElementById("no_skills_msg");
        if (noSkillsMsg) noSkillsMsg.remove();

        // Inserir checkbox marcado no container
        const container = document.getElementById("skills_checkbox_container");
        const label = document.createElement("label");
        label.className = "flex items-center gap-2 text-xs font-bold cursor-pointer hover:text-teal-700";
        label.innerHTML = `
            <input 
                type="checkbox" 
                name="tag_checkboxes" 
                value="${data.id}"
                checked
                class="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
            >
            <i class="${data.fontawesome_icon} text-base text-gray-500 w-5 text-center"></i>
            <span>${data.title}</span>
        `;
        container.appendChild(label);

        showToast(`Skill "${data.title}" criada e marcada com sucesso!`, "success");
    })
    .catch(err => {
        console.error(err);
        showToast("Erro ao criar nova skill.", "error");
    });
}

// Preview do currículo selecionado
function previewResumeFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Desmarca a flag de exclusão
    document.getElementById("clear_resume").value = "false";

    // Atualiza o label do arquivo selecionado
    document.getElementById("resume_filename_label").textContent = file.name;

    // Atualiza o status
    const statusText = document.getElementById("resume_status_text");
    statusText.innerHTML = `<span class="text-amber-600 font-bold"><i class="fa-solid fa-file-arrow-up"></i> ${file.name} (Pronto para salvar)</span>`;

    // Garante que o botão de exclusão exista
    let removeBtn = document.getElementById("remove_resume_btn");
    if (!removeBtn) {
        const container = document.getElementById("resume_status_container");
        removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.id = "remove_resume_btn";
        removeBtn.onclick = clearResumeFile;
        removeBtn.className = "text-left text-[10px] text-red-600 hover:text-red-800 font-bold font-mono transition cursor-pointer mt-1";
        removeBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Remover Currículo`;
        container.appendChild(removeBtn);
    }
}

// Limpar currículo local e marcar para exclusão no banco
function clearResumeFile() {
    if (confirm("Deseja marcar o currículo atual para remoção?")) {
        document.getElementById("clear_resume").value = "true";
        document.getElementById("resume").value = null; // Limpa input
        document.getElementById("resume_filename_label").textContent = "Selecione o arquivo em português";

        const statusText = document.getElementById("resume_status_text");
        statusText.innerHTML = `<span class="text-red-500 italic">Marcado para remoção</span>`;

        const btn = document.getElementById("remove_resume_btn");
        if (btn) btn.remove();

        showToast("Currículo em português marcado para remoção. Clique em 'Salvar Perfil' para confirmar.", "info");
    }
}

// Preview do currículo em inglês selecionado
function previewResumeEnFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Desmarca a flag de exclusão
    document.getElementById("clear_resume_en").value = "false";

    // Atualiza o label do arquivo selecionado
    document.getElementById("resume_en_filename_label").textContent = file.name;

    // Atualiza o status
    const statusText = document.getElementById("resume_en_status_text");
    statusText.innerHTML = `<span class="text-amber-600 font-bold"><i class="fa-solid fa-file-arrow-up"></i> ${file.name} (Pronto para salvar)</span>`;

    // Garante que o botão de exclusão exista
    let removeBtn = document.getElementById("remove_resume_en_btn");
    if (!removeBtn) {
        const container = document.getElementById("resume_en_status_container");
        removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.id = "remove_resume_en_btn";
        removeBtn.onclick = clearResumeEnFile;
        removeBtn.className = "text-left text-[10px] text-red-600 hover:text-red-800 font-bold font-mono transition cursor-pointer mt-1";
        removeBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i> Remover Currículo (EN)`;
        container.appendChild(removeBtn);
    }
}

// Limpar currículo em inglês local e marcar para exclusão no banco
function clearResumeEnFile() {
    if (confirm("Deseja marcar o currículo em inglês para remoção?")) {
        document.getElementById("clear_resume_en").value = "true";
        document.getElementById("resume_en").value = null; // Limpa input
        document.getElementById("resume_en_filename_label").textContent = "Selecione o arquivo em inglês";

        const statusText = document.getElementById("resume_en_status_text");
        statusText.innerHTML = `<span class="text-red-500 italic">Marcado para remoção</span>`;

        const btn = document.getElementById("remove_resume_en_btn");
        if (btn) btn.remove();

        showToast("Currículo em inglês marcado para remoção. Clique em 'Salvar Perfil' para confirmar.", "info");
    }
}


