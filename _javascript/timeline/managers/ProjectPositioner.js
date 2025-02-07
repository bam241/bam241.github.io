class ProjectPositioner {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.placedBoxes = [];
        this.BOX_WIDTH = 220;
        this.LANE_SPACING = 15;
        this.BASE_OFFSET = 20;
        this.MONTH_HEIGHT = 40;
        this.BOX_SPACING = 5;
        this.CONTENT_OFFSET = 10; // Space between timeline end and content
        
        const firstMarker = document.querySelector('.year-marker, .month-marker');
        this.timelineOffset = firstMarker ? firstMarker.getBoundingClientRect().top : 0;
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
        const datesText = timeline.querySelector('.project-dates').textContent;
        const [startStr, endStr] = datesText.split(' - ');
        const startDate = new Date(startStr);
        const endDate = endStr.trim() === 'Present' ? new Date() : new Date(endStr);
        
        return {
            startDate,
            endDate,
            startPos: this.calculatePosition(startDate),
            endPos: this.calculatePosition(endDate)
        };
    }

    calculatePosition(date) {
        const zoomLevel = this.manager.zoomManager.getCurrentZoom();
        
        // Get the first marker to determine our starting point
        const firstMarker = document.querySelector('.year-marker, .month-marker');
        const startYear = parseInt(firstMarker.dataset.year);
        const startMonth = parseInt(firstMarker.dataset.month) - 1; // Convert to 0-based month
        
        // Calculate months since start
        const yearDiff = date.getFullYear() - startYear;
        const monthDiff = date.getMonth() - startMonth;
        const totalMonths = (yearDiff * 12) + monthDiff - 1;
        
        // Calculate day position within month
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const dayProgress = (date.getDate() - 1) / daysInMonth;
        
        // Calculate final position
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

    positionAllProjects(projects) {
        this.placedBoxes = [];
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.position = 'relative';
        projectsContainer.style.top = `${Math.abs(this.timelineOffset)}px`;

        // Calculate the maximum timeline width
        const maxLane = Math.max(...projects.map(p => p.lane));
        this.timelinesWidth = this.BASE_OFFSET + ((maxLane + 1) * this.LANE_SPACING);

        // Sort projects by start position and lane
        const sortedProjects = [...projects].sort((a, b) => {
            if (Math.abs(a.startPos - b.startPos) < 50) {
                return a.lane - b.lane;
            }
            return a.startPos - b.startPos;
        });

        sortedProjects.forEach(project => this.positionProject(project));
        this.adjustContainerWidth(projects);
    }


    positionProject(project) {
        const timeline = project.element;
        const line = timeline.querySelector('.project-line');
        const content = timeline.querySelector('.project-content');
        
        const horizontalPos = this.BASE_OFFSET + (project.lane * this.LANE_SPACING);
        
        // Position the line
        if (line) {
            line.style.position = 'absolute';
            line.style.left = `${horizontalPos}px`;
            line.style.top = `${project.startPos}px`;
            line.style.height = `${Math.max(project.endPos - project.startPos, 2)}px`;
        }
        
        // Position the content box
        if (content) {
            content.style.position = 'absolute';
            const contentHeight = content.offsetHeight || 0;
            const verticalCenter = project.startPos + (project.endPos - project.startPos) / 2;
            const contentTop = verticalCenter - (contentHeight / 2);
            
            // Start positioning from the end of all timelines
            let contentLeft = this.timelinesWidth + this.CONTENT_OFFSET;
            
            // Check for overlaps and adjust position
            while (this.checkContentOverlap(contentLeft, contentTop, contentHeight)) {
                contentLeft += this.BOX_WIDTH + this.BOX_SPACING;
            }
            
            content.style.left = `${contentLeft}px`;
            content.style.top = `${contentTop}px`;
            
            this.placedBoxes.push({
                left: contentLeft,
                right: contentLeft + this.BOX_WIDTH,
                top: contentTop,
                bottom: contentTop + contentHeight
            });
        }
    }

    checkContentOverlap(left, top, height) {
        return this.placedBoxes.some(box => {
            const verticalOverlap = top < box.bottom && (top + height) > box.top;
            const horizontalOverlap = left < box.right && (left + this.BOX_WIDTH) > box.left;
            return verticalOverlap && horizontalOverlap;
        });
    }

    adjustContainerWidth(projects) {
        if (projects.length === 0) return;
        
        const maxRight = Math.max(
            ...this.placedBoxes.map(box => box.right),
            this.BASE_OFFSET + 
            (Math.max(...projects.map(p => p.lane)) + 1) * this.LANE_SPACING + 
            this.BOX_WIDTH
        );
        
        const container = document.querySelector('.projects-container');
        container.style.minWidth = `${maxRight + 40}px`;
    }

    resetPositions() {
        this.placedBoxes = [];
        this.manager.projectTimelines.forEach(timeline => {
            const content = timeline.querySelector('.project-content');
            const line = timeline.querySelector('.project-line');
            
            if (content) {
                content.style.left = '';
                content.style.top = '';
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