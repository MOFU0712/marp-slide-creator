export const DEFAULT_THEME_CSS = `/* Marp Theme - Business Proposal */
section {
  background-color: #ffffff;
  color: #333333;
  font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
  font-size: 24px;
  padding: 40px;
}

h1 {
  color: #534AB7;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 20px;
}

h2 {
  color: #534AB7;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
}

ul {
  margin-left: 0;
  padding-left: 24px;
}

li {
  margin-bottom: 8px;
  line-height: 1.5;
}

li::marker {
  color: #534AB7;
}

/* Two column layout */
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 20px;
}

/* Section divider */
section.divider {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, #534AB7 0%, #7B6FCF 100%);
  color: white;
}

section.divider h1 {
  color: white;
  font-size: 48px;
}

section.divider p {
  font-size: 24px;
  opacity: 0.9;
}

/* Title only slide */
section.title-only {
  display: flex;
  justify-content: center;
  align-items: center;
}

section.title-only h1 {
  font-size: 48px;
  text-align: center;
}

/* Figure caption */
.caption {
  font-size: 14px;
  color: #666666;
  text-align: center;
  margin-top: 8px;
}

/* Emphasis */
strong {
  color: #534AB7;
}

/* Code */
code {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  font-size: 0.9em;
}

pre {
  background-color: #f4f4f4;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

th, td {
  border: 1px solid #e0e0e0;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #534AB7;
  color: white;
  font-weight: 600;
}

tr:nth-child(even) {
  background-color: #f8f8f8;
}

/* Blockquote */
blockquote {
  border-left: 4px solid #534AB7;
  padding-left: 16px;
  margin: 16px 0;
  color: #666666;
  font-style: italic;
}

/* Image */
img {
  max-width: 100%;
  height: auto;
}

/* Speaker notes (hidden in slides, shown in presenter view) */
/* Speaker notes are written as HTML comments: <!-- note --> */
`

export function getDefaultThemeCSS(): string {
  return DEFAULT_THEME_CSS
}
