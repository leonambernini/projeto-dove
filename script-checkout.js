const ajustBrand = () => {
    const brand = document.querySelector('.headbar-logo-img');
    if (brand) {
        brand.style.maxHeight = "100px";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    ajustBrand();
});
ajustBrand();
