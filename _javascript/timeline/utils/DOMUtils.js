/**
 * @file DOMUtils.js
 * @description Utility functions for DOM manipulation on the project timeline page.
 *
 * Provides helper methods that operate directly on the DOM outside the scope
 * of the main timeline manager and its sub-managers.
 */

/**
 * Collection of static DOM utility functions used by the timeline page.
 *
 * @namespace DOMUtils
 */
const DOMUtils = {
    /**
     * Calculates the vertical pixel position of the current date on the timeline
     * and sets it as the `--dotted-line-start` CSS custom property on the
     * document root.
     *
     * The position is derived from the `.current-year` marker element's offset,
     * then refined by the current month and day within that year.
     *
     * This property is intended to be consumed by a CSS rule that renders a
     * dotted line from the current date to the bottom of the timeline.
     *
     * Does nothing and logs a message if no `.current-year` marker is found.
     * Logs an error and exits silently if the position calculation fails.
     *
     * @memberof DOMUtils
     * @returns {void}
     *
     * @example
     * // Call after the DOM is fully rendered to set the dotted line position.
     * DOMUtils.setupDottedLine();
     */
    setupDottedLine() {
        const currentYearMarker = document.querySelector('.current-year');
        if (!currentYearMarker) {
            console.log('No current year marker found');
            return;
        }

        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentDay = currentDate.getDate();
            const yearHeight = currentYearMarker.offsetHeight;
            const monthHeight = yearHeight / 12;
            const dayHeight = monthHeight / 31;

            const currentYearTop = currentYearMarker.offsetTop;
            const monthOffset = currentMonth * monthHeight;
            const dayOffset = currentDay * dayHeight;
            const startDottedLine = currentYearTop + monthOffset + dayOffset;

            document.documentElement.style.setProperty('--dotted-line-start', `${startDottedLine}px`);
        } catch (e) {
            console.error('Error setting up dotted line:', e);
        }
    }
};