---
layout: page
title: About
permalink: /about/
order: 4
icon: fas fa-info-circle
---

<div class="about-section">
    <section class="hero-section">
        <h1>{{ site.data.author.name }}</h1>
        <p class="lead">{{ site.data.author.title }}</p>

        <div class="about-links">
            <a href="https://github.com/{{ site.data.author.github }}" target="_blank" class="cta-button">
                <i class="fab fa-github"></i> GitHub
            </a>
            <a href="https://www.linkedin.com/in/{{ site.data.author.linkedin }}" target="_blank" class="cta-button">
                <i class="fab fa-linkedin"></i> LinkedIn
            </a>
            <a href="mailto:{{ site.data.author.email }}" class="cta-button">
                <i class="fas fa-envelope"></i> Email
            </a>
            <a href="#" onclick="downloadPDF(); return false;" class="cta-button">
                <i class="fas fa-file-pdf"></i> Resume
            </a>
        </div>
    </section>

    <p>
        {{ site.data.author.description | markdownify }}
    </p>
</div>

<!-- Add Font Awesome for icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

<script>
    /**
     * Triggers a download of the PDF resume from the about page.
     * Reuses the sessionStorage cache via window.getPDFData() so no
     * extra network request is made if the PDF was already prefetched.
     */
    async function downloadPDF() {
        try {
            const base64 = await window.getPDFData();
            const url = window.base64ToObjectURL(base64);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'CV_Baptiste_Mouginot.pdf';
            a.click();
        } catch (error) {
            console.error('Erreur téléchargement:', error);
        }
    }
</script>

<style>
    .about-links {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 20px;
    }
</style>