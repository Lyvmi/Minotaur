// Sidebar options
const generalBody = document.querySelector('.general-body');
const appearanceBody = document.querySelector('.appearance-body');

// Sidebar links
const generalLink = document.querySelector('.general-link');
const appearanceLink = document.querySelector('.appearance-link');

// Close button
const closeButton = document.querySelector('.bx-x');

// Function to show General body and hide Appearance body
function showGeneralBody() {
    generalBody.style.display = 'flex';
    appearanceBody.style.display = 'none';
    generalLink.classList.add('active');
    appearanceLink.classList.remove('active');
}

// Function to show Appearance body and hide General body
function showAppearanceBody() {
    generalBody.style.display = 'none';
    appearanceBody.style.display = 'flex';
    appearanceLink.classList.add('active');
    generalLink.classList.remove('active');
}

// Event listener for General link
generalLink.addEventListener('click', showGeneralBody);

// Event listener for Appearance link
appearanceLink.addEventListener('click', showAppearanceBody);

// Event listener for close button
closeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});
