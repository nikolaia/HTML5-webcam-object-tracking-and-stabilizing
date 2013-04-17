window.addEventListener("load", function() {

    var $ = function (arg) {return document.querySelector(arg)};

    var reqAnimFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame || function (callback) {
        setTimeout(callback, 1000 / 60);
    };


    var video = $("video");
    var canvas = $("canvas");

    var stableCanvas = $("#stableCanvas");


    var getUserMedia = window.navigator.getUserMedia ||
        window.navigator.webkitGetUserMedia ||
        window.navigator.mozGetUserMedia;


    getUserMedia.call(window.navigator, { video:true, audio:false },
        gotUserMedia,
        userMediaFailed);


    function gotUserMedia(stream) {
        var url = window.URL || window.webkitURL;
        video.src = window.mozGetUserMedia ? stream : url.createObjectURL(stream);
        video.play();
    }

    function userMediaFailed(err) {
        console.log("Could not getUserMedia: " + err)
    }

    var targetRed = 14;
    var targetGreen = 145;
    var targetBlue = 84;

    var sensitivity = 30;

    var ctx = canvas.getContext("2d");
    var stableCtx = stableCanvas.getContext("2d");

    var left,right, top, bottom = -1;

    var loop = function() {

        left=right=top=bottom = -1;

        ctx.drawImage(video, 0, 0, 320, 240);

        var imageData = ctx.getImageData(0, 0, 320, 240);


        for(var i = 0, l = imageData.data.length; i < l;i+=4) {
            var red = imageData.data[i];
            var green = imageData.data[i + 1];
            var blue = imageData.data[i + 2];

            var x = (i / 4) % 320;
            var y = (i / 4) / 320;

            var diff = Math.sqrt(Math.pow(targetRed - red, 2)
                + Math.pow(targetGreen - green, 2)
                + Math.pow(targetBlue - blue, 2));

            if (diff < sensitivity) {
                //imageData.data[i + 3] = 0;

                left = left == -1 ? x : Math.min(left, x);
                right = right == -1 ? x : Math.max(right, x);

                top = top == -1 ? y : Math.min(top, y);
                bottom = bottom == -1 ? y : Math.max(bottom, y);


            }
        }

        ctx.putImageData(imageData, 0, 0);

        stableCtx.clearRect(0, 0, 320, 240);

        if(left != -1) {

            var scale = document.getElementById("scale").value;

            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            var vH = $("video").videoHeight, 
            vW = $("video").videoWidth;

            var pixelPerScaleValue = scale*10;

            x  = left*2 - pixelPerScaleValue;
            x2 = right*2 + pixelPerScaleValue;
            y = top*2 - pixelPerScaleValue;
            y2 = bottom*2 + pixelPerScaleValue;

            var width = x2-x;
            var height = y2-y;    

            ctx.rect(x/2, y/2, width/2, height/2);
            ctx.stroke();

            stableCtx.drawImage(video, x, y, width, height, 0, 0, 320, 240);
        }

        reqAnimFrame(loop);
    }

    reqAnimFrame(loop);



    canvas.addEventListener("click", function(evt) {
        var pos = relMouseCoords(evt, canvas);
        console.log("Clicked " + pos.x + ", " + pos.y);

        ctx.drawImage(video, 0, 0, 320, 240);

        var pixel = ctx.getImageData(parseInt(pos.x), parseInt(pos.y), 1, 1).data;
        targetRed = pixel[0];
        targetGreen = pixel[1];
        targetBlue = pixel[2];

        var bc = "rgba(" + targetRed + ", " + targetGreen + ", " + targetBlue + ", 1)";
        console.log("BC: " + bc)
        $("#targetColor").style.backgroundColor = bc;
        evt.preventDefault();
        return false;
    });

    function relMouseCoords(e, elem){
        var mouseX, mouseY;

        if(e.offsetX) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        }
        else if(e.layerX) {
            mouseX = e.layerX;
            mouseY = e.layerY;
        }

        return {x:mouseX, y:mouseY}
    }

    video.addEventListener("click", function(e) {
        e.target.className = "rotating";
    });


    var slider = $("#sensitivitySlider");
    slider.value = sensitivity;

    slider.addEventListener("change", function() {
        sensitivity = slider.value;
    });

});