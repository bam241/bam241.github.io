const DOMUtils = {
    setupDottedLine() {
        const currentYearMarker = document.querySelector('.current-year');
        if (!currentYearMarker) {
            console.log('No current year marker found');
            return;
        }
    
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentDay = currentDate.getDate();
            const yearHeight = currentYearMarker.offsetHeight;
            const monthHeight = yearHeight / 12;
            const dayHeight = monthHeight / 31;
            
            const currentYearTop = currentYearMarker.offsetTop;
            const monthOffset = currentMonth * monthHeight;
            const dayOffset = currentDay * dayHeight;
            const startDottedLine = currentYearTop + monthOffset + dayOffset;
            
            document.documentElement.style.setProperty('--dotted-line-start', `${startDottedLine}px`);
        } catch (e) {
            console.log('Error setting up dotted line:', e);
        }
    }
};