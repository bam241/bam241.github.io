/**
 * @file ColorManager.js
 * @description Manages color assignment and application for project timeline clients.
 *
 * Assigns a unique color from a predefined palette to each client found in the
 * timeline, then applies those colors to timeline elements and filter buttons.
 */

class ColorManager {
    /**
     * Creates a new ColorManager instance with a predefined color palette.
     *
     * Colors are assigned to clients in alphabetical order, cycling through
     * the palette if the number of clients exceeds the palette length.
     */
    constructor() {
        /**
         * Predefined color palette used for client color assignments.
         * @type {string[]}
         */
        this.colors = [
            '#E63946', '#2A9D8F', '#264653', '#1ABC9C',
            '#F4A261', '#4A90E2', '#8E44AD', '#27AE60',
            '#E67E22', '#C0392B', '#1ABC9C', '#F39C12',
            '#7D3C98', '#2ECC71', '#E74C3C', '#3498DB'
        ];
    }

    /**
     * Converts a CSS hex color string to an RGB component object.
     *
     * Supports both shorthand (`#RGB`) and full (`#RRGGBB`) hex formats.
     *
     * @param  {string} hex - The hex color string to convert (e.g. `'#E63946'` or `'#E39'`).
     * @returns {{ r: number, g: number, b: number }} Object with `r`, `g`, and `b`
     *                                                integer components (0–255).
     */
    hexToRGB(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    /**
     * Builds a map of client name to hex color by scanning all project timeline elements.
     *
     * Clients are collected into a Set to deduplicate, sorted alphabetically,
     * then assigned colors from {@link ColorManager#colors} in order.
     *
     * @param  {NodeList} projectTimelines - All `.project-timeline` DOM elements.
     * @returns {Object.<string, string>} Map of client name to assigned hex color string.
     */
    generateClientColors(projectTimelines) {
        const clientColors = {};
        const clients = new Set();

        projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            if (clientText) {
                const clientName = clientText.replace('Client:', '').trim();
                clients.add(clientName);
            }
        });

        Array.from(clients).sort().forEach((client, index) => {
            clientColors[client] = this.colors[index % this.colors.length];
        });

        return clientColors;
    }

    /**
     * Applies client colors to both timeline elements and filter buttons.
     *
     * Delegates to {@link ColorManager#applyTimelineColors} for project cards
     * and {@link ColorManager#applyButtonColors} for the filter bar.
     *
     * @param {NodeList}             projectTimelines - All `.project-timeline` DOM elements.
     * @param {Object.<string, string>} clientColors  - Map of client name to hex color string.
     */
    applyClientColors(projectTimelines, clientColors) {
        this.applyTimelineColors(projectTimelines, clientColors);
        this.applyButtonColors(clientColors);
    }

    /**
     * Applies the assigned client color to each project timeline element.
     *
     * Extracts the client name from each element's `.project-client` text,
     * looks up the color, and calls {@link ColorManager#applyColorToElements}.
     *
     * @param {NodeList}             projectTimelines - All `.project-timeline` DOM elements.
     * @param {Object.<string, string>} clientColors  - Map of client name to hex color string.
     */
    applyTimelineColors(projectTimelines, clientColors) {
        projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            const clientName = clientText.replace('Client:', '').trim();
            const color = clientColors[clientName];

            if (color) {
                this.applyColorToElements(timeline, color);
            }
        });
    }

    /**
     * Applies a color to the visual sub-elements of a single project timeline.
     *
     * Sets a left border on `.project-content`, background color on `.project-line`,
     * and border color on all `.project-dot` elements.
     *
     * @param {HTMLElement} timeline - The `.project-timeline` element to style.
     * @param {string}      color    - The hex color string to apply.
     */
    applyColorToElements(timeline, color) {
        const content = timeline.querySelector('.project-content');
        if (content) {
            content.style.borderLeft = `4px solid ${color}`;
            content.dataset.clientColor = color;
        }

        const line = timeline.querySelector('.project-line');
        if (line) {
            line.style.backgroundColor = color;
            line.style.setProperty('--timeline-color', color);
        }

        const dots = timeline.querySelectorAll('.project-dot');
        dots.forEach(dot => {
            dot.style.borderColor = color;
        });
    }

    /**
     * Applies color styling and hover behavior to all `.client-btn` filter buttons.
     *
     * Only buttons with a non-empty `data-client` attribute and a matching
     * entry in `clientColors` are styled.
     *
     * @param {Object.<string, string>} clientColors - Map of client name to hex color string.
     */
    applyButtonColors(clientColors) {
        document.querySelectorAll('.client-btn').forEach(btn => {
            const clientName = btn.dataset.client;
            const color = clientColors[clientName];
            if (color && clientName) {
                this.setupClientButton(btn, color);
            }
        });
    }

    /**
     * Applies border color and mouse hover effects to a single client filter button.
     *
     * On hover, the button fills with the client color and switches to white text.
     * On mouse leave, it reverts to theme defaults unless the button is active.
     *
     * @param {HTMLElement} btn   - The `.client-btn` button element to style.
     * @param {string}      color - The hex color string to apply.
     */
    setupClientButton(btn, color) {
        btn.style.borderColor = color;
        btn.style.borderWidth = '2px';

        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = color;
            btn.style.color = '#fff';
        });

        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('active')) {
                btn.style.backgroundColor = 'var(--sidebar-bg)';
                btn.style.color = 'var(--text-color)';
            }
        });
    }
}