all:
	latexmk -pdf -pdflatex=pdflatex -shell-escape -output-directory=build main.tex

clean:
	latexmk -C -output-directory=build

watch:
	filewatcher "**/*.tex" "bib/*" "make"

