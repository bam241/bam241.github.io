/**
 * @file main.js
 * @description Entry point for the interactive project timeline.
 *
 * Initializes the {@link TimelineManager} on DOM load, fits the timeline
 * to the screen after a short rendering delay, and re-fits on window resize
 * using a debounced handler.
 *
 * On touch devices, adds a tap toggle for the bottom filter menu since
 * iOS Safari does not support CSS :hover on non-anchor elements.
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

    /**
     * On touch devices, the CSS :hover state is not triggered by taps.
     * This handler adds a tap toggle on the filter menu tab (::after arrow)
     * so iOS users can show and hide the filter menu by tapping it.
     *
     * Uses `hover: none` media query to detect touch-only devices reliably,
     * avoiding user agent string sniffing.
     */
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (isTouch) {
        const filterMenu = document.querySelector('.bottom-filter-menu');
        if (filterMenu) {
            filterMenu.addEventListener('touchstart', function (e) {
                // Only toggle if the tap is in the arrow tab area (top 20px)
                const rect = filterMenu.getBoundingClientRect();
                const touchY = e.touches[0].clientY;
                const tapInTabArea = touchY < rect.top + 20;

                if (tapInTabArea || !filterMenu.classList.contains('open')) {
                    e.preventDefault();
                    filterMenu.classList.toggle('open');
                }
            }, { passive: false });

            /**
             * Close the filter menu when the user taps outside of it.
             */
            document.addEventListener('touchstart', function (e) {
                if (!filterMenu.contains(e.target) && filterMenu.classList.contains('open')) {
                    filterMenu.classList.remove('open');
                }
            });
        }
    }
});