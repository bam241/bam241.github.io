export class ColorManager {
    constructor() {
        this.colors = [
            '#E63946', '#2A9D8F', '#264653', '#1ABC9C',
            '#F4A261', '#4A90E2', '#8E44AD', '#27AE60',
            '#E67E22', '#C0392B', '#1ABC9C', '#F39C12',
            '#7D3C98', '#2ECC71', '#E74C3C', '#3498DB'
        ];
    }

    hexToRGB(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    generateClientColors(projectTimelines) {
        const clientColors = {};
        const clients = new Set();
        
        projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            if (clientText) {
                const clientName = clientText.replace('Client:', '').trim();
                clients.add(clientName);
            }
        });

        Array.from(clients).sort().forEach((client, index) => {
            clientColors[client] = this.colors[index % this.colors.length];
        });

        return clientColors;
    }

    applyClientColors(projectTimelines, clientColors) {
        this.applyTimelineColors(projectTimelines, clientColors);
        this.applyButtonColors(clientColors);
    }

    applyTimelineColors(projectTimelines, clientColors) {
        projectTimelines.forEach(timeline => {
            const clientText = timeline.querySelector('.project-client')?.textContent || '';
            const clientName = clientText.replace('Client:', '').trim();
            const color = clientColors[clientName];
            
            if (color) {
                this.applyColorToElements(timeline, color);
            }
        });
    }

    applyColorToElements(timeline, color) {
        const content = timeline.querySelector('.project-content');
        if (content) {
            content.style.borderLeft = `4px solid ${color}`;
            content.dataset.clientColor = color;
        }

        const line = timeline.querySelector('.project-line');
        if (line) {
            line.style.backgroundColor = color;
            line.style.setProperty('--timeline-color', color);
        }

        const dots = timeline.querySelectorAll('.project-dot');
        dots.forEach(dot => {
            dot.style.borderColor = color;
        });
    }

    applyButtonColors(clientColors) {
        document.querySelectorAll('.client-btn').forEach(btn => {
            const clientName = btn.dataset.client;
            const color = clientColors[clientName];
            if (color && clientName) {
                this.setupClientButton(btn, color);
            }
        });
    }

    setupClientButton(btn, color) {
        btn.style.borderColor = color;
        btn.style.borderWidth = '2px';
        
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = color;
            btn.style.color = '#fff';
        });
        
        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('active')) {
                btn.style.backgroundColor = 'var(--sidebar-bg)';
                btn.style.color = 'var(--text-color)';
            }
        });
    }
}