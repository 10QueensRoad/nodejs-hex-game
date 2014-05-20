<h1>Hex game</h1>

<h2>How to install and run it in the intellij</h2>

<pre>$ npm install</pre>
<p>This command will create all the dependencies</p>

<pre>ctrl+shift+alt+s</pre>
<p>Open intellij setting and install nodejs plugin.</p>

<p>click <b>Edit configuration</b> in the <b>Run</b> menu to point to %project%/app.js

<h2>How to run Jasmine tests</h2>
<pre>$ npm install</pre>
<pre>$ node runAllSpecs.js</pre>

<h2>How to generate a QR code</h2>
<p>Into an output file:</p>
<pre>$ java -jar tools/qrcode-generator-1.0.0-shaded.jar -f png -w 125 -h 125 -o output.png -u http://hexgame</pre>
<p>Into a dataURI (that you can then use in a &lt;img src="data:image/png;base64,iVBORw[...]" /&gt;):</p>
<pre>$ java -jar qrcode-generator-1.0.0-shaded.jar -f dataURI -w 125 -h 125 -u http://hexgame</pre>