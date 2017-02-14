all: main.pdf

main.pdf: main.tex
	latexmk -output-directory=build -pdf -shell-escape -use-make main.tex

clean:
	latexmk -output-directory=build -CA
	
