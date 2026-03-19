class TimelineZoom {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.currentZoom = 1;
        this.ZOOM_STEP = 0.2;
        this.MIN_ZOOM = 0.2;
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

    fitToScreen() {
        const markers = document.querySelectorAll('.year-marker, .month-marker');
        if (!markers.length) return;

        const topbar = document.getElementById('topbar-wrapper');
        const filterMenu = document.querySelector('.bottom-filter-menu');
        const topbarHeight = topbar ? topbar.offsetHeight : 60;
        const filterHeight = filterMenu ? filterMenu.offsetHeight : 60;
        const availableHeight = window.innerHeight - topbarHeight - filterHeight - 40;

        const totalHeight = markers.length * this.manager.monthHeight;
        const fitZoom = availableHeight / totalHeight;
        const clampedZoom = Math.min(Math.max(fitZoom, this.MIN_ZOOM), this.MAX_ZOOM);

        this.applyZoom(clampedZoom);

        // Reprocess after zoom with correct dimensions
        requestAnimationFrame(() => {
            this.manager.positioner.processProjects();
            this.manager.filterManager.adjustFilterSections();
        });
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
                this.fitToScreen();
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
        this.fitToScreen();
    }

    getCurrentZoom() {
        return this.currentZoom;
    }
}