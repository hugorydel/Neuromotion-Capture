import mimetypes
mimetypes.add_type("application/javascript", ".js")

from argparse import ArgumentParser
from flask import Flask, render_template, request
from flask_sock import Sock
from json import dump, loads
from os import getenv, listdir, mkdir
from os.path import exists, join

parser = ArgumentParser(
	prog="Neuromotion Capture",
	description="A GUI to simultaneously collect EMG signals from a Myo Armband and hand landmarks via the MediaPipe Hand Landmarker library, enabling dataset creation for future EMG projects.")
parser.add_argument("--port", type=int, help="the port the server will served at", default=5000)
parser.add_argument("--recordsPath", type=str, help="the path of the directory where the data recordings will be saved to", default="./data/")
args = parser.parse_args()

app = Flask(__name__, template_folder="./app/templates", static_folder="./app/static")
app.config["SECRET_KEY"] = getenv("FLASK_SECRET_KEY", "SET FLASK SECRET")
sock = Sock(app)

data = { "landmarkData": [], "emgData": [], "startedRecordingTime": 0 }

@app.route("/")
def index():
	return render_template("index.html")

@app.route("/startRecording", methods=["POST"])
def startRecording():
	data["startedRecordingTime"] = request.json["startedRecordingTime"]

	return "", 204

@app.route("/saveRecording", methods=["POST"])
def saveRecording():
	del data["startedRecordingTime"]

	if not exists(args.recordsPath):
		mkdir(args.recordsPath)

	recordNumber = len(listdir(args.recordsPath)) + 1

	with open(join(args.recordsPath, f"record-{recordNumber}.json"), "w") as file:
		dump(data, file, indent=4)
	
	return "", 204

@app.errorhandler(404)
def pageNotFound(error):
	return render_template("404.html"), 404

@sock.route("/streamRecordingToMemory")
def streamRecordingToMemory(ws):
	while True:
		recordingData = loads(ws.receive())
		recordingData["recordingData"]["time"] = recordingData["recordingData"]["time"] - data["startedRecordingTime"]
		data[recordingData["type"]].append(recordingData["recordingData"])

if __name__ == "__main__":
	try:
		app.run(
			port=args.port,
			use_reloader=True,
			debug=True
		)
	except OSError as e:
		print(f"The port {args.port} is already in use")
		exit()
