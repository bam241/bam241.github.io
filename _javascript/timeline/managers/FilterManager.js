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