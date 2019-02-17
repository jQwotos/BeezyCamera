import React from "react";
import ReactDOM from "react-dom";

import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import "./styles.css";
import "./components/Firebase/firebase";
import { database } from "./components/Firebase/firebase";
import { Checkbox, Input, MenuItem, Select } from '@material-ui/core';
import styled from 'styled-components';

const MainBox = styled.div`
    padding-left: 80%;
`;

const writeSpotData = (spot, currentCapacity, sending) => {
    if (sending && spot) {
        database.ref("spots/" + spot).set({
            currentCapacity: currentCapacity
        })
    }
}

class App extends React.Component {
  videoRef = React.createRef();
  canvasRef = React.createRef();

  constructor(props) {
      super(props);
      this.state = {
          roomLocation: "",
          sending: false,
          maxCapacity: 50,
          building: "",

      }
  }

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "user"
          }
        })
        .then(stream => {
          window.stream = stream;
          this.videoRef.current.srcObject = stream;
          return new Promise((resolve, reject) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        });
      const modelPromise = cocoSsd.load();
      Promise.all([modelPromise, webCamPromise])
        .then(values => {
          this.detectFrame(this.videoRef.current, values[0]);
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  detectFrame = (video, model) => {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  };

  renderPredictions = predictions => {
    let numPeople = 0;
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
    });

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
      numPeople++;
    });
    writeSpotData(this.state.roomLocation, numPeople, this.state.sending);
  };

  handleInputChange(evt) {
      const target = evt.target;
      const name = target.name;
      const value = target.type === 'checkbox' ? target.checked : target.value;

      this.setState({
          [name]: value
      });
  }

  startAndStop(evt) {
      this.setState({
          sending: !this.state.sending
      })
  }

  render() {
    return (
      <div>
        <video
          className="size"
          autoPlay
          playsInline
          muted
          ref={this.videoRef}
          width="600"
          height="500"
        />
        <canvas
          className="size"
          ref={this.canvasRef}
          width="600"
          height="500"
        />
        <MainBox>
            <Input variant="outlined" helperText="Room Location" name="roomLocation" value={this.state.roomLocation} onChange={evt => this.handleInputChange(evt)} />
            <Input variant="outlined" helperText="Max Capacity" name="maxCapacity" value={this.state.maxCapacity} onChange={evt => this.handleInputChange(evt)} />
            <Input variant="outlined" helperText="Building" name="building" value={this.state.building} onChange={evt => this.handleInputChange(evt)} />
            <Select
              value={this.state.type}
              onChange={evt => this.handleInputChange(evt)}
            >
            <MenuItem value={"business"}>Business</MenuItem>
            <MenuItem value={"room"}>Room</MenuItem>
            <MenuItem value={"lectureHalls"}>Lecture Halls</MenuItem>
            <MenuItem value={"seating"}>Seating (outside)</MenuItem>
            </Select>
            <Checkbox name="sending" type="checkbox" checked={this.state.sending} onChange={evt => this.handleInputChange(evt)}></Checkbox>
            <p>Current Status: {this.state.sending ? "Sending" : "PAUSED"}</p>
        </MainBox>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);