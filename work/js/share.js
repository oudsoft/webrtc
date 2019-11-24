//share.js

function doGetScreenSignal() {
    this.disabled = true;

    invokeGetDisplayMedia(function(screen) {
        addStreamStopListener(screen, function() {
            location.reload();
        });
		
		localStream = screen;        
        
		localvideo.srcObject = screen;

        var _capabilities = screen.getTracks()[0].getCapabilities();
        $(capabilities).val('capabilities:\n\n' + JSON.stringify(_capabilities, null, '\t'));
        $(capabilities).css({display: 'block'});

        var _settings = screen.getTracks()[0].getSettings();
        $(settings).val('settings:\n\n' + JSON.stringify(_settings, null, '\t'));
        $(settings).css({display: 'block'});
    }, function(e) {
        //button.disabled = false;

        var error = {
            name: e.name || 'UnKnown',
            message: e.message || 'UnKnown',
            stack: e.stack || 'UnKnown'
        };

        if(error.name === 'PermissionDeniedError') {
            if(location.protocol !== 'https:') {
                error.message = 'Please use HTTPs.';
                error.stack   = 'HTTPs is required.';
            }
        }

        console.error(error.name);
        console.error(error.message);
        console.error(error.stack);

        alert('Unable to capture your screen.\n\n' + error.name + '\n\n' + error.message + '\n\n' + error.stack);
    });
}

function invokeGetDisplayMedia(success, error) {
    var videoConstraints = {};

    if(aspectRatio.value !== 'default') {
        videoConstraints.aspectRatio = aspectRatio.value;
    }

    if(frameRate.value !== 'default') {
        videoConstraints.frameRate = frameRate.value;
    }

    if(cursor.value !== 'default') {
        videoConstraints.cursor = cursor.value;
    }

    if(displaySurface.value !== 'default') {
        videoConstraints.displaySurface = displaySurface.value;
    }

    if(logicalSurface.value !== 'default') {
        videoConstraints.logicalSurface = true;
    }

    if(resolutions.value !== 'default') {
        if (resolutions.value === 'fit-screen') {
            videoConstraints.width = screen.width;
            videoConstraints.height = screen.height;
        }

        if (resolutions.value === '4K') {
            videoConstraints.width = 3840;
            videoConstraints.height = 2160;
        }

        if (resolutions.value === '1080p') {
            videoConstraints.width = 1920;
            videoConstraints.height = 1080;
        }

        if (resolutions.value === '720p') {
            videoConstraints.width = 1280;
            videoConstraints.height = 720;
        }

        if (resolutions.value === '480p') {
            videoConstraints.width = 853;
            videoConstraints.height = 480;
        }

        if (resolutions.value === '360p') {
            videoConstraints.width = 640;
            videoConstraints.height = 360;
        }

        /*
        videoConstraints.width = {
            exact: videoConstraints.width
        };

        videoConstraints.height = {
            exact: videoConstraints.height
        };
        */
    }

    if(!Object.keys(videoConstraints).length) {
        videoConstraints = true;
    }

    var displayMediaStreamConstraints = {
        video: videoConstraints
    };

    if(navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
    }
    else {
        navigator.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
    }
}

function addStreamStopListener(stream, callback) {
    stream.addEventListener('ended', function() {
        callback();
        callback = function() {};
    }, false);
    stream.addEventListener('inactive', function() {
        callback();
        callback = function() {};
    }, false);
    stream.getTracks().forEach(function(track) {
        track.addEventListener('ended', function() {
            callback();
            callback = function() {};
        }, false);
        track.addEventListener('inactive', function() {
            callback();
            callback = function() {};
        }, false);
    });
}