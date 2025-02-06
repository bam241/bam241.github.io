export class TimelineZoom {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.setupZoomControls();
    }

    setupZoomControls() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const resetZoom = document.getElementById('resetZoom');

        zoomIn.addEventListener('click', () => 
            this.applyZoom(this.manager.currentZoom + this.manager.config.ZOOM.STEP));
        
        zoomOut.addEventListener('click', () => 
            this.applyZoom(this.manager.currentZoom - this.manager.config.ZOOM.STEP));
        
        resetZoom.addEventListener('click', () => this.resetZoom());
    }

    applyZoom(newZoom) {
        this.manager.currentZoom = Math.min(
            Math.max(newZoom, this.manager.config.ZOOM.MIN), 
            this.manager.config.ZOOM.MAX
        );
        
        const newYearHeight = this.manager.yearHeight * this.manager.currentZoom;
        this.manager.yearMarkers.forEach(marker => {
            marker.style.height = `${newYearHeight}px`;
        });

        this.manager.processProjects();
    }

    resetZoom() {
        this.manager.currentZoom = this.manager.config.ZOOM.DEFAULT;
        
        this.manager.yearMarkers.forEach(marker => {
            marker.style.height = `${this.manager.yearHeight}px`;
        });

        this.manager.positioning.placedBoxes = [];
        this.manager.projectTimelines.forEach(timeline => {
            const content = timeline.querySelector('.project-content');
            if (content) {
                content.style.left = '';
                content.style.top = '';
            }
        });

        requestAnimationFrame(() => {
            this.manager.processProjects();
        });
    }
}