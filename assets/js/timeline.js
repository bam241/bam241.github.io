class TimelineManager {
    constructor() {
        this.yearHeight = 250;
        this.projectTimelines = document.querySelectorAll('.project-timeline');
        this.yearMarkers = document.querySelectorAll('.year-marker');
        this.firstYear = parseInt(this.yearMarkers[0].querySelector('.year-label').textContent);
        this.placedBoxes = [];
        this.currentZoom = 1;
        this.ZOOM_STEP = 0.2;
        this.MIN_ZOOM = 0.5;
        this.MAX_ZOOM = 2;

        this.activeClients = new Set();
        this.activeSkills = new Set();
        this.clientColors = this.generateClientColors(); // Add this line
        this.initializeFilters();

    }


    // Add this helper method to convert hex colors to RGB
    hexToRGB(hex) {
        // Remove the # if present
        hex = hex.replace('#', '');
        
        // Convert 3-digit hex to 6-digit
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        // Convert to RGB
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return { r, g, b };
    }

    generateClientColors() {
        const colors = [
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
        
        const clientColors = {};
        const clients = new Set();

        
        
        // Collect all clients
        this.projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            if (clientText) {
                const clientName = clientText.replace('Client:', '').trim();
                clients.add(clientName);
            }
        });

        // Assign colors to clients
        Array.from(clients).sort().forEach((client, index) => {
            clientColors[client] = colors[index % colors.length];
        });

        return clientColors;
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

    applyClientColors() {
        this.projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            const clientName = clientText.replace('Client:', '').trim();
            const color = this.clientColors[clientName];
            
            if (color) {
                // Convert hex to RGB and add transparency
                const rgbColor = this.hexToRGB(color);
                
                const content = timeline.querySelector('.project-content');
                if (content) {
                    content.style.borderLeft = `4px solid ${color}`;
                    // Remove this line or modify it for dark mode compatibility
                    // content.style.backgroundColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.1)`;
                    
                    // Add data attribute for the client color
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
    
        document.querySelectorAll('.client-btn').forEach(btn => {
            const clientName = btn.dataset.client;
            const color = this.clientColors[clientName];
            if (color && clientName) {
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
        });
    }

    initialize() {
        // Initialize year dots
        this.yearMarkers.forEach(marker => {
            marker.style.position = 'relative';
            const dot = marker.querySelector('.year-dot');
            dot.style.top = '0';
        });
    
        // Initialize zoom controls
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const resetZoom = document.getElementById('resetZoom');
    
        zoomIn.addEventListener('click', () => this.applyZoom(this.currentZoom + this.ZOOM_STEP));
        zoomOut.addEventListener('click', () => this.applyZoom(this.currentZoom - this.ZOOM_STEP));
        resetZoom.addEventListener('click', () => {
            // Reset zoom state
            this.currentZoom = 1;
            
            // Reset year marker heights
            this.yearMarkers.forEach(marker => {
                marker.style.height = `${this.yearHeight}px`;
            });
    
            // Clear all positions
            this.placedBoxes = [];
            this.projectTimelines.forEach(timeline => {
                const content = timeline.querySelector('.project-content');
                if (content) {
                    content.style.left = '';
                    content.style.top = '';
                }
            });
    
            // Reposition everything
            requestAnimationFrame(() => {
                this.processProjects();
            });
        });
    
        // Update project click handlers
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

        // Add modal close handler
        const modal = document.getElementById('projectModal');
        const closeBtn = modal.querySelector('.modal-close');
        const clickableArea = modal.querySelector('.modal-clickable');

        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event from bubbling to modal
            modal.style.display = 'none';
        });

        clickableArea.addEventListener('click', (event) => {
            const projectUrl = modal.dataset.projectUrl;
            if (projectUrl) {
                window.location.href = projectUrl;
            }
        });

        // Close modal when clicking outside the content
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    
        // Initialize colors and layout
        this.applyClientColors();
        
        // Initial positioning
        requestAnimationFrame(() => {
            this.processProjects();
            this.adjustFilterSections();
        });
        this.setupDottedLine();

    }
    
    initializeLayout() {
        // Clear any existing positions
        this.placedBoxes = [];
        
        // Reset all project positions first
        this.projectTimelines.forEach(timeline => {
            const content = timeline.querySelector('.project-content');
            if (content) {
                content.style.width = '210px';
                content.style.position = 'absolute';
            }
        });
    
        // Force reflow
        document.body.offsetHeight;
    
        // Process projects with clean slate
        this.processProjects();
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

    
    processProjects() {
        // Clear existing positions
        this.placedBoxes = [];
    
        // Get visible projects and their positions
        const visibleProjects = Array.from(this.projectTimelines)
            .filter(timeline => timeline.style.display !== 'none')
            .map(timeline => {
                const datesText = timeline.querySelector('.project-dates').textContent;
                const [startStr, endStr] = datesText.split(' - ');
                const startDate = new Date(startStr);
                const endDate = endStr.trim() === 'Present' ? new Date() : new Date(endStr);
                
                // Reset content box position
                const content = timeline.querySelector('.project-content');
                if (content) {
                    content.style.position = 'absolute';
                    content.style.width = '210px';
                }
                
                return {
                    element: timeline,
                    startDate,
                    endDate,
                    startPos: this.getVerticalPosition(startDate),
                    endPos: this.getVerticalPosition(endDate),
                    lane: 0
                };
            });
    
        // Sort by start date
        visibleProjects.sort((a, b) => a.startDate - b.startDate);
    
        // Assign lanes
        visibleProjects.forEach((project, i) => {
            for (let j = 0; j < i; j++) {
                if (project.startPos < visibleProjects[j].endPos && 
                    visibleProjects[j].startPos < project.endPos) {
                    project.lane = Math.max(project.lane, visibleProjects[j].lane + 1);
                }
            }
        });
    
        // Position all projects
        requestAnimationFrame(() => {
            this.positionProjects(visibleProjects);
        });
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

    initializeFilters() {
        const clientBtns = document.querySelectorAll('.client-btn');
        const skillBtns = document.querySelectorAll('.skill-btn');
        const resetBtn = document.getElementById('resetFilters');
    
        // Client button handlers
        clientBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientName = btn.dataset.client;
                if (!clientName) {
                    this.activeClients.clear();
                    clientBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                } else {
                    document.querySelector('.client-btn[data-client=""]')?.classList.remove('active');
                    
                    if (btn.classList.contains('active')) {
                        btn.classList.remove('active');
                        this.activeClients.delete(clientName);
                    } else {
                        btn.classList.add('active');
                        this.activeClients.add(clientName);
                    }
                }
                this.applyFilters();
            });
        });
    
        // Skill button handlers
        skillBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skillName = btn.dataset.skill;
                if (!skillName) {
                    this.activeSkills.clear();
                    skillBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                } else {
                    document.querySelector('.skill-btn[data-skill=""]')?.classList.remove('active');
                    
                    if (btn.classList.contains('active')) {
                        btn.classList.remove('active');
                        this.activeSkills.delete(skillName);
                    } else {
                        btn.classList.add('active');
                        this.activeSkills.add(skillName);
                    }
                }
                this.applyFilters();
            });
        });
    
        // Reset button handler
        resetBtn?.addEventListener('click', () => {
            this.activeClients.clear();
            this.activeSkills.clear();
            
            clientBtns.forEach(btn => btn.classList.remove('active'));
            skillBtns.forEach(btn => btn.classList.remove('active'));
            
            document.querySelector('.client-btn[data-client=""]')?.classList.add('active');
            document.querySelector('.skill-btn[data-skill=""]')?.classList.add('active');
            
            this.projectTimelines.forEach(timeline => {
                timeline.style.display = '';
            });
    
            this.processProjects();
        });
    }
    

    applyFilters() {
        this.projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            const skills = timeline.dataset.skills?.split(',') || [];
            
            // If no filters are active, show all
            const showDueToNoFilters = this.activeClients.size === 0 && this.activeSkills.size === 0;
            
            // Check if matches any active client filter
            const clientMatch = showDueToNoFilters || 
                this.activeClients.size === 0 || 
                Array.from(this.activeClients).some(client => clientText.includes(client));
            
            // Check if matches any active skill filter
            const skillMatch = showDueToNoFilters || 
                this.activeSkills.size === 0 || 
                Array.from(this.activeSkills).some(skill => skills.includes(skill));
            
            timeline.style.display = (clientMatch && skillMatch) ? '' : 'none';
        });

        // Recalculate positions
        this.processProjects();
    }

    getVerticalPosition(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const baseYearHeight = this.yearHeight * this.currentZoom;
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

    applyZoom(newZoom) {
        this.currentZoom = Math.min(Math.max(newZoom, this.MIN_ZOOM), this.MAX_ZOOM);
        const newYearHeight = this.yearHeight * this.currentZoom;

        // Update year markers height
        this.yearMarkers.forEach(marker => {
            marker.style.height = `${newYearHeight}px`;
        });

        // Recalculate and reposition all projects
        this.processProjects();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const timeline = new TimelineManager();
    timeline.initialize();
});
