/**
 * @file main.js
 * @description Entry point for the interactive project timeline.
 *
 * Initializes the {@link TimelineManager} on DOM load, fits the timeline
 * to the screen after a short rendering delay, and re-fits on window resize
 * using a debounced handler.
 */

document.addEventListener('DOMContentLoaded', function () {
    /**
     * The main timeline controller instance.
     * @type {TimelineManager}
     */
    const timeline = new TimelineManager();
    timeline.initialize();

    /**
     * Delay the initial fit to allow the DOM to finish rendering
     * before calculating dimensions.
     */
    setTimeout(() => {
        timeline.zoomManager.fitToScreen();
    }, 150);

    /**
     * Debounced resize handler that re-fits the timeline to the screen
     * whenever the browser window is resized.
     *
     * Uses {@link window._resizeTimer} to debounce rapid resize events,
     * waiting 150ms after the last event before acting.
     */
    window.addEventListener('resize', () => {
        clearTimeout(window._resizeTimer);
        window._resizeTimer = setTimeout(() => {
            timeline.zoomManager.fitToScreen();
        }, 150);
    });
});