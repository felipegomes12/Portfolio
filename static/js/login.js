function togglePassword() {

    const input = document.getElementById("password")
    const eye = document.getElementById("password-eye")

    if (input.type === "password") {

        input.type = "text"

        eye.classList.remove("fa-eye")
        eye.classList.add("fa-eye-slash")

    } else {

        input.type = "password"

        eye.classList.remove("fa-eye-slash")
        eye.classList.add("fa-eye")
    }
}
