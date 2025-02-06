import { TimelineConfig } from './config/timeline-config.js';
import { TimelineColors } from './modules/TimelineColors.js';
import { TimelineFilters } from './modules/TimelineFilters.js';
import { TimelineModal } from './modules/TimelineModal.js';
import { TimelinePositioning } from './modules/TimelinePositioning.js';
import { TimelineZoom } from './modules/TimelineZoom.js';

export class TimelineManager {
    constructor() {
        this.initializeProperties();
        this.initializeModules();
    }

    initializeProperties() {
        this.config = TimelineConfig;
        this.yearHeight = this.config.YEAR_HEIGHT;
        this.currentZoom = this.config.ZOOM.DEFAULT;
        this.projectTimelines = document.querySelectorAll('.project-timeline');
        this.yearMarkers = document.querySelectorAll('.year-marker');
        this.firstYear = this.getFirstYear();
        this.clientColors = TimelineColors.generateClientColors(
            this.projectTimelines, 
            this.config.CLIENT_COLORS
        );
    }

    initializeModules() {
        this.filters = new TimelineFilters(this);
        this.modal = new TimelineModal();
        this.positioning = new TimelinePositioning(this);
        this.zoom = new TimelineZoom(this);
    }

    initialize() {
        this.initializeYearDots();
        this.setupProjectHandlers();
        this.setupDottedLine();
        
        TimelineColors.applyColors(this.projectTimelines, this.clientColors);
        this.filters.initialize();
        
        requestAnimationFrame(() => {
            this.positioning.processProjects();
            this.filters.adjustFilterSections();
        });
    }

    getFirstYear() {
        return parseInt(this.yearMarkers[0].querySelector('.year-label').textContent);
    }

    initializeYearDots() {
        this.yearMarkers.forEach(marker => {
            marker.style.position = 'relative';
            const dot = marker.querySelector('.year-dot');
            if (dot) dot.style.top = '0';
        });
    }

    setupProjectHandlers() {
        this.projectTimelines.forEach(timeline => {
            const content = timeline.querySelector('.project-content');
            const line = timeline.querySelector('.project-line');
            
            const clickHandler = (event) => {
                event.preventDefault();
                this.modal.showProjectDetails(timeline);
            };

            [content, line].forEach(element => {
                if (element) {
                    element.style.cursor = 'pointer';
                    element.addEventListener('click', clickHandler);
                }
            });
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
            const yearHeight = currentYearMarker.offsetHeight;
            const monthHeight = yearHeight / 12;
            const dayHeight = monthHeight / 31;
            
            const currentYearTop = currentYearMarker.offsetTop;
            const monthOffset = currentDate.getMonth() * monthHeight;
            const dayOffset = currentDate.getDate() * dayHeight;
            const startDottedLine = currentYearTop + monthOffset + dayOffset;
            
            document.documentElement.style.setProperty('--dotted-line-start', `${startDottedLine}px`);
        } catch (e) {
            console.error('Error setting up dotted line:', e);
        }
    }

    processProjects() {
        this.positioning.processProjects();
    }
}