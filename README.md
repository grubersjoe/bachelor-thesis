# Darstellung interaktiver 3D-Grafik im Webbrowser

Die Testumgebung liegt im Unterverzeichnis "web3d" des Hauptverzeichnisses
(Darstellunger interaktiver 3D-Grafik im Webbrowser). Ein Webserver ist für
die Ausführung der Umgebung zwingend notwendig. Eine einfache Möglichkeit
bietet hierbei Python. Sofern dieses installiert ist kann unter Python 2 ein
einfacher HTTP-Server im aktuellen Verzeichnis wie folgt gestartet werden:

```python
python -m SimpleHTTPServer [port]
```

Für Python 3 lautet der Befehl:

```python
python -m http.server [port]
```

Die behandelten Beispiele für X3DOM bzw. WebGL liegen unter "kap4". Für deren
Betrachtung muss in diesem Verzeichnis wie oben ebenso ein Webserer gestartet
werden. Angenommen der Server läuft unter dem Standard-Port 8000, so können
die Beispiele unter folgenden Adressen aufgerufen werden:

http://localhost:8000/x3dom/example/
http://localhost:8000/webgl/example/

Jonathan Gruber

02.08.2014
