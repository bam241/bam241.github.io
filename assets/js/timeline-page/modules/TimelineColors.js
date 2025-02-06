export class TimelineColors {
    static hexToRGB(hex) {
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

    static generateClientColors(projectTimelines, colors) {
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
            clientColors[client] = colors[index % colors.length];
        });

        return clientColors;
    }

    static applyColors(projectTimelines, clientColors) {
        this.applyTimelineColors(projectTimelines, clientColors);
        this.applyButtonColors(clientColors);
    }

    static applyTimelineColors(projectTimelines, clientColors) {
        projectTimelines.forEach(timeline => {
            const clientName = this.getClientName(timeline);
            const color = clientColors[clientName];
            if (color) {
                this.applyColorToTimeline(timeline, color);
            }
        });
    }

    static getClientName(timeline) {
        const clientText = timeline.querySelector('.project-client')?.textContent || '';
        return clientText.replace('Client:', '').trim();
    }

    static applyColorToTimeline(timeline, color) {
        // Apply to content
        const content = timeline.querySelector('.project-content');
        if (content) {
            content.style.borderLeft = `4px solid ${color}`;
            content.dataset.clientColor = color;
        }

        // Apply to line
        const line = timeline.querySelector('.project-line');
        if (line) {
            line.style.backgroundColor = color;
            line.style.setProperty('--timeline-color', color);
        }

        // Apply to dots
        timeline.querySelectorAll('.project-dot').forEach(dot => {
            dot.style.borderColor = color;
        });
    }

    static applyButtonColors(clientColors) {
        document.querySelectorAll('.client-btn').forEach(btn => {
            const clientName = btn.dataset.client;
            const color = clientColors[clientName];
            if (color && clientName) {
                this.setupClientButton(btn, color);
            }
        });
    }

    static setupClientButton(btn, color) {
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