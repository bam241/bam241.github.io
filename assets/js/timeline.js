// Source: _javascript/timeline/managers/ColorManager.js
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

// Source: _javascript/timeline/managers/FilterManager.js
/**
 * @file FilterManager.js
 * @description Manages client and skill filtering for the project timeline.
 *
 * Handles filter button state, applies visibility rules to project timeline
 * elements, synchronizes the active skill filter with the page URL query
 * string, and adjusts filter section proportions based on content counts.
 */

class FilterManager {
    /**
     * Creates a new FilterManager and sets up all filter button event handlers.
     *
     * Note: {@link FilterManager#initialize} must be called separately after
     * the layout is ready in order to process URL parameters.
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
         * Set of currently active client filter names.
         * @type {Set<string>}
         */
        this.activeClients = new Set();

        /**
         * Set of currently active skill filter names.
         * @type {Set<string>}
         */
        this.activeSkills = new Set();

        this.setupFilters();
    }

    /**
     * Reads the `?skill=` URL query parameter and activates the matching
     * skill filter button if one is found.
     *
     * Should be called after the layout has been fully rendered so that
     * filter application triggers correct project repositioning.
     */
    initialize() {
        this.checkUrlParameters();
    }

    /**
     * Queries the DOM for all filter buttons and the reset button,
     * then attaches event handlers to each.
     */
    setupFilters() {
        /**
         * All client filter button elements.
         * @type {NodeList}
         */
        this.clientBtns = document.querySelectorAll('.client-btn');

        /**
         * All skill filter button elements.
         * @type {NodeList}
         */
        this.skillBtns = document.querySelectorAll('.skill-btn');

        /**
         * The reset filters button element.
         * @type {HTMLElement|null}
         */
        this.resetBtn = document.getElementById('resetFilters');

        this.setupClientButtons();
        this.setupSkillButtons();
        this.setupResetButton();
    }

    /**
     * Checks the current page URL for a `?skill=` query parameter and
     * activates the corresponding skill filter button if a match is found.
     *
     * Matching is case-insensitive. Clears any previously active skill
     * filters before activating the new one.
     */
    checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const skillParam = urlParams.get('skill');

        if (skillParam) {
            const skillButton = Array.from(this.skillBtns)
                .find(btn => btn.dataset.skill.toLowerCase() === skillParam.toLowerCase());

            if (skillButton) {
                this.clearSkillFilters(document.querySelector('.skill-btn[data-skill=""]'));
                this.toggleSkillFilter(skillButton, skillButton.dataset.skill);
                this.applyFilters();
            }
        }
    }

    /**
     * Attaches click event handlers to all client filter buttons.
     *
     * Clicking a button with an empty `data-client` attribute clears all
     * active client filters. Clicking a named client button toggles that
     * client's filter on or off.
     */
    setupClientButtons() {
        this.clientBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const clientName = btn.dataset.client;
                if (!clientName) {
                    this.clearClientFilters(btn);
                } else {
                    this.toggleClientFilter(btn, clientName);
                }
                this.applyFilters();
            });
        });
    }

    /**
     * Attaches click event handlers to all skill filter buttons.
     *
     * Clicking a button with an empty `data-skill` attribute clears all
     * active skill filters. Clicking a named skill button toggles that
     * skill's filter on or off.
     */
    setupSkillButtons() {
        this.skillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const skillName = btn.dataset.skill;
                if (!skillName) {
                    this.clearSkillFilters(btn);
                } else {
                    this.toggleSkillFilter(btn, skillName);
                }
                this.applyFilters();
            });
        });
    }

    /**
     * Attaches a click handler to the reset button that clears all active
     * filters and restores full project visibility.
     *
     * Does nothing if no reset button element is found in the DOM.
     */
    setupResetButton() {
        this.resetBtn?.addEventListener('click', () => this.resetFilters());
    }

    /**
     * Clears all active client filters and marks the "All" button as active.
     *
     * @param {HTMLElement} btn - The "All clients" button element to mark active.
     */
    clearClientFilters(btn) {
        this.activeClients.clear();
        this.clientBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    /**
     * Clears all active skill filters, marks the "All" button as active,
     * and removes the `?skill=` query parameter from the page URL.
     *
     * @param {HTMLElement} btn - The "All skills" button element to mark active.
     */
    clearSkillFilters(btn) {
        this.activeSkills.clear();
        this.skillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateUrl(null);
    }

    /**
     * Toggles a single client filter on or off.
     *
     * Removes the "All" client button's active state when a specific client
     * is selected. If the button is already active, deactivates it and removes
     * the client from the active set; otherwise activates it and adds it.
     *
     * @param {HTMLElement} btn        - The client filter button element.
     * @param {string}      clientName - The client name to toggle.
     */
    toggleClientFilter(btn, clientName) {
        document.querySelector('.client-btn[data-client=""]')?.classList.remove('active');

        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            this.activeClients.delete(clientName);
        } else {
            btn.classList.add('active');
            this.activeClients.add(clientName);
        }
    }

    /**
     * Toggles a single skill filter on or off and updates the page URL accordingly.
     *
     * Removes the "All" skill button's active state when a specific skill is
     * selected. If the button is already active, deactivates it, removes the
     * skill from the active set, and clears the URL parameter; otherwise
     * activates it, adds it to the active set, and sets the URL parameter.
     *
     * @param {HTMLElement} btn       - The skill filter button element.
     * @param {string}      skillName - The skill name to toggle.
     */
    toggleSkillFilter(btn, skillName) {
        document.querySelector('.skill-btn[data-skill=""]')?.classList.remove('active');

        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            this.activeSkills.delete(skillName);
            this.updateUrl(null);
        } else {
            btn.classList.add('active');
            this.activeSkills.add(skillName);
            this.updateUrl(skillName);
        }
    }

    /**
     * Updates the `?skill=` query parameter in the browser's URL bar
     * without triggering a page reload.
     *
     * @param {string|null} skill - The skill name to set, or `null` to remove
     *                              the parameter entirely.
     */
    updateUrl(skill) {
        const newUrl = new URL(window.location);
        if (skill) {
            newUrl.searchParams.set('skill', skill);
        } else {
            newUrl.searchParams.delete('skill');
        }
        window.history.pushState({}, '', newUrl);
    }

    /**
     * Clears all active client and skill filters, restores all projects to
     * visible, removes the URL skill parameter, and reprocesses project positions.
     */
    resetFilters() {
        this.activeClients.clear();
        this.activeSkills.clear();

        this.clientBtns.forEach(btn => btn.classList.remove('active'));
        this.skillBtns.forEach(btn => btn.classList.remove('active'));

        document.querySelector('.client-btn[data-client=""]')?.classList.add('active');
        document.querySelector('.skill-btn[data-skill=""]')?.classList.add('active');

        this.manager.projectTimelines.forEach(timeline => {
            timeline.style.display = '';
        });

        this.updateUrl(null);
        this.manager.processProjects();
    }

    /**
     * Shows or hides each project timeline element based on the currently
     * active client and skill filters, then reprocesses project positions.
     *
     * A project is visible if it matches all active filter sets. If no
     * filters of a given type are active, all projects pass that filter.
     */
    applyFilters() {
        this.manager.projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            const skills = timeline.dataset.skills?.split(',') || [];

            const noFiltersActive = this.activeClients.size === 0 && this.activeSkills.size === 0;

            const clientMatch = noFiltersActive ||
                this.activeClients.size === 0 ||
                Array.from(this.activeClients).some(client => clientText.includes(client));

            const skillMatch = noFiltersActive ||
                this.activeSkills.size === 0 ||
                Array.from(this.activeSkills).some(skill => skills.includes(skill));

            timeline.style.display = (clientMatch && skillMatch) ? '' : 'none';
        });

        this.manager.processProjects();
    }

    /**
     * Calculates the proportion of clients vs. skills across all projects
     * and sets CSS custom properties on the two filter group elements so
     * their widths scale accordingly.
     *
     * Sets `--section-width` on `.filter-group:nth-child(1)` (clients) and
     * `.filter-group:nth-child(2)` (skills).
     */
    adjustFilterSections() {
        const clientCount = new Set(Array.from(this.manager.projectTimelines)
            .map(timeline => timeline.querySelector('.project-client')?.textContent)
            .filter(Boolean)).size;

        const skillCount = new Set(Array.from(this.manager.projectTimelines)
            .map(timeline => timeline.dataset.skills?.split(',') || [])
            .flat()
            .filter(Boolean)).size;

        const total = clientCount + skillCount;
        const clientProportion = (clientCount / total) * 100;
        const skillsProportion = (skillCount / total) * 100;

        const clientSection = document.querySelector('.filter-group:nth-child(1)');
        const skillsSection = document.querySelector('.filter-group:nth-child(2)');

        if (clientSection && skillsSection) {
            clientSection.style.setProperty('--section-width', `${clientProportion}%`);
            skillsSection.style.setProperty('--section-width', `${skillsProportion}%`);
        }
    }
}

// Source: _javascript/timeline/managers/ProjectPositioner.js
/**
 * @file ProjectPositioner.js
 * @description Handles the layout and positioning of project cards on the timeline.
 *
 * Assigns projects to non-overlapping horizontal lanes for their timeline lines,
 * then places project content boxes into columns to avoid vertical overlaps.
 * Scales box widths to fit the available screen width when needed.
 */

class ProjectPositioner {
    /**
     * Creates a new ProjectPositioner instance.
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
         * Registry of all content boxes placed in the current layout pass,
         * used for overlap detection.
         * @type {Array<{left: number, right: number, top: number, bottom: number}>}
         */
        this.placedBoxes = [];

        /**
         * Default width of a project content box in pixels at full size.
         * @type {number}
         */
        this.BOX_WIDTH = 220;

        /**
         * Horizontal spacing in pixels between adjacent timeline lanes.
         * @type {number}
         */
        this.LANE_SPACING = 15;

        /**
         * Left offset in pixels from the timeline container edge to the first lane.
         * @type {number}
         */
        this.BASE_OFFSET = 20;

        /**
         * Height of a single month row in pixels at zoom level 1.
         * @type {number}
         */
        this.MONTH_HEIGHT = 40;

        /**
         * Horizontal gap in pixels between adjacent content box columns.
         * @type {number}
         */
        this.BOX_SPACING = 5;

        /**
         * Horizontal gap in pixels between the last timeline lane and the
         * first content box column.
         * @type {number}
         */
        this.CONTENT_OFFSET = 10;

        /**
         * The number of content columns currently in use for the active layout.
         * @type {number}
         */
        this.maxColumns = 1;

        /**
         * The scaled content box width in pixels for the current layout pass.
         * Updated each time {@link ProjectPositioner#positionAllProjects} runs.
         * @type {number}
         */
        this.currentBoxWidth = this.BOX_WIDTH;
    }

    /**
     * Returns the true available width in pixels for the projects container,
     * measured from its left edge to the right edge of the viewport.
     *
     * Temporarily clears any `minWidth` override before measuring to ensure
     * an accurate reading.
     *
     * @returns {number} Available width in pixels.
     */
    getTrueAvailableWidth() {
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.minWidth = '';
        const containerRect = projectsContainer.getBoundingClientRect();
        return window.innerWidth - containerRect.left - 20;
    }

    /**
     * Calculates the scaled content box width that fits all needed columns
     * within the available container width.
     *
     * Returns the full {@link ProjectPositioner#BOX_WIDTH} if there is enough
     * space, otherwise scales down proportionally with a minimum of 100px.
     *
     * @returns {number} The box width in pixels to use for the current layout.
     */
    getScaledBoxWidth() {
        const availableWidth = this.getTrueAvailableWidth() - this.timelinesWidth;
        const neededColumns = this.maxColumns || 1;
        const fullSizeWidth = neededColumns * (this.BOX_WIDTH + this.BOX_SPACING);

        if (fullSizeWidth <= availableWidth) {
            return this.BOX_WIDTH;
        }

        const scaledWidth = Math.floor(
            (availableWidth - (neededColumns - 1) * this.BOX_SPACING) / neededColumns
        );
        return Math.max(scaledWidth, 100);
    }

    /**
     * Calculates the font size percentage to apply to project content boxes,
     * scaled proportionally to the current box width relative to the default.
     *
     * Returns a minimum of 70% to keep text readable at small sizes.
     *
     * @returns {number} Font size as a percentage value (e.g. `85` for `85%`).
     */
    getScaledFontSize() {
        const boxWidth = this.getScaledBoxWidth();
        return Math.max((boxWidth / this.BOX_WIDTH) * 100, 70);
    }

    /**
     * Runs a full layout pass for all currently visible projects.
     *
     * Collects visible projects, assigns them to horizontal lanes to avoid
     * timeline line overlaps, then positions all content boxes and lines.
     */
    processProjects() {
        const visibleProjects = this.getVisibleProjects();
        this.assignLanes(visibleProjects);
        this.positionAllProjects(visibleProjects);
    }

    /**
     * Collects all project timeline elements that are currently visible,
     * parses their date ranges, calculates their vertical positions, and
     * returns them sorted by start date ascending.
     *
     * @returns {Array<Object>} Sorted array of project descriptor objects, each
     *   containing `element`, `startDate`, `endDate`, `startPos`, `endPos`,
     *   and `lane` (initialized to `0`).
     */
    getVisibleProjects() {
        return Array.from(this.manager.projectTimelines)
            .filter(timeline => timeline.style.display !== 'none')
            .map(timeline => ({
                element: timeline,
                ...this.getProjectDates(timeline),
                lane: 0
            }))
            .sort((a, b) => a.startDate - b.startDate);
    }

    /**
     * Parses the date range text from a project timeline element and calculates
     * the corresponding vertical pixel positions on the timeline.
     *
     * Treats a missing or `'Present'` end date as today's date.
     *
     * @param  {HTMLElement} timeline - The `.project-timeline` element to read dates from.
     * @returns {{
     *   startDate: Date,
     *   endDate:   Date,
     *   startPos:  number,
     *   endPos:    number
     * }} Parsed dates and their corresponding vertical pixel positions.
     */
    getProjectDates(timeline) {
        const datesText = timeline.querySelector('.project-dates').textContent
            .replace(/\s+/g, ' ')
            .trim();
        const parts = datesText.split(' - ');
        const startStr = parts[0]?.trim();
        const endStr = parts[1]?.trim();
        const startDate = startStr ? new Date(startStr) : new Date();
        const endDate = !endStr || endStr === 'Present' ? new Date() : new Date(endStr);
        return {
            startDate,
            endDate,
            startPos: this.calculatePosition(startDate),
            endPos: this.calculatePosition(endDate)
        };
    }

    /**
     * Converts a JavaScript `Date` object into a vertical pixel position
     * on the timeline, accounting for the current zoom level.
     *
     * Position is calculated relative to the first year/month marker in the DOM.
     * Sub-month precision is achieved by interpolating the day within its month.
     *
     * @param  {Date}   date - The date to convert to a pixel position.
     * @returns {number} The vertical pixel offset from the top of the timeline.
     */
    calculatePosition(date) {
        const zoomLevel = this.manager.zoomManager.getCurrentZoom();
        const firstMarker = document.querySelector('.year-marker, .month-marker');
        const startYear = parseInt(firstMarker.dataset.year);
        const startMonth = parseInt(firstMarker.dataset.month) - 1;

        const yearDiff = date.getFullYear() - startYear;
        const monthDiff = date.getMonth() - startMonth;
        const totalMonths = (yearDiff * 12) + monthDiff - 1;

        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const dayProgress = (date.getDate() - 1) / daysInMonth;

        const monthPosition = totalMonths * this.MONTH_HEIGHT;
        const dayOffset = dayProgress * this.MONTH_HEIGHT;

        return Math.max(0, (monthPosition + dayOffset) * zoomLevel);
    }

    /**
     * Assigns a horizontal lane index to each project to prevent timeline
     * line overlaps.
     *
     * Iterates projects in start-date order. For each project, finds the
     * lowest lane number that does not overlap with any earlier project.
     *
     * @param {Array<Object>} projects - Array of project descriptor objects
     *                                   as returned by {@link ProjectPositioner#getVisibleProjects}.
     */
    assignLanes(projects) {
        projects.forEach((project, i) => {
            for (let j = 0; j < i; j++) {
                if (this.hasOverlap(project, projects[j])) {
                    project.lane = Math.max(project.lane, projects[j].lane + 1);
                }
            }
        });
    }

    /**
     * Determines whether two projects' timeline lines overlap vertically,
     * using a pixel buffer to add spacing between adjacent lines.
     *
     * @param  {Object} project1 - First project descriptor with `startPos` and `endPos`.
     * @param  {Object} project2 - Second project descriptor with `startPos` and `endPos`.
     * @returns {boolean} `true` if the two projects overlap within the buffer zone.
     */
    hasOverlap(project1, project2) {
        const buffer = 50;
        return project1.startPos < (project2.endPos + buffer) &&
            project2.startPos < (project1.endPos + buffer);
    }

    /**
     * Checks whether a candidate content box position overlaps with any
     * already-placed box in {@link ProjectPositioner#placedBoxes}.
     *
     * @param  {number} left      - Left edge of the candidate box in pixels.
     * @param  {number} top       - Top edge of the candidate box in pixels.
     * @param  {number} height    - Height of the candidate box in pixels.
     * @param  {number} [boxWidth] - Width of the candidate box in pixels.
     *                              Defaults to {@link ProjectPositioner#currentBoxWidth}.
     * @returns {boolean} `true` if the candidate box overlaps with any placed box.
     */
    checkContentOverlap(left, top, height, boxWidth) {
        boxWidth = boxWidth || this.currentBoxWidth;
        return this.placedBoxes.some(box => {
            const verticalOverlap = top < box.bottom && (top + height) > box.top;
            const horizontalOverlap = left < box.right && (left + boxWidth) > box.left;
            return verticalOverlap && horizontalOverlap;
        });
    }

    /**
     * Runs the full content box positioning pass for all visible projects.
     *
     * Calculates the timeline lane area width, determines the number of
     * content columns needed, scales the box width to fit, then positions
     * each project's line and content box.
     *
     * @param {Array<Object>} projects - Array of project descriptor objects
     *                                   as returned by {@link ProjectPositioner#getVisibleProjects}.
     */
    positionAllProjects(projects) {
        this.placedBoxes = [];
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.minWidth = '';
        projectsContainer.style.position = 'relative';

        const maxLane = Math.max(...projects.map(p => p.lane));
        this.timelinesWidth = this.BASE_OFFSET + ((maxLane + 1) * this.LANE_SPACING);

        this.maxColumns = this.calculateNeededColumns(projects);
        const scaledBoxWidth = this.getScaledBoxWidth();
        this.currentBoxWidth = scaledBoxWidth;

        const sortedProjects = [...projects].sort((a, b) => {
            if (Math.abs(a.startPos - b.startPos) < 50) {
                return a.lane - b.lane;
            }
            return a.startPos - b.startPos;
        });

        sortedProjects.forEach(project => this.positionProject(project));
        this.adjustContainerWidth(projects);
    }

    /**
     * Performs a dry-run layout pass to determine the minimum number of
     * content columns required to place all projects without overlap.
     *
     * Uses an estimated box height of 100px and respects
     * {@link ProjectPositioner#BOX_SPACING} between boxes.
     *
     * @param  {Array<Object>} projects - Array of project descriptor objects.
     * @returns {number} The minimum number of columns needed.
     */
    calculateNeededColumns(projects) {
        const tempBoxes = [];
        let maxCols = 1;
        const BOX_SPACING = this.BOX_SPACING;

        const sorted = [...projects].sort((a, b) => a.startPos - b.startPos);

        sorted.forEach(project => {
            const height = 100;
            const top = project.startPos + (project.endPos - project.startPos) / 2 - height / 2;
            const bottom = top + height + BOX_SPACING;

            let col = 0;
            while (tempBoxes.some(box => {
                const vertOverlap = (top - BOX_SPACING) < box.bottom && bottom > box.top;
                const horizOverlap = col === box.col;
                return vertOverlap && horizOverlap;
            })) {
                col++;
            }

            tempBoxes.push({ col, top, bottom });
            maxCols = Math.max(maxCols, col + 1);
        });

        return maxCols;
    }

    /**
     * Positions the timeline line and content box for a single project.
     *
     * The line is placed at the project's assigned horizontal lane. The
     * content box is vertically centered on the project's duration and placed
     * in the first available column. If no existing column fits, a new column
     * is added.
     *
     * @param {Object}      project         - Project descriptor object.
     * @param {HTMLElement} project.element - The `.project-timeline` DOM element.
     * @param {number}      project.startPos - Top pixel position of the project line.
     * @param {number}      project.endPos   - Bottom pixel position of the project line.
     * @param {number}      project.lane     - Assigned horizontal lane index.
     */
    positionProject(project) {
        const timeline = project.element;
        const line = timeline.querySelector('.project-line');
        const content = timeline.querySelector('.project-content');
        const scaledFontSize = this.getScaledFontSize();
        const boxWidth = this.currentBoxWidth;

        const horizontalPos = this.BASE_OFFSET + (project.lane * this.LANE_SPACING);

        if (line) {
            line.style.position = 'absolute';
            line.style.left = `${horizontalPos}px`;
            line.style.top = `${project.startPos}px`;
            line.style.height = `${Math.max(project.endPos - project.startPos, 2)}px`;
        }

        if (content) {
            content.style.fontSize = `${scaledFontSize}%`;
            content.style.width = `${boxWidth}px`;
            content.style.position = 'absolute';

            const contentHeight = content.offsetHeight || 0;
            const verticalCenter = project.startPos + (project.endPos - project.startPos) / 2;
            const contentTop = verticalCenter - (contentHeight / 2);

            let contentLeft = this.timelinesWidth + this.CONTENT_OFFSET;
            let placed = false;

            for (let col = 0; col < this.maxColumns; col++) {
                const tryLeft = this.timelinesWidth + this.CONTENT_OFFSET +
                    col * (boxWidth + this.BOX_SPACING);

                if (!this.checkContentOverlap(tryLeft, contentTop, contentHeight, boxWidth)) {
                    contentLeft = tryLeft;
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                this.maxColumns++;
                contentLeft = this.timelinesWidth + this.CONTENT_OFFSET +
                    (this.maxColumns - 1) * (boxWidth + this.BOX_SPACING);
            }

            content.style.left = `${contentLeft}px`;
            content.style.top = `${contentTop}px`;

            this.placedBoxes.push({
                left: contentLeft,
                right: contentLeft + boxWidth,
                top: contentTop,
                bottom: contentTop + contentHeight
            });
        }
    }

    /**
     * Sets the `minWidth` of the projects container to fit all placed content
     * boxes, capped at the true available viewport width.
     *
     * Does nothing if no projects are provided.
     *
     * @param {Array<Object>} projects - Array of project descriptor objects.
     */
    adjustContainerWidth(projects) {
        if (projects.length === 0) return;

        const available = this.getTrueAvailableWidth();
        const maxRight = Math.max(
            ...this.placedBoxes.map(box => box.right),
            this.timelinesWidth + this.currentBoxWidth
        );

        const container = document.querySelector('.projects-container');
        container.style.minWidth = `${Math.min(maxRight + 10, available)}px`;
    }

    /**
     * Clears all inline position styles from every project's line and content
     * elements, then runs a fresh layout pass.
     *
     * Used when the zoom level or filter state changes and a full reflow
     * is needed.
     */
    resetPositions() {
        this.placedBoxes = [];
        this.manager.projectTimelines.forEach(timeline => {
            const content = timeline.querySelector('.project-content');
            const line = timeline.querySelector('.project-line');

            if (content) {
                content.style.left = '';
                content.style.top = '';
                content.style.fontSize = '';
                content.style.width = '';
            }
            if (line) {
                line.style.left = '';
                line.style.top = '';
                line.style.height = '';
            }
        });
        this.processProjects();
    }
}

// Source: _javascript/timeline/managers/ZoomManager.js
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

// Source: _javascript/timeline/utils/DOMUtils.js
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

// Source: _javascript/timeline/TimeLineManager.js
/**
 * @file TimeLineManager.js
 * @description Core controller for the interactive project timeline.
 *
 * Coordinates all sub-managers ({@link ColorManager}, {@link TimelineZoom},
 * {@link ProjectPositioner}, {@link FilterManager}) and handles project
 * rendering, modal display, and zoom updates.
 */

class TimelineManager {
    /**
     * Creates a new TimelineManager instance.
     *
     * Reads all `.project-timeline` elements from the DOM, determines the
     * earliest project start date to establish the timeline origin, and
     * initializes all sub-managers.
     */
    constructor() {
        /**
         * Base height of a single month row in pixels, at zoom level 1.
         * @type {number}
         */
        this.monthHeight = 40;

        /**
         * All project timeline DOM elements on the page.
         * @type {NodeList}
         */
        this.projectTimelines = document.querySelectorAll('.project-timeline');

        const projectDates = Array.from(this.projectTimelines)
            .map(timeline => {
                const datesText = timeline.querySelector('.project-dates').textContent;
                const startStr = datesText.split(' - ')[0];
                return new Date(startStr);
            });

        const earliestDate = new Date(Math.min(...projectDates));

        /**
         * The calendar year of the earliest project, used as the timeline origin.
         * @type {number}
         */
        this.firstYear = earliestDate.getFullYear();

        /**
         * All year marker DOM elements.
         * @type {NodeList}
         */
        this.yearMarkers = document.querySelectorAll('.year-marker');

        /**
         * All month marker DOM elements.
         * @type {NodeList}
         */
        this.monthMarkers = document.querySelectorAll('.month-marker');

        /**
         * Combined NodeList of all year and month marker DOM elements.
         * @type {NodeList}
         */
        this.allMarkers = document.querySelectorAll('.year-marker, .month-marker');

        this.initializeManagers();
    }

    /**
     * Instantiates all sub-managers in dependency order.
     *
     * Order matters: {@link ColorManager} must run before {@link TimelineZoom}
     * and {@link ProjectPositioner}, and all three before {@link FilterManager}.
     */
    initializeManagers() {
        /** @type {ColorManager} */
        this.colorManager = new ColorManager();

        /**
         * Map of client name to assigned hex color string.
         * @type {Object.<string, string>}
         */
        this.clientColors = this.colorManager.generateClientColors(this.projectTimelines);

        /** @type {TimelineZoom} */
        this.zoomManager = new TimelineZoom(this);

        /** @type {ProjectPositioner} */
        this.positioner = new ProjectPositioner(this);

        /** @type {FilterManager} */
        this.filterManager = new FilterManager(this);
    }

    /**
     * Runs all one-time setup steps after the DOM is ready.
     *
     * Initializes marker positions, attaches project click handlers,
     * sets up the modal, and applies client colors.
     */
    initialize() {
        this.initializeMarkers();
        this.setupProjectHandlers();
        this.initializeModalHandlers();
        this.colorManager.applyClientColors(this.projectTimelines, this.clientColors);
    }

    /**
     * Sets initial CSS positioning on all year and month markers.
     *
     * Also positions the `.present-marker` element if one exists in the DOM.
     */
    initializeMarkers() {
        this.allMarkers.forEach(marker => {
            marker.style.position = 'relative';
            if (marker.classList.contains('year-marker')) {
                const dot = marker.querySelector('.year-dot');
                if (dot) dot.style.top = '50%';
            }
        });

        const presentMarker = document.querySelector('.present-marker');
        if (presentMarker) {
            const parentMarker = presentMarker.closest('.month-marker, .year-marker');
            if (parentMarker) {
                presentMarker.style.top = '50%';
            }
        }
    }

    /**
     * Attaches click handlers to each project's content box and timeline line.
     *
     * Clicking either element opens the project detail modal via
     * {@link TimelineManager#showProjectDetails}.
     */
    setupProjectHandlers() {
        this.projectTimelines.forEach(timeline => {
            const content = timeline.querySelector('.project-content');
            const line = timeline.querySelector('.project-line');

            const clickHandler = (event) => {
                event.preventDefault();
                this.showProjectDetails(timeline);
            };

            [content, line].forEach(element => {
                if (element) {
                    element.style.cursor = 'pointer';
                    element.addEventListener('click', clickHandler);
                }
            });
        });
    }

    /**
     * Attaches event handlers to the project detail modal.
     *
     * - Close button hides the modal.
     * - Clicking the clickable area navigates to the project URL.
     * - Clicking the modal backdrop hides the modal.
     */
    initializeModalHandlers() {
        const modal = document.getElementById('projectModal');
        const closeBtn = modal.querySelector('.modal-close');
        const clickableArea = modal.querySelector('.modal-clickable');

        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            modal.style.display = 'none';
        });

        clickableArea.addEventListener('click', () => {
            const projectUrl = modal.dataset.projectUrl;
            if (projectUrl) {
                window.location.href = projectUrl;
            }
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Extracts project data from the given timeline element and displays
     * it in the project detail modal.
     *
     * @param {HTMLElement} timeline - The `.project-timeline` element that was clicked.
     */
    showProjectDetails(timeline) {
        const modal = document.getElementById('projectModal');
        const projectData = this.extractProjectData(timeline);
        this.updateModalContent(modal, projectData);
        modal.style.display = 'block';
    }

    /**
     * Populates the project detail modal with the provided project data.
     *
     * Dynamically builds the skills and categories badge sections,
     * clearing any previously displayed content first.
     *
     * @param {HTMLElement} modal - The modal DOM element.
     * @param {Object}      data  - The project data object.
     * @param {string}      data.url         - URL of the project page.
     * @param {string}      data.title       - Display title of the project.
     * @param {string}      data.client      - Client name.
     * @param {string}      data.dates       - Formatted date range string.
     * @param {string}      data.description - Short description of the project.
     * @param {string[]}    data.skills      - List of skill tag strings.
     * @param {string[]}    data.categories  - List of category tag strings.
     */
    updateModalContent(modal, data) {
        modal.dataset.projectUrl = data.url;
        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalClient').textContent = data.client;
        document.getElementById('modalDates').textContent = data.dates;
        document.getElementById('modalDescription').textContent = data.description;

        // Skills section
        const modalSkillsContainer = document.getElementById('modalSkills');
        modalSkillsContainer.innerHTML = '';

        if (data.skills && data.skills.length > 0 && data.skills[0] !== '') {
            const skillsTitle = document.createElement('h4');
            skillsTitle.textContent = 'Skills';
            modalSkillsContainer.appendChild(skillsTitle);

            const skillsWrapper = document.createElement('div');
            skillsWrapper.classList.add('skills-badges');

            data.skills.forEach(skill => {
                const skillBadge = document.createElement('span');
                skillBadge.classList.add('skill-badge');
                skillBadge.textContent = skill.trim();
                skillsWrapper.appendChild(skillBadge);
            });

            modalSkillsContainer.appendChild(skillsWrapper);
        }

        // Categories section
        const modalCategoriesContainer = document.getElementById('modalCategories');
        modalCategoriesContainer.innerHTML = '';

        if (data.categories && data.categories.length > 0 && data.categories[0] !== '') {
            const categoriesTitle = document.createElement('h4');
            categoriesTitle.textContent = 'Categories';
            modalCategoriesContainer.appendChild(categoriesTitle);

            const categoriesWrapper = document.createElement('div');
            categoriesWrapper.classList.add('categories-badges');

            data.categories.forEach(category => {
                const categoryBadge = document.createElement('span');
                categoryBadge.classList.add('category-badge');
                categoryBadge.textContent = category.trim();
                categoriesWrapper.appendChild(categoryBadge);
            });

            modalCategoriesContainer.appendChild(categoriesWrapper);
        }
    }

    /**
     * Extracts structured project data from a `.project-timeline` DOM element.
     *
     * Reads text content and `data-*` attributes to build a plain data object
     * suitable for passing to {@link TimelineManager#updateModalContent}.
     *
     * @param  {HTMLElement} timeline - The `.project-timeline` element to read from.
     * @returns {Object} Project data object with title, client, dates, description,
     *                   skills, categories, and url fields.
     */
    extractProjectData(timeline) {
        return {
            title: timeline.querySelector('h3').textContent,
            client: timeline.querySelector('.project-client')?.textContent || '',
            dates: timeline.querySelector('.project-dates')?.textContent || '',
            description: (timeline.dataset.short_description || timeline.dataset.description || 'No description available.'),
            skills: timeline.dataset.skills
                ? timeline.dataset.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '')
                : [],
            categories: timeline.dataset.categories
                ? timeline.dataset.categories.split(',').map(category => category.trim()).filter(category => category !== '')
                : [],
            url: timeline.dataset.url
        };
    }

    /**
     * Delegates project layout processing to {@link ProjectPositioner}.
     *
     * Called after filter changes or zoom updates to recompute positions.
     */
    processProjects() {
        this.positioner.processProjects();
    }

    /**
     * Updates the height of all timeline markers to reflect the new zoom level,
     * then re-processes project positions.
     *
     * @param {number} zoomLevel - The new zoom multiplier to apply.
     */
    updateZoom(zoomLevel) {
        const newMonthHeight = this.monthHeight * zoomLevel;
        this.allMarkers.forEach(marker => {
            marker.style.height = `${newMonthHeight}px`;
        });
        this.processProjects();
    }

    /**
     * Resets all marker heights to the base {@link TimelineManager#monthHeight}
     * and clears all project position overrides via {@link ProjectPositioner}.
     */
    resetPositions() {
        this.allMarkers.forEach(marker => {
            marker.style.height = `${this.monthHeight}px`;
        });
        this.positioner.resetPositions();
    }

    /**
     * Returns the base month height in pixels at zoom level 1.
     *
     * @returns {number} The base month height in pixels.
     */
    getMonthHeight() {
        return this.monthHeight;
    }

    /**
     * Calculates the total unzoomed height of the timeline in pixels.
     *
     * @returns {number} Total height as marker count × base month height.
     */
    getTotalHeight() {
        return this.allMarkers.length * this.monthHeight;
    }
}

// Source: _javascript/timeline/main.js
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
