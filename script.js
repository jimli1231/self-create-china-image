document.addEventListener('DOMContentLoaded', () => {
    const scrollWrapper = document.getElementById('scrollWrapper');
    const bgm = document.getElementById('bgm');

    scrollWrapper.addEventListener('click', () => {
        scrollWrapper.classList.toggle('open');

        // Try to play BGM
        if (bgm.paused) {
            bgm.play().catch(error => {
                console.log("Audio play failed (likely due to browser policy):", error);
            });
        }
    });
});
