#set terminal pngcairo
#set output 'browser-ww-monthly-200901-201404-with-mobile.png'

set terminal cairolatex color
set output 'browser-ww-monthly-200901-201404-with-mobile.tex'

set xlabel "Jahr"
set ylabel "Prozent"
set key inside

set grid mxtics xtics
set grid mytics ytics

set xdata time
set timefmt "%Y/%m"
set format x "%Y"
set xrange ["2009/01":"2014/04"]
set xtics "2009/01",60*60*24*365.24,"2014/04"

data = 'browser-ww-monthly-200901-201404-with-mobile.dat'

# 2  = IE
# 3  = Chrome; 25 = Chromium
# 4  = Firefox
# 5  = Safari (Desktop)
# 6  = Opera

# 7  = Android
# 8  = iPhone
# 9  = Nokia
# 10 = UC Browser
# 11 = Blackberry
# 12 = iPod Touch

plot data using 1:2 title column with lines lw 3 linecolor rgb "blue", \
	data using 1:($3+$25) title column with lines lw 3 linecolor rgb "green", \
	data using 1:4 title column with lines lw 3 linecolor rgb "red", \
	data using 1:5 title column with lines lw 3 linecolor rgb "slategray", \
	data using 1:6 title column with lines lw 3 linecolor rgb "purple", \
	data using 1:($7+$8+$9+$10+$11+$12) title 'Mobil' with lines lw 3 linecolor rgb "black"