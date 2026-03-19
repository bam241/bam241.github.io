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