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