# Building the LaTeX Paper

## Prerequisites

### Option A: Install MiKTeX (recommended for Windows)
```
winget install MiKTeX.MiKTeX
```
After install, open MiKTeX Console and update packages. MiKTeX auto-installs missing packages.

### Option B: Install TeX Live
```
winget install TeXLive.TeXLive
```

## Figure Conversion (choose one)

### Option 1: Use `--shell-escape` with svg package (easiest)
The paper uses `\includesvg{}` which converts SVG on-the-fly. Requires Inkscape:
```
winget install Inkscape.Inkscape
```
Then compile with:
```
pdflatex --shell-escape paper.tex
bibtex paper
pdflatex --shell-escape paper.tex
pdflatex --shell-escape paper.tex
```

### Option 2: Pre-convert SVG to PDF
If you don't want `--shell-escape`, convert figures first:
```
npm install pdfkit svg-to-pdfkit
node convert_figures.mjs
```
Then change `\includesvg` to `\includegraphics` in paper.tex, and compile normally:
```
pdflatex paper.tex
bibtex paper
pdflatex paper.tex
pdflatex paper.tex
```

### Option 3: Use Overleaf
Upload `paper.tex`, `references.bib`, and the `figures/` folder to Overleaf.
For SVG support on Overleaf, convert figures to PDF first using Option 2.

## Quick Build (after prerequisites)
```
cd "C:\Users\trian\Sync\Claude's languages"
pdflatex --shell-escape paper.tex
bibtex paper
pdflatex --shell-escape paper.tex
pdflatex --shell-escape paper.tex
```

## arXiv Submission
arXiv requires:
1. `paper.tex`
2. `references.bib`
3. All figure files (PDF format preferred, or SVG with svg package)
4. No `--shell-escape` on arXiv, so pre-convert figures to PDF

Bundle for arXiv:
```
node convert_figures.mjs
# Then replace \includesvg with \includegraphics in paper.tex
# Zip: paper.tex, references.bib, figures/*.pdf
```
