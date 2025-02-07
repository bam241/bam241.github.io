import { ColorManager } from './managers/ColorManager.js';
import { FilterManager } from './managers/FilterManager.js';
import { ProjectPositioner } from './managers/ProjectPositioner.js';
import { TimelineZoom } from './managers/ZoomManager.js';
import { DOMUtils } from './utils/DOMUtils.js';

export class TimelineManager {
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

    initialize() {
        this.initializeYearDots();
        this.setupProjectHandlers();
        this.initializeModalHandlers();
        this.colorManager.applyClientColors(this.projectTimelines, this.clientColors);
        
        requestAnimationFrame(() => {
            this.positioner.processProjects();
            this.filterManager.adjustFilterSections();
        });
        DOMUtils.setupDottedLine();
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

    extractProjectData(timeline) {
        return {
            title: timeline.querySelector('h3').textContent,
            client: timeline.querySelector('.project-client')?.textContent || '',
            dates: timeline.querySelector('.project-dates')?.textContent || '',
            skills: timeline.dataset.skills?.split(',') || [],
            description: timeline.dataset.description || 'No description available.',
            url: timeline.dataset.url
        };
    }

    updateModalContent(modal, data) {
        modal.dataset.projectUrl = data.url;
        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalClient').textContent = data.client;
        document.getElementById('modalDates').textContent = data.dates;
        document.getElementById('modalDescription').textContent = data.description;
        document.getElementById('modalSkills').innerHTML = 
            data.skills.map(skill => `<span>${skill.trim()}</span>`).join('');
    }

    processProjects() {
        this.positioner.processProjects();
    }

    updateZoom(zoomLevel) {
        const newYearHeight = this.yearHeight * zoomLevel;
        this.yearMarkers.forEach(marker => {
            marker.style.height = `${newYearHeight}px`;
        });
        this.processProjects();
    }

    resetPositions() {
        this.positioner.resetPositions();
    }

    getYearHeight() {
        return this.yearHeight;
    }
}