b = document.body;
c = document.getElementsByTagName('canvas')[0];
a = c.getContext('2d');

var BlobParams = function() {
    this.emitRate = .1;
    this.terrainSpeed = .01;
    this.terrainAmplitude = 99;
    this.hillWidth = 99;
}

    var blobParams = new BlobParams();
    var gui = new dat.GUI();
    gui.add(blobParams, 'emitRate', .01, .05);
    gui.add(blobParams, 'terrainSpeed', 0, .02);
    gui.add(blobParams, 'terrainAmplitude', 0, 99);
    gui.add(blobParams, 'hillWidth', 50, 200)

for(Z in a)a[Z[0]+(Z[6]||Z[2])]=a[Z];

var blobs = {};
var nb = time = 0;
var mx = my = 256;
var amp = 99;
var div = 99;
onmousemove=function(e) {
	mx = e.pageX;
	my = e.pageY-c.offsetTop;
}

setInterval(function() {
    amp = blobParams.terrainAmplitude;
    c.width=innerWidth;
    var H = (c.height=innerHeight)-150;
    time += blobParams.terrainSpeed;
    div = blobParams.hillWidth;
    if (Math.random() < blobParams.emitRate) {
        var blob = blobs[nb++] = [];
        var cx = Math.random() * innerWidth;
        var r = blob.r = 5+9*Math.random();
        for (var j = 20; j--;) {
            var p = blob[j+20] = blob[j] = {};
            p.xp = p.x = cx + r * Math.cos(j * .3);
            p.yp = p.y = r * Math.sin(j * .3)-20;
        }
        blob.c = 'hsl('+Math.random()*256+',99%,50%)';
        blob.a = 6*r*r;
    }

    // Collide blobs
    for (var i = nb;i--;) {
        var blob = blobs[i];
        for (var j=nb;j--;) {
            var coll = blobs[j];
            var bound = blob.r+coll.r;
            var vx = coll.cx - blob.cx;
            var vy = coll.cy - blob.cy;
            if (i!=j && vx > -bound*2 && vx < bound*2 && vy > -bound*2 && vy < bound*2) {
                var len = Math.sqrt(vx * vx + vy * vy);
                vx /= len;
                vy /= len;
                var l = blob.r/(blob.r+coll.r)*len;
                for (var k = 20;k--;) {
                    var p = blob[k];
                    var dp = Math.max(0, (p.x - blob.cx) * vx + (p.y - blob.cy) * vy - l);
                    p.x -= dp * vx;
                    p.y -= dp * vy;
                }
            }
        }
    }
    
    for (var i = nb; i--; ) {
        var blob = blobs[i];
        a.sl(blob.c);
        a.ba();
        a.mv(blob[0].x,blob[0].y);
        // Edge springs and vertex normal calculation. Note that there is no need for square roots in this particular implementation. Edge springs have a rest length of 0 and edges remain pretty similar in length.
        var qa = 0;
        var qb = 0;
        var qc = 0;
        blob.cx = blob.cy = 0;
        for (var j = 20; j--;) {
            var p = blob[j];
            var q = blob[j+1];
            var r = blob[j+2];
            var s = blob[j+3];
            var rx = r.x-q.x;
            var ry = r.y-q.y;
            var px = p.x-q.x;
            var py = p.y-q.y;
            var sx = r.x-s.x;
            var sy = r.y-s.y;

            q.dx = rx+px;
            q.dy = ry+py;

            var rny=q.x-s.x;
            var rnx=s.y-q.y;

            // Summing up constants for quadratic equation
            qa += (q.nx=ry-py) * (rny) - (rnx) * (q.ny=px-rx);
            qb += q.x * rny + q.nx * r.y - r.x * q.ny - rnx * q.y;
            qc += q.x*r.y-r.x*q.y;

            a.ln(p.x, p.y);
        }
        a.sr();
        a.fl();
        
        qa /= (Math.sqrt(qb * qb - 4 * qa * (qc - blob.a)) - qb) / 2;
        
        // Advance points and calculate center of blob
        
        for (var j = 20; j--;) {
            var p = blob[j];
            p.x += p.dx/4 + p.nx/qa;
            p.y += p.dy/4 + p.ny/qa;
            var vx = mx-p.x;
            var vy = my-p.y;
            var len = Math.max(vx*vx+vy*vy,5);
            vx = p.x - p.xp + vx/len;
            vy = p.y - p.yp + .01 + vy/len;
            p.xp = p.x;
            p.yp = p.y;
            blob.cx += p.x=Math.min(Math.max(0,(p.xp=p.x)+vx),innerWidth);
            blob.cy += p.y=(p.yp=p.y)+vy;

            var s = Math.sin(time + p.x / div);
            vx = H + amp * s;
            if (p.y > vx) {
                var vy = vx-p.y;
                // Newton's method for finding closest point on terrain
                var cos = Math.cos(time + p.x / div);
                var f = 2*amp*cos*vy/div;
                var df = 2*amp/div/div*(amp*cos*cos-s*vy)+2;
                p.x -= f/df;
                p.y = H + amp * Math.sin(time + p.x / div);
            }
        }
        blob.cx /= 20;
        blob.cy /= 20;
    }
}, 8);