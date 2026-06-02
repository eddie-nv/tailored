/**
 * ATS-optimized resume HTML template.
 * Space Grotesk + DM Sans fonts. Single-column, print-ready.
 * Replace {{CV_CONTENT}} with the injected CV HTML.
 */
export const RESUME_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --font-heading: 'Space Grotesk', system-ui, sans-serif;
      --font-body: 'DM Sans', system-ui, sans-serif;
      --color-text: #0f0f0f;
      --color-text-secondary: #444444;
      --color-text-muted: #666666;
      --color-border: #d4d4d4;
      --color-border-light: #e8e8e8;
      --color-accent: #1a1a2e;
      --space-section: 1.4rem;
      --space-item: 0.65rem;
    }

    html, body {
      width: 210mm;
      font-family: var(--font-body);
      font-size: 10pt;
      color: var(--color-text);
      background: #ffffff;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .resume {
      width: 210mm;
      min-height: 297mm;
      padding: 18mm 20mm 18mm 20mm;
    }

    h1 {
      font-family: var(--font-heading);
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-accent);
      line-height: 1.1;
      margin-bottom: 0.3rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--color-accent);
    }

    h2 {
      font-family: var(--font-heading);
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-accent);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 0.2rem;
      margin-top: var(--space-section);
      margin-bottom: 0.6rem;
    }

    h3 {
      font-family: var(--font-heading);
      font-size: 10.5pt;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.1rem;
      margin-top: var(--space-item);
    }

    h4 {
      font-family: var(--font-heading);
      font-size: 9.5pt;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: 0.15rem;
    }

    p {
      font-size: 9.5pt;
      color: var(--color-text-secondary);
      margin-bottom: 0.3rem;
      line-height: 1.55;
    }

    ul, ol {
      padding-left: 1.2em;
      margin-bottom: 0.4rem;
    }

    li {
      font-size: 9.5pt;
      color: var(--color-text-secondary);
      margin-bottom: 0.15rem;
      line-height: 1.5;
    }

    strong, b {
      font-weight: 600;
      color: var(--color-text);
    }

    em, i {
      font-style: italic;
    }

    a {
      color: var(--color-accent);
      text-decoration: none;
    }

    hr {
      border: none;
      border-top: 1px solid var(--color-border-light);
      margin: 0.5rem 0;
    }

    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
      }

      .resume {
        padding: 15mm 18mm;
      }

      @page {
        size: A4;
        margin: 0;
      }

      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <main class="resume" role="main">
    <div class="cv-content">
      {{CV_CONTENT}}
    </div>
  </main>
</body>
</html>`
