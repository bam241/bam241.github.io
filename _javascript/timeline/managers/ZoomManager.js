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

        this.setupZoomHandlers(zoomIn, zoomOut, resetZoom);
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