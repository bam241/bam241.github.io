export class TimelineFilters {
    constructor(timelineManager) {
        this.manager = timelineManager;
        this.activeClients = new Set();
        this.activeSkills = new Set();
    }

    initialize() {
        this.setupFilterButtons();
        this.setupResetButton();
    }

    setupFilterButtons() {
        const clientBtns = document.querySelectorAll('.client-btn');
        const skillBtns = document.querySelectorAll('.skill-btn');

        clientBtns.forEach(btn => this.setupClientButton(btn));
        skillBtns.forEach(btn => this.setupSkillButton(btn));
    }

    setupClientButton(btn) {
        btn.addEventListener('click', () => {
            const clientName = btn.dataset.client;
            if (!clientName) {
                this.clearClientFilters(btn);
            } else {
                this.toggleClientFilter(btn, clientName);
            }
            this.applyFilters();
        });
    }

    setupSkillButton(btn) {
        btn.addEventListener('click', () => {
            const skillName = btn.dataset.skill;
            if (!skillName) {
                this.clearSkillFilters(btn);
            } else {
                this.toggleSkillFilter(btn, skillName);
            }
            this.applyFilters();
        });
    }

    clearClientFilters(btn) {
        this.activeClients.clear();
        document.querySelectorAll('.client-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    clearSkillFilters(btn) {
        this.activeSkills.clear();
        document.querySelectorAll('.skill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    toggleClientFilter(btn, clientName) {
        document.querySelector('.client-btn[data-client=""]')?.classList.remove('active');
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            this.activeClients.delete(clientName);
        } else {
            btn.classList.add('active');
            this.activeClients.add(clientName);
        }
    }

    toggleSkillFilter(btn, skillName) {
        document.querySelector('.skill-btn[data-skill=""]')?.classList.remove('active');
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            this.activeSkills.delete(skillName);
        } else {
            btn.classList.add('active');
            this.activeSkills.add(skillName);
        }
    }

    setupResetButton() {
        const resetBtn = document.getElementById('resetFilters');
        resetBtn?.addEventListener('click', () => this.resetFilters());
    }

    resetFilters() {
        this.activeClients.clear();
        this.activeSkills.clear();
        
        document.querySelectorAll('.client-btn, .skill-btn').forEach(btn => 
            btn.classList.remove('active'));
        
        document.querySelector('.client-btn[data-client=""]')?.classList.add('active');
        document.querySelector('.skill-btn[data-skill=""]')?.classList.add('active');
        
        this.manager.projectTimelines.forEach(timeline => {
            timeline.style.display = '';
        });

        this.manager.processProjects();
    }

    applyFilters() {
        this.manager.projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            const skills = timeline.dataset.skills?.split(',') || [];
            
            const showDueToNoFilters = this.activeClients.size === 0 && 
                                     this.activeSkills.size === 0;
            
            const clientMatch = showDueToNoFilters || 
                this.activeClients.size === 0 || 
                Array.from(this.activeClients).some(client => clientText.includes(client));
            
            const skillMatch = showDueToNoFilters || 
                this.activeSkills.size === 0 || 
                Array.from(this.activeSkills).some(skill => skills.includes(skill));
            
            timeline.style.display = (clientMatch && skillMatch) ? '' : 'none';
        });

        this.manager.processProjects();
    }

    adjustFilterSections() {
        const clientCount = new Set(Array.from(this.manager.projectTimelines)
            .map(timeline => timeline.querySelector('.project-client')?.textContent)
            .filter(Boolean)).size;

        const skillCount = new Set(Array.from(this.manager.projectTimelines)
            .map(timeline => timeline.dataset.skills?.split(',') || [])
            .flat()
            .filter(Boolean)).size;

        const total = clientCount + skillCount;
        const clientProportion = (clientCount / total) * 100;
        const skillsProportion = (skillCount / total) * 100;

        const clientSection = document.querySelector('.filter-group:nth-child(1)');
        const skillsSection = document.querySelector('.filter-group:nth-child(2)');
        
        if (clientSection && skillsSection) {
            clientSection.style.setProperty('--section-width', `${clientProportion}%`);
            skillsSection.style.setProperty('--section-width', `${skillsProportion}%`);
        }
    }
}