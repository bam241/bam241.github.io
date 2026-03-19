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