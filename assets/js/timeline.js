// Source: _javascript/timeline/managers/ColorManager.js
class ColorManager {
    constructor() {
        this.colors = [
            '#E63946', '#2A9D8F', '#264653', '#1ABC9C',
            '#F4A261', '#4A90E2', '#8E44AD', '#27AE60',
            '#E67E22', '#C0392B', '#1ABC9C', '#F39C12',
            '#7D3C98', '#2ECC71', '#E74C3C', '#3498DB'
        ];
    }

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

    applyClientColors(projectTimelines, clientColors) {
        this.applyTimelineColors(projectTimelines, clientColors);
        this.applyButtonColors(clientColors);
    }

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

    applyButtonColors(clientColors) {
        document.querySelectorAll('.client-btn').forEach(btn => {
            const clientName = btn.dataset.client;
            const color = clientColors[clientName];
            if (color && clientName) {
                this.setupClientButton(btn, color);
            }
        });
    }

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
class FilterManager {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.activeClients = new Set();
        this.activeSkills = new Set();
        this.setupFilters();
        // checkUrlParameters moved to initialize() - called after layout is ready
    }

    initialize() {
        this.checkUrlParameters();
    }

    setupFilters() {
        this.clientBtns = document.querySelectorAll('.client-btn');
        this.skillBtns = document.querySelectorAll('.skill-btn');
        this.resetBtn = document.getElementById('resetFilters');

        this.setupClientButtons();
        this.setupSkillButtons();
        this.setupResetButton();
    }

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

    setupResetButton() {
        this.resetBtn?.addEventListener('click', () => this.resetFilters());
    }

    clearClientFilters(btn) {
        this.activeClients.clear();
        this.clientBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    clearSkillFilters(btn) {
        this.activeSkills.clear();
        this.skillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateUrl(null);
    }

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

    updateUrl(skill) {
        if (skill) {
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('skill', skill);
            window.history.pushState({}, '', newUrl);
        } else {
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('skill');
            window.history.pushState({}, '', newUrl);
        }
    }

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

    applyFilters() {
        this.manager.projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            const skills = timeline.dataset.skills?.split(',') || [];

            const showDueToNoFilters = this.activeClients.size === 0 && this.activeSkills.size === 0;

            const clientMatch = showDueToNoFilters ||
                this.activeClients.size === 0 ||
                Array.from(this.activeClients).some(client => clientText.includes(client));

            const skillMatch = showDueToNoFilters ||
                this.activeSkills.size === 0 ||
                Array.from(this.activeSkills).some(skill => skills.includes(skill));

            timeline.style.display = (clientMatch && skillMatch) ? '' : 'none';
        });

        this.manager.processProjects();
    }

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
class ProjectPositioner {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.placedBoxes = [];
        this.BOX_WIDTH = 220;
        this.LANE_SPACING = 15;
        this.BASE_OFFSET = 20;
        this.MONTH_HEIGHT = 40;
        this.BOX_SPACING = 5;
        this.CONTENT_OFFSET = 10;
        this.maxColumns = 1;
        this.currentBoxWidth = this.BOX_WIDTH;
    }

    getTrueAvailableWidth() {
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.minWidth = '';
        const containerRect = projectsContainer.getBoundingClientRect();
        return window.innerWidth - containerRect.left - 20;
    }

    getScaledBoxWidth() {
        const availableWidth = this.getTrueAvailableWidth() - this.timelinesWidth;

        // Use actual max lanes as column count - this is the real number needed
        const neededColumns = this.maxColumns || 1;

        const fullSizeWidth = neededColumns * (this.BOX_WIDTH + this.BOX_SPACING);

        if (fullSizeWidth <= availableWidth) {
            return this.BOX_WIDTH;
        } else {
            const scaledWidth = Math.floor(
                (availableWidth - (neededColumns - 1) * this.BOX_SPACING) / neededColumns
            );
            return Math.max(scaledWidth, 100);
        }
    }

    getScaledFontSize() {
        const boxWidth = this.getScaledBoxWidth();
        return Math.max((boxWidth / this.BOX_WIDTH) * 100, 70);
    }

    processProjects() {
        const visibleProjects = this.getVisibleProjects();
        this.assignLanes(visibleProjects);
        this.positionAllProjects(visibleProjects);
    }

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

    assignLanes(projects) {
        projects.forEach((project, i) => {
            for (let j = 0; j < i; j++) {
                if (this.hasOverlap(project, projects[j])) {
                    project.lane = Math.max(project.lane, projects[j].lane + 1);
                }
            }
        });
    }

    hasOverlap(project1, project2) {
        const buffer = 50;
        return project1.startPos < (project2.endPos + buffer) &&
            project2.startPos < (project1.endPos + buffer);
    }

    checkContentOverlap(left, top, height, boxWidth) {
        boxWidth = boxWidth || this.currentBoxWidth;
        return this.placedBoxes.some(box => {
            const verticalOverlap = top < box.bottom && (top + height) > box.top;
            const horizontalOverlap = left < box.right && (left + boxWidth) > box.left;
            return verticalOverlap && horizontalOverlap;
        });
    }

    positionAllProjects(projects) {
        this.placedBoxes = [];
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.minWidth = '';
        projectsContainer.style.position = 'relative';

        const maxLane = Math.max(...projects.map(p => p.lane));
        this.timelinesWidth = this.BASE_OFFSET + ((maxLane + 1) * this.LANE_SPACING);

        // First pass: calculate needed columns from actual project overlaps
        this.maxColumns = this.calculateNeededColumns(projects);

        // Then scale box to fit those columns
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

    calculateNeededColumns(projects) {
        const tempBoxes = [];
        let maxCols = 1;
        const BOX_SPACING = this.BOX_SPACING;

        const sorted = [...projects].sort((a, b) => a.startPos - b.startPos);

        sorted.forEach(project => {
            const height = 100; // estimated box height
            const top = project.startPos + (project.endPos - project.startPos) / 2 - height / 2;
            const bottom = top + height + BOX_SPACING; // ← add spacing to bottom

            let col = 0;
            while (tempBoxes.some(box => {
                const vertOverlap = (top - BOX_SPACING) < box.bottom && bottom > box.top; // ← spacing on top too
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

            // If no column fits, add a new column
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
class TimelineZoom {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.currentZoom = 1;
        this.ZOOM_STEP = 0.2;
        this.MIN_ZOOM = 0.2;
        this.MAX_ZOOM = 2;
        this.initialize();
    }

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

        // Reprocess after zoom with correct dimensions
        requestAnimationFrame(() => {
            this.manager.positioner.processProjects();
            this.manager.filterManager.adjustFilterSections();
        });
    }

    setupZoomHandlers(zoomIn, zoomOut, resetZoom) {
        zoomIn.addEventListener('click', () => {
            try {
                this.applyZoom(this.currentZoom + this.ZOOM_STEP);
            } catch (e) {
                console.error('Error applying zoom:', e);
            }
        });

        zoomOut.addEventListener('click', () => {
            try {
                this.applyZoom(this.currentZoom - this.ZOOM_STEP);
            } catch (e) {
                console.error('Error applying zoom:', e);
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

    applyZoom(newZoom) {
        this.currentZoom = Math.min(Math.max(newZoom, this.MIN_ZOOM), this.MAX_ZOOM);
        this.manager.updateZoom(this.currentZoom);
    }

    resetZoom() {
        this.fitToScreen();
    }

    getCurrentZoom() {
        return this.currentZoom;
    }
}

// Source: _javascript/timeline/utils/DOMUtils.js
const DOMUtils = {
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
            console.log('Error setting up dotted line:', e);
        }
    }
};

// Source: _javascript/timeline/TimeLineManager.js
class TimelineManager {
    constructor() {
        this.monthHeight = 40;
        this.projectTimelines = document.querySelectorAll('.project-timeline');

        // Get the earliest project date
        const projectDates = Array.from(this.projectTimelines)
            .map(timeline => {
                const datesText = timeline.querySelector('.project-dates').textContent;
                const startStr = datesText.split(' - ')[0];
                return new Date(startStr);
            });

        const earliestDate = new Date(Math.min(...projectDates));

        this.firstYear = earliestDate.getFullYear();

        this.yearMarkers = document.querySelectorAll('.year-marker');
        this.monthMarkers = document.querySelectorAll('.month-marker');
        this.allMarkers = document.querySelectorAll('.year-marker, .month-marker');

        // Initialize managers in correct order
        this.initializeManagers();
    }

    initializeManagers() {
        // Initialize each manager separately
        this.colorManager = new ColorManager();
        this.clientColors = this.colorManager.generateClientColors(this.projectTimelines);
        this.zoomManager = new TimelineZoom(this);
        this.positioner = new ProjectPositioner(this);
        this.filterManager = new FilterManager(this);
    }

    initialize() {
        this.initializeMarkers();
        this.setupProjectHandlers();
        this.initializeModalHandlers();
        this.colorManager.applyClientColors(this.projectTimelines, this.clientColors);

        // requestAnimationFrame(() => {
        //     this.positioner.processProjects();
        //     this.filterManager.adjustFilterSections();
        // });
    }

    initializeMarkers() {
        // Set initial positions for year and month markers
        this.allMarkers.forEach(marker => {
            marker.style.position = 'relative';
            if (marker.classList.contains('year-marker')) {
                const dot = marker.querySelector('.year-dot');
                if (dot) dot.style.top = '50%';
            }
        });

        // Position the present marker if it exists
        const presentMarker = document.querySelector('.present-marker');
        if (presentMarker) {
            const parentMarker = presentMarker.closest('.month-marker, .year-marker');
            if (parentMarker) {
                presentMarker.style.top = '50%';
            }
        }
    }

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

    showProjectDetails(timeline) {
        const modal = document.getElementById('projectModal');
        const projectData = this.extractProjectData(timeline);
        this.updateModalContent(modal, projectData);
        modal.style.display = 'block';
    }

    updateModalContent(modal, data) {
        modal.dataset.projectUrl = data.url;
        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalClient').textContent = data.client;
        document.getElementById('modalDates').textContent = data.dates;
        document.getElementById('modalDescription').textContent = data.description;

        // Skills Section
        const modalSkillsContainer = document.getElementById('modalSkills');
        modalSkillsContainer.innerHTML = ''; // Clear previous content

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

        // Categories Section
        const modalCategoriesContainer = document.getElementById('modalCategories');
        modalCategoriesContainer.innerHTML = ''; // Clear previous content

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

    // Update the extractProjectData method to include categories
    extractProjectData(timeline) {
        console.log('Skills dataset:', timeline.dataset.skills);
        console.log('Categories dataset:', timeline.dataset.categories);

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

    processProjects() {
        this.positioner.processProjects();
    }

    updateZoom(zoomLevel) {
        const newMonthHeight = this.monthHeight * zoomLevel;
        this.allMarkers.forEach(marker => {
            marker.style.height = `${newMonthHeight}px`;
        });
        this.processProjects();
    }

    resetPositions() {
        this.allMarkers.forEach(marker => {
            marker.style.height = `${this.monthHeight}px`;
        });
        this.positioner.resetPositions();
    }

    getMonthHeight() {
        return this.monthHeight;
    }

    getTotalHeight() {
        return this.allMarkers.length * this.monthHeight;
    }
}

// Source: _javascript/timeline/main.js
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
