# Neuromotion Capture

## An EMG & Hand Landmarks dataset generator.

This project provides a graphical user interface for collecting EMG signals from a Thalmic Labs Myo Armband alongside real-time hand landmarks using the MediaPipe Hand Landmarker library, allowing for the generation of a dataset for future EMG projects.

It is built using Flask and uses websockets to communicate between the server and the client.

## Installation

1. Clone the Github repository and switch the current directory to the newly cloned repo
````
git clone https://github.com/ThierryPopat/Neuromotion-Capture.git
cd Neuromotion-Capture
````

2. Install any required dependencies
````
pip install -r requirements.txt
````

## Usage

### Simple Usage

The default port (5000) and the default path for where the recordings are saved to (./data) can be used by executing the below command
````
python main.py
````

The server will be served at [localhost:5000](http://localhost:5000/).

### Advanced Usage

````
usage: Neuromotion Capture [-h] [--port PORT] [--recordsPath RECORDSPATH]

A GUI to simultaneously collect EMG signals from a Myo Armband and hand landmarks via the MediaPipe Hand Landmarker
library, enabling dataset creation for future EMG projects.

options:
  -h, --help                  show this help message and exit
  --port PORT                 the port the server will served at
  --recordsPath RECORDSPATH   the path of the directory where the data recordings will be saved to
````
