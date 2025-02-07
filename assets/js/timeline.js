class FilterManager {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.activeClients = new Set();
        this.activeSkills = new Set();
        this.setupFilters();
    }

    setupFilters() {
        this.clientBtns = document.querySelectorAll('.client-btn');
        this.skillBtns = document.querySelectorAll('.skill-btn');
        this.resetBtn = document.getElementById('resetFilters');
        
        this.setupClientButtons();
        this.setupSkillButtons();
        this.setupResetButton();
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
        } else {
            btn.classList.add('active');
            this.activeSkills.add(skillName);
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

class ProjectPositioner {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.placedBoxes = [];
        this.BOX_WIDTH = 210;
        this.LANE_OFFSET = 15;
        this.CONTENT_PADDING = 5;
    }

    processProjects() {
        this.placedBoxes = [];
        const visibleProjects = this.getVisibleProjects();
        this.assignLanes(visibleProjects);
        
        requestAnimationFrame(() => {
            this.positionProjects(visibleProjects);
        });
    }

    getVisibleProjects() {
        return Array.from(this.manager.projectTimelines)
            .filter(timeline => timeline.style.display !== 'none')
            .map(timeline => {
                const dates = this.getProjectDates(timeline);
                const content = timeline.querySelector('.project-content');
                
                if (content) {
                    content.style.position = 'absolute';
                    content.style.width = `${this.BOX_WIDTH}px`;
                }
                
                return {
                    element: timeline,
                    ...dates,
                    lane: 0
                };
            })
            .sort((a, b) => a.startDate - b.startDate);
    }

    getProjectDates(timeline) {
        const datesText = timeline.querySelector('.project-dates').textContent;
        const [startStr, endStr] = datesText.split(' - ');
        const startDate = new Date(startStr);
        const endDate = endStr.trim() === 'Present' ? new Date() : new Date(endStr);
        
        return {
            startDate,
            endDate,
            startPos: this.getVerticalPosition(startDate),
            endPos: this.getVerticalPosition(endDate)
        };
    }

    getVerticalPosition(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const baseYearHeight = this.manager.yearHeight * this.manager.zoomManager.getCurrentZoom();
        const yearOffset = (year - this.manager.firstYear) * baseYearHeight;
        const monthOffset = (month / 12) * baseYearHeight;
        const dayOffset = (day / 30) * (baseYearHeight / 12);
        return yearOffset + monthOffset + dayOffset;
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
        return project1.startPos < project2.endPos && 
               project2.startPos < project1.endPos;
    }

    positionProjects(projects) {
        this.placedBoxes = [];
        
        projects.forEach(project => {
            this.positionProject(project, projects);
        });

        this.adjustContainerWidth();
    }

    positionProject(project, allProjects) {
        const timeline = project.element;
        const line = timeline.querySelector('.project-line');
        const content = timeline.querySelector('.project-content');

        this.positionTimeline(line, project);
        this.positionDots(line);

        if (content) {
            this.positionContent(content, project, allProjects);
        }
    }

    positionTimeline(line, project) {
        const horizontalOffset = project.lane * this.LANE_OFFSET - this.LANE_OFFSET;
        line.style.position = 'absolute';
        line.style.top = `${project.startPos}px`;
        line.style.height = `${project.endPos - project.startPos}px`;
        line.style.left = `${horizontalOffset}px`;
    }

    positionDots(line) {
        const startDot = line.querySelector('.start-dot');
        const endDot = line.querySelector('.end-dot');
        [startDot, endDot].forEach(dot => {
            dot.style.left = '-5px';
        });
        startDot.style.top = '0';
        endDot.style.top = '100%';
    }

    positionContent(content, project, allProjects) {
        const timelineCenter = project.startPos + (project.endPos - project.startPos) / 2;
        const contentHeight = content.offsetHeight + this.CONTENT_PADDING;
        const intendedTop = timelineCenter - contentHeight / 2 + this.CONTENT_PADDING;
        const baseContentOffset = (Math.max(...allProjects.map(p => p.lane)) + 1) * this.LANE_OFFSET - this.LANE_OFFSET;

        const position = this.findContentPosition(intendedTop, contentHeight, baseContentOffset);
        
        if (position) {
            content.style.left = `${position.left}px`;
            content.style.top = `${position.top}px`;
            this.placedBoxes.push(position);
        }
    }

    findContentPosition(intendedTop, contentHeight, baseContentOffset) {
        const overlappingBoxes = this.getOverlappingBoxes(intendedTop, contentHeight);
        const shiftStep = this.BOX_WIDTH + 2;

        for (let shift = 0; shift <= overlappingBoxes.length; shift++) {
            const candidateLeft = baseContentOffset + shift * shiftStep;
            if (!this.hasPositionConflict(candidateLeft, this.BOX_WIDTH, overlappingBoxes)) {
                return {
                    left: candidateLeft,
                    top: intendedTop,
                    right: candidateLeft + this.BOX_WIDTH,
                    bottom: intendedTop + contentHeight
                };
            }
        }
        return null;
    }

    getOverlappingBoxes(top, height) {
        return this.placedBoxes.filter(box => 
            (top < box.bottom) && (top + height > box.top)
        );
    }

    hasPositionConflict(left, width, overlappingBoxes) {
        return overlappingBoxes.some(box => 
            left < box.right && left + width > box.left
        );
    }

    adjustContainerWidth() {
        if (this.placedBoxes.length === 0) return;
        
        const maxRight = Math.max(...this.placedBoxes.map(box => box.right));
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.minWidth = `${maxRight + 20}px`;
    }

    resetPositions() {
        this.placedBoxes = [];
        this.manager.projectTimelines.forEach(timeline => {
            const content = timeline.querySelector('.project-content');
            if (content) {
                content.style.left = '';
                content.style.top = '';
            }
        });
        this.processProjects();
    }
}


// ColorManager class
class ColorManager {
    constructor() {
        this.colors = [
            '#E63946', // Imperial Red
            '#2A9D8F', // Persian Green
            '#264653', // Charcoal
            '#1ABC9C', // Turquoise
            '#F4A261', // Sandy Brown
            '#4A90E2', // Bright Blue
            '#8E44AD', // Wisteria
            '#27AE60', // Nephritis
            '#E67E22', // Carrot
            '#C0392B', // Pomegranate
            '#1ABC9C', // Turquoise
            '#F39C12', // Orange
            '#7D3C98', // Purple
            '#2ECC71', // Emerald
            '#E74C3C', // Alizarin
            '#3498DB'  // Peter River
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


class TimelineZoom {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.currentZoom = 1;
        this.ZOOM_STEP = 0.2;
        this.MIN_ZOOM = 0.5;
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
                this.resetZoom();
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
        this.currentZoom = 1;
        this.manager.updateZoom(this.currentZoom);
        this.manager.resetPositions();
    }

    getCurrentZoom() {
        return this.currentZoom;
    }
}

class TimelineManager {
    constructor() {
        this.yearHeight = 250;
        this.projectTimelines = document.querySelectorAll('.project-timeline');
        this.yearMarkers = document.querySelectorAll('.year-marker');
        this.firstYear = parseInt(this.yearMarkers[0].querySelector('.year-label').textContent);
        
        // Initialize managers
        this.colorManager = new ColorManager();
        this.clientColors = this.colorManager.generateClientColors(this.projectTimelines);
        this.zoomManager = new TimelineZoom(this);
        this.positioner = new ProjectPositioner(this);
        this.filterManager = new FilterManager(this);
    }

    initializeModalHandlers() {
        const modal = document.getElementById('projectModal');
        const closeBtn = modal.querySelector('.modal-close');
        const clickableArea = modal.querySelector('.modal-clickable');
    
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            modal.style.display = 'none';
        });
    
        clickableArea.addEventListener('click', (event) => {
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



    setupDottedLine() {
        const currentYearMarker = document.querySelector('.current-year');
        if (!currentYearMarker) {
            console.log('No current year marker found');
            return;
        }
    
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth(); // 0-11
            const currentDay = currentDate.getDate(); // 1-31
            const yearHeight = currentYearMarker.offsetHeight;
            const monthHeight = yearHeight / 12;
            const dayHeight = monthHeight / 31; // Approximate days in a month
            
            // Calculate where to start the dotted line
            const currentYearTop = currentYearMarker.offsetTop;
            const monthOffset = currentMonth * monthHeight;
            const dayOffset = currentDay * dayHeight;
            const startDottedLine = currentYearTop + monthOffset + dayOffset;
            
            // Set the CSS variable for both lines
            document.documentElement.style.setProperty('--dotted-line-start', `${startDottedLine}px`);
        } catch (e) {
            console.log('Error setting up dotted line:', e);
        }
    }

    initialize() {
        this.yearMarkers.forEach(marker => {
            marker.style.position = 'relative';
            const dot = marker.querySelector('.year-dot');
            dot.style.top = '0';
        });
    
        this.setupProjectHandlers();
        this.initializeModalHandlers();
        this.colorManager.applyClientColors(this.projectTimelines, this.clientColors);
        
        requestAnimationFrame(() => {
            this.positioner.processProjects();
            this.filterManager.adjustFilterSections();
        });
        this.setupDottedLine();
    }


    initializeLayout() {
        this.positioner.resetPositions();
        this.positioner.processProjects();
    }

    showProjectDetails(timeline) {
        const modal = document.getElementById('projectModal');
        const title = document.getElementById('modalTitle');
        const client = document.getElementById('modalClient');
        const dates = document.getElementById('modalDates');
        const description = document.getElementById('modalDescription');
        const skills = document.getElementById('modalSkills');
    
        // Get project data
        const projectTitle = timeline.querySelector('h3').textContent;
        const projectClient = timeline.querySelector('.project-client')?.textContent || '';
        const projectDates = timeline.querySelector('.project-dates')?.textContent || '';
        const projectSkills = timeline.dataset.skills?.split(',') || [];
        const projectDescription = timeline.dataset.description || 'No description available.';
        const projectUrl = timeline.dataset.url; // Get the URL from the timeline
    
        console.log('Project URL:', projectUrl); // Debug log
    
        // Store the project URL in the modal's dataset
        modal.dataset.projectUrl = projectUrl;
    
        // Update modal content
        title.textContent = projectTitle;
        client.textContent = projectClient;
        dates.textContent = projectDates;
        description.textContent = projectDescription;
        
        // Update skills
        skills.innerHTML = projectSkills
            .map(skill => `<span>${skill.trim()}</span>`)
            .join('');
    
        // Show modal
        modal.style.display = 'block';
    }

 

    adjustFilterSections() {
        // Count unique clients and skills
        const clientCount = new Set(Array.from(this.projectTimelines)
            .map(timeline => timeline.querySelector('.project-client')?.textContent)
            .filter(Boolean)).size;
    
        const skillCount = new Set(Array.from(this.projectTimelines)
            .map(timeline => timeline.dataset.skills?.split(',') || [])
            .flat()
            .filter(Boolean)).size;
    
        // Calculate proportions
        const total = clientCount + skillCount;
        const clientProportion = (clientCount / total) * 100;
        const skillsProportion = (skillCount / total) * 100;
    
        // Apply proportions to sections
        const clientSection = document.querySelector('.filter-group:nth-child(1)');
        const skillsSection = document.querySelector('.filter-group:nth-child(2)');
        
        if (clientSection && skillsSection) {
            clientSection.style.setProperty('--section-width', `${clientProportion}%`);
            skillsSection.style.setProperty('--section-width', `${skillsProportion}%`);
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

 

    getVerticalPosition(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const baseYearHeight = this.yearHeight * this.zoomManager.getCurrentZoom();
        const yearOffset = (year - this.firstYear) * baseYearHeight;
        const monthOffset = (month / 12) * baseYearHeight;
        const dayOffset = (day / 30) * (baseYearHeight / 12);
        return yearOffset + monthOffset + dayOffset;
    }


    positionProjects(projects) {
        // Clear existing positions
        this.placedBoxes = [];
        
        projects.forEach(project => {
            const timeline = project.element;
            const line = timeline.querySelector('.project-line');
            const content = timeline.querySelector('.project-content');
    
            // Position timeline
            const horizontalOffset = project.lane * 15-15;
            line.style.position = 'absolute';
            line.style.top = `${project.startPos}px`;
            line.style.height = `${project.endPos - project.startPos}px`;
            line.style.left = `${horizontalOffset}px`;
    
            // Position dots
            const startDot = line.querySelector('.start-dot');
            const endDot = line.querySelector('.end-dot');
            startDot.style.top = '0';
            endDot.style.top = '100%';
            startDot.style.left = '-5px';
            endDot.style.left = '-5px';
    
            // Position content box
            if (content) {
                content.style.position = 'absolute';
                content.style.width = '210px';
    
                const timelineCenter = project.startPos + (project.endPos - project.startPos) / 2;
                const contentHeight = content.offsetHeight + 5;
                const intendedTop = timelineCenter - contentHeight / 2 + 5;
    
                const baseContentOffset = (Math.max(...projects.map(p => p.lane)) + 1) * 15-15;
                
                // Modified overlap detection
                const overlappingBoxes = this.placedBoxes.filter(box => {
                    const verticalOverlap = (intendedTop < box.bottom) && (intendedTop + contentHeight > box.top);
                    return verticalOverlap;
                });
    
                const boxWidth = 210;
                const shiftStep = boxWidth + 2;
                let finalPosition = null;
    
                // Try positions until no overlap
                for (let shift = 0; shift <= overlappingBoxes.length; shift++) {
                    const candidateLeft = baseContentOffset + shift * shiftStep;
                    let hasConflict = false;
    
                    for (const box of overlappingBoxes) {
                        if (candidateLeft < box.right && candidateLeft + boxWidth > box.left) {
                            hasConflict = true;
                            break;
                        }
                    }
    
                    if (!hasConflict) {
                        finalPosition = {
                            left: candidateLeft,
                            top: intendedTop,
                            right: candidateLeft + boxWidth,
                            bottom: intendedTop + contentHeight
                        };
                        break;
                    }
                }
    
                if (finalPosition) {
                    content.style.left = `${finalPosition.left}px`;
                    content.style.top = `${finalPosition.top}px`;
                    this.placedBoxes.push(finalPosition);
                }
            }
        });
    
        // Adjust container width
        const maxRight = Math.max(...this.placedBoxes.map(box => box.right));
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.minWidth = `${maxRight + 20}px`;
    }

    processProjects() {
        this.positioner.processProjects();
    }

    // Update zoom handling
    updateZoom(zoomLevel) {
        const newYearHeight = this.yearHeight * zoomLevel;
        this.yearMarkers.forEach(marker => {
            marker.style.height = `${newYearHeight}px`;
        });
        this.positioner.processProjects();
    }

    resetPositions() {
        this.positioner.resetPositions();
    }


    getYearHeight() {
        return this.yearHeight;
    }

    
}

document.addEventListener('DOMContentLoaded', function() {
    const timeline = new TimelineManager();
    timeline.initialize();
});

