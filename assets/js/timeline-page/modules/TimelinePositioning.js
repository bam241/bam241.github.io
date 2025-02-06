export class TimelinePositioning {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.placedBoxes = [];
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
                    content.style.width = '210px';
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
        const baseYearHeight = this.manager.yearHeight * this.manager.currentZoom;
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
        const horizontalOffset = project.lane * 15-15;
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
        const contentHeight = content.offsetHeight + 5;
        const intendedTop = timelineCenter - contentHeight / 2 + 5;
        const baseContentOffset = (Math.max(...allProjects.map(p => p.lane)) + 1) * 15-15;

        const position = this.findContentPosition(intendedTop, contentHeight, baseContentOffset);
        
        if (position) {
            content.style.left = `${position.left}px`;
            content.style.top = `${position.top}px`;
            this.placedBoxes.push(position);
        }
    }

    findContentPosition(intendedTop, contentHeight, baseContentOffset) {
        const boxWidth = 210;
        const shiftStep = boxWidth + 2;
        const overlappingBoxes = this.getOverlappingBoxes(intendedTop, contentHeight);

        for (let shift = 0; shift <= overlappingBoxes.length; shift++) {
            const candidateLeft = baseContentOffset + shift * shiftStep;
            if (!this.hasPositionConflict(candidateLeft, boxWidth, overlappingBoxes)) {
                return {
                    left: candidateLeft,
                    top: intendedTop,
                    right: candidateLeft + boxWidth,
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
        const maxRight = Math.max(...this.placedBoxes.map(box => box.right));
        const projectsContainer = document.querySelector('.projects-container');
        projectsContainer.style.minWidth = `${maxRight + 20}px`;
    }
}