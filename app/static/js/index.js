// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { HandLandmarker, FilesetResolver } from './tasksVision.min.js';

/* -------------------------------------------------------------------------- */
/*                               HAND LANDMARKER                              */
/* -------------------------------------------------------------------------- */

// It should be noted that the handedness of the results is inverted.

let handLandmarker = undefined;
const video = document.getElementById('webcam');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
let lastVideoTime = -1;
let results = undefined;

// Before we can use HandLandmarker class we must wait for it to finish loading.
// Machine Learning models can be large and take a moment to get everything needed to run.
const createHandLandmarker = async () => {
	const vision = await FilesetResolver.forVisionTasks(
		'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
	);
	handLandmarker = await HandLandmarker.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath: '/static/model/handLandmarker.task',
			delegate: 'GPU',
		},
		runningMode: 'VIDEO',
		numHands: 1,
	});

	enableCam();
};

// Enable the live webcam view and start detection.
function enableCam(event) {
	// Check if webcam access is supported.
	const hasGetUserMedia = () => {
		var _a;
		return !!((_a = navigator.mediaDevices) === null || _a === void 0
			? void 0
			: _a.getUserMedia);
	};

	// If webcam supported, activate it.
	if (!hasGetUserMedia()) {
		console.error('getUserMedia() is not supported by your browser');
		alert('getUserMedia() is not supported by your browser');
	}

	// getUsermedia parameters.
	const constraints = {
		video: true,
	};

	// Activate the webcam stream.
	navigator.mediaDevices.getUserMedia(constraints).then(stream => {
		video.srcObject = stream;
		video.addEventListener('loadeddata', predictWebcam);
	});
}

async function predictWebcam() {
	canvasElement.style.width = video.offsetWidth;
	canvasElement.style.height = video.offsetHeight;
	canvasElement.width = video.offsetWidth;
	canvasElement.height = video.offsetHeight;

	// Now let's start detecting the stream.
	let startTimeMs = performance.now();
	if (lastVideoTime !== video.currentTime) {
		lastVideoTime = video.currentTime;
		results = handLandmarker.detectForVideo(video, startTimeMs);
	}

	canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

	if (results.landmarks) {
		for (const landmarks of results.landmarks) {
			drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
				color: '#00FF00',
				lineWidth: 5,
			});
			drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
		}

		streamRecordingToMemory(
			{
				time: startTimeMs,
				landmarks: results.landmarks,
				worldLandmarks: results.worldLandmarks,
			},
			'landmarkData'
		);
	}

	canvasCtx.restore();

	// Call this function again to keep predicting when the browser is ready.
	window.requestAnimationFrame(predictWebcam);
}

createHandLandmarker();

/* -------------------------------------------------------------------------- */
/*                                     EMG                                    */
/* -------------------------------------------------------------------------- */

var shouldUpdateGyroscopeGraph = true;
var gyroscopeData = [0, 0, 0];
var gyroscopeRange = 500;
var gyroscopeResolution = 100;
var gyroscopeGraph;
var emgRange = 150;
var emgResolution = 50;
var emgGraphs;
var rawEmgData = [0, 0, 0, 0, 0, 0, 0, 0];
var arrayOfZeros = Array.apply(null, Array(gyroscopeResolution)).map(
	Number.prototype.valueOf,
	0
);

Myo.on('connected', function () {
	console.log('Emg is connected');
	this.streamEMG(true);

	setInterval(function () {
		updateEmgGraph(rawEmgData);
	}, 25);
});

if (shouldUpdateGyroscopeGraph) {
	Myo.on('gyroscope', function (quant) {
		gyroscopeData = quant;
		updateGyroscopeGraph(quant);
	});
}

Myo.on('emg', function (data) {
	rawEmgData = data;

	console.log(rawEmgData);

	streamRecordingToMemory(
		{
			time: performance.now(),
			emgData: rawEmgData,
			gyroscopeData: gyroscopeData,
		},
		'emgData'
	);
});

//This tells Myo.js to create the web sockets needed to communnicate with Myo Connect
Myo.connect('com.myojs.deviceGraphs');

var gyroscopeGraphData = {
	x: arrayOfZeros.slice(0),
	y: arrayOfZeros.slice(0),
	z: arrayOfZeros.slice(0),
};

var emgGraphData = [
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
	Array.apply(null, Array(emgResolution)).map(Number.prototype.valueOf, 0),
];

$(document).ready(function () {
	if (shouldUpdateGyroscopeGraph) {
		gyroscopeGraph = $('#gyroscopeGraph')
			.plot(formatFlotGyroscopeData(), {
				colors: ['#04fbec', '#ebf1be', '#c14b2a', '#8aceb5'],
				xaxis: {
					show: false,
					min: 0,
					max: gyroscopeResolution,
				},
				yaxis: {
					min: -gyroscopeRange,
					max: gyroscopeRange,
				},
				grid: {
					borderColor: '#427F78',
					borderWidth: 1,
				},
			})
			.data('plot');
	}

	emgGraphs = emgGraphData.map(function (podData, podIndex) {
		return $('#pod' + podIndex)
			.plot(formatFlotEmgData(podData), {
				colors: ['#8aceb5'],
				xaxis: {
					show: false,
					min: 0,
					max: emgResolution,
				},
				yaxis: {
					min: -emgRange,
					max: emgRange,
				},
				grid: {
					borderColor: '#427F78',
					borderWidth: 1,
				},
			})
			.data('plot');
	});
});

var formatFlotGyroscopeData = function () {
	return Object.keys(gyroscopeGraphData).map(function (axis) {
		return {
			label: axis + ' axis',
			data: gyroscopeGraphData[axis].map(function (val, index) {
				return [index, val];
			}),
		};
	});
};

var formatFlotEmgData = function (data) {
	return [
		data.map(function (val, index) {
			return [index, val];
		}),
	];
};

var updateGyroscopeGraph = function (orientationData) {
	Object.keys(orientationData).map(function (axis) {
		gyroscopeGraphData[axis] = gyroscopeGraphData[axis].slice(1);
		gyroscopeGraphData[axis].push(orientationData[axis]);
	});

	gyroscopeGraph.setData(formatFlotGyroscopeData());
	gyroscopeGraph.draw();
};

var updateEmgGraph = function (emgData) {
	emgGraphData.map(function (data, index) {
		emgGraphData[index] = emgGraphData[index].slice(1);
		emgGraphData[index].push(emgData[index]);

		emgGraphs[index].setData(formatFlotEmgData(emgGraphData[index]));
		emgGraphs[index].draw();
	});
};

/* -------------------------------------------------------------------------- */
/*                                   GENERAL                                  */
/* -------------------------------------------------------------------------- */

var startedRecordingTime;
var recording = false;
const startRecordingButton = document.getElementById('startRecording');
const stopRecordingButton = document.getElementById('stopRecording');
const streamRecordingSocket = new WebSocket(
	'ws://' + location.host + '/streamRecordingToMemory'
);

var transmit = function (method, url, body) {
	fetch(url, {
		method: method,
		body: JSON.stringify(body),
		headers: { 'Content-type': 'application/json; charset=UTF-8' },
	});
};

var streamRecordingToMemory = function (recordingData, type) {
	if (recording) {
		streamRecordingSocket.send(
			JSON.stringify({ recordingData: recordingData, type: type })
		);
	}
};

startRecordingButton.addEventListener('click', function () {
	recording = true;
	startRecordingButton.disabled = true;
	stopRecordingButton.disabled = false;

	startedRecordingTime = performance.now();
	transmit('POST', `http://${location.host}/startRecording`, {
		startedRecordingTime: startedRecordingTime,
	});
});

stopRecordingButton.addEventListener('click', function () {
	recording = false;
	startRecordingButton.disabled = false;
	stopRecordingButton.disabled = true;

	transmit('POST', `http://${location.host}/saveRecording`, {});
});
