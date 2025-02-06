export class TimelineModal {
    constructor() {
        this.modal = document.getElementById('projectModal');
        this.setupModalHandlers();
    }

    setupModalHandlers() {
        const closeBtn = this.modal.querySelector('.modal-close');
        const clickableArea = this.modal.querySelector('.modal-clickable');

        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            this.hideModal();
        });

        clickableArea.addEventListener('click', () => {
            const projectUrl = this.modal.dataset.projectUrl;
            if (projectUrl) {
                window.location.href = projectUrl;
            }
        });

        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hideModal();
            }
        });
    }

    showProjectDetails(timeline) {
        const projectData = this.extractProjectData(timeline);
        this.updateModalContent(projectData);
        this.showModal();
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

    updateModalContent(data) {
        this.modal.dataset.projectUrl = data.url;
        
        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalClient').textContent = data.client;
        document.getElementById('modalDates').textContent = data.dates;
        document.getElementById('modalDescription').textContent = data.description;
        
        document.getElementById('modalSkills').innerHTML = 
            data.skills.map(skill => `<span>${skill.trim()}</span>`).join('');
    }

    showModal() {
        this.modal.style.display = 'block';
    }

    hideModal() {
        this.modal.style.display = 'none';
    }
}