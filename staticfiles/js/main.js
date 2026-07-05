// Dynamic Navbar Opacity on Scroll
document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.querySelector(".main-nav");
    if (navbar) {
        function checkScroll() {
            if (window.scrollY > 50) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        }
        
        // Check scroll position on load and on scroll
        window.addEventListener("scroll", checkScroll);
        checkScroll();
    }
});
