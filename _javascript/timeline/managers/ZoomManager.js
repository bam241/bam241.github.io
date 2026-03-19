/**
 * @file ZoomManager.js
 * @description Manages zoom level for the interactive project timeline.
 *
 * Controls zoom in, zoom out, and fit-to-screen behaviour via UI buttons,
 * clamping the zoom level within configured minimum and maximum bounds.
 * Triggers project repositioning and filter section adjustment after
 * each zoom change.
 */

class TimelineZoom {
    /**
     * Creates a new TimelineZoom instance and initializes zoom button handlers.
     *
     * @param {TimelineManager} timelineManager - The parent timeline controller instance.
     */
    constructor(timelineManager) {
        /**
         * Reference to the parent {@link TimelineManager} instance.
         * @type {TimelineManager}
         */
        this.manager = timelineManager;

        /**
         * The current zoom multiplier applied to the timeline.
         * @type {number}
         */
        this.currentZoom = 1;

        /**
         * The amount added or subtracted from {@link TimelineZoom#currentZoom}
         * on each zoom in or zoom out button click.
         * @type {number}
         */
        this.ZOOM_STEP = 0.2;

        /**
         * The minimum allowable zoom multiplier.
         * @type {number}
         */
        this.MIN_ZOOM = 0.2;

        /**
         * The maximum allowable zoom multiplier.
         * @type {number}
         */
        this.MAX_ZOOM = 2;

        this.initialize();
    }

    /**
     * Queries the DOM for zoom control buttons and attaches their event handlers.
     *
     * Logs a warning and returns early if any expected button is missing.
     * Delegates handler setup to {@link TimelineZoom#setupZoomHandlers}.
     */
    initialize() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const resetZoom = document.getElementById('resetZoom');

        if (!zoomIn || !zoomOut || !resetZoom) {
            console.warn('Some zoom controls are missing');
            return;
        }

        this.setupZoomHandlers(zoomIn, zoomOut, resetZoom);
    }

    /**
     * Calculates and applies the zoom level that fits the entire timeline
     * within the available viewport height.
     *
     * Available height is determined by subtracting the topbar, filter menu,
     * and a fixed padding from the total window height. The resulting zoom is
     * clamped between {@link TimelineZoom#MIN_ZOOM} and {@link TimelineZoom#MAX_ZOOM}.
     *
     * After applying the zoom, triggers a reflow of project positions and
     * filter section proportions inside a `requestAnimationFrame` callback
     * to ensure correct dimensions are available.
     */
    fitToScreen() {
        const markers = document.querySelectorAll('.year-marker, .month-marker');
        if (!markers.length) return;

        const topbar = document.getElementById('topbar-wrapper');
        const filterMenu = document.querySelector('.bottom-filter-menu');
        const topbarHeight = topbar ? topbar.offsetHeight : 60;
        const filterHeight = filterMenu ? filterMenu.offsetHeight : 60;
        const availableHeight = window.innerHeight - topbarHeight - filterHeight - 40;

        const totalHeight = markers.length * this.manager.monthHeight;
        const fitZoom = availableHeight / totalHeight;
        const clampedZoom = Math.min(Math.max(fitZoom, this.MIN_ZOOM), this.MAX_ZOOM);

        this.applyZoom(clampedZoom);

        requestAnimationFrame(() => {
            this.manager.positioner.processProjects();
            this.manager.filterManager.adjustFilterSections();
        });
    }

    /**
     * Attaches click event handlers to the zoom in, zoom out, and reset buttons.
     *
     * Each handler is wrapped in a try/catch to prevent an error in one
     * control from breaking the others.
     *
     * @param {HTMLElement} zoomIn    - The zoom in button element.
     * @param {HTMLElement} zoomOut   - The zoom out button element.
     * @param {HTMLElement} resetZoom - The reset zoom button element.
     */
    setupZoomHandlers(zoomIn, zoomOut, resetZoom) {
        zoomIn.addEventListener('click', () => {
            try {
                this.applyZoom(this.currentZoom + this.ZOOM_STEP);
            } catch (e) {
                console.error('Error applying zoom in:', e);
            }
        });

        zoomOut.addEventListener('click', () => {
            try {
                this.applyZoom(this.currentZoom - this.ZOOM_STEP);
            } catch (e) {
                console.error('Error applying zoom out:', e);
            }
        });

        resetZoom.addEventListener('click', () => {
            try {
                this.fitToScreen();
            } catch (e) {
                console.error('Error resetting zoom:', e);
            }
        });
    }

    /**
     * Clamps the given zoom value within the allowed range and applies it
     * to the timeline via {@link TimelineManager#updateZoom}.
     *
     * @param {number} newZoom - The desired zoom multiplier to apply.
     */
    applyZoom(newZoom) {
        this.currentZoom = Math.min(Math.max(newZoom, this.MIN_ZOOM), this.MAX_ZOOM);
        this.manager.updateZoom(this.currentZoom);
    }

    /**
     * Resets the zoom level to fit the timeline within the current viewport.
     *
     * Delegates to {@link TimelineZoom#fitToScreen}.
     */
    resetZoom() {
        this.fitToScreen();
    }

    /**
     * Returns the current zoom multiplier.
     *
     * @returns {number} The current zoom level.
     */
    getCurrentZoom() {
        return this.currentZoom;
    }
}