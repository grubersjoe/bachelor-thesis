# Darstellung interaktiver 3D-Grafik im Webbrowser

Bachelorarbeit Jonathan Gruber, 2014
Technische Hochschule Ingolstadt

**[PDF](./build/main.pdf)**

## Testumgebung

Die Testumgebung liegt im Unterverzeichnis `web3d` des Wurzelverzeichnises. Zur
Ausführung dieser ist ein Webserver erforderlich. Hierfür kann beispielsweise
der in Python integrierte HTTP-Server verwendet werden:

```python python -m http.server [port] ```

Für Python 2 lautet der Befehl:

```python python2 -m SimpleHTTPServer [port] ```

Die behandelten Beispiele für X3DOM bzw. WebGL liegen unter `kap4`. Für
deren Betrachtung muss in diesem Verzeichnis wie oben ein Webserer gestartet
werden. Angenommen der Server läuft unter dem Standard-Port 8000, so sind
die Beispiele unter den folgenden Adressen aufrufbar:

http://localhost:8000/x3dom/example/
http://localhost:8000/webgl/example/
