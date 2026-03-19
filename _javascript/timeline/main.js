document.addEventListener('DOMContentLoaded', function () {
    const timeline = new TimelineManager();
    timeline.initialize();

    setTimeout(() => {
        timeline.zoomManager.fitToScreen();
    }, 150);

    window.addEventListener('resize', () => {
        clearTimeout(window._resizeTimer);
        window._resizeTimer = setTimeout(() => {
            timeline.zoomManager.fitToScreen();
        }, 150);
    });
});