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
        
        requestAnimationFrame(() => {
            this.positioner.processProjects();
            this.filterManager.adjustFilterSections();
        });
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
            skills: timeline.dataset.skills ? timeline.dataset.skills.split(',').filter(skill => skill.trim() !== '') : [],
            categories: timeline.dataset.categories ? timeline.dataset.categories.split(',').filter(category => category.trim() !== '') : [],
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