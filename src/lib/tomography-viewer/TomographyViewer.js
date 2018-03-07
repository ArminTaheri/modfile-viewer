import React, { Component } from 'react';
import { QeegModFileInterpreter } from 'qeegmodfile';
import { ColorMap } from '../modfile-parsing/Color';
import { parseModFile } from '../modfile-parsing/modFileParsing';
import './TomographyViewer.css';

const PANEL_SIZE = 256
const DISPLAY_INDEX = 2;
const MASK_INDEX = 1;
const NUM_OVERLAPS = 8;
const OVERLAP_SIZE = 10;
const MASK_THRESHOLD = 0.15;
const getArrayOffset = (coord, header) => {
  const i_size = header[header.order[0]].space_length;
  const j_size = header[header.order[1]].space_length;
  const k_size = header[header.order[2]].space_length;
  const i_offset = header[header.order[0]].offset;
  const j_offset = header[header.order[1]].offset;
  const k_offset = header[header.order[2]].offset;
  const coord_i = coord.i >= i_size ? i_size - 1 : coord.i;
  const coord_j = coord.j >= j_size ? j_size - 1 : coord.j;
  const coord_k = coord.k >= k_size ? k_size - 1 : coord.k;
  return (
    Math.round(coord_i) * i_offset +
    Math.round(coord_j) * j_offset +
    Math.round(coord_k) * k_offset
  );
};

const makeOverlapIndexMaps = (points, header, maskVolume) => {
  const indexMaps = [];
  const distanceMaps = [];
  for (let i = 0; i < NUM_OVERLAPS; i++) {
    indexMaps.push(new Int32Array(maskVolume.data.length).fill(-1));
    distanceMaps.push(new Float32Array(maskVolume.data.length).fill(-1));
  }
  for (let i = 0; i < points.length; i++) {
    const coord = maskVolume.worldToVoxel(...points[i]);
    const lim = Math.floor(OVERLAP_SIZE / 2);
    for (let vi = -lim; vi < lim; vi++) {
      for (let vj = -lim; vj < lim; vj++) {
        for (let vk = -lim; vk < lim; vk++) {
          const offsetCoord = {
            i: coord.i + vi,
            j: coord.j + vj,
            k: coord.k + vk,
          }
          const volumeIndex = getArrayOffset(offsetCoord, header);
          let j = 0;
          while (j < indexMaps.length && indexMaps[j][volumeIndex] !== -1) {
            j++;
          }
          if (j < indexMaps.length) {
            const p1 = points[i];
            const p2 = maskVolume.voxelToWorld(offsetCoord.i, offsetCoord.j, offsetCoord.k);
            const [dx, dy, dz] = [
              p2.x - p1[0],
              p2.y - p1[1],
              p2.z - p1[2]
            ];
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            indexMaps[j][volumeIndex] = i;
            distanceMaps[j][volumeIndex] = distance;
          }
        }
      }
    }
  }
  return { numPoints: points.length - 1, indexMaps, distanceMaps };
};

export default class TomographyViewer extends Component {
  constructor(props) {
    super(props);
    this.state = { loaded: false, sparseMaps: [] };
    this.componentWillReceiveProps(props);
  }
  componentWillReceiveProps() {
    if (!this.props.colorMap) {
      return;
    }
    const stops = this.props.colorMap;
    this.colorMap = new ColorMap(100, stops);
  }
  componentDidUpdate() {
    if (!this.viewer) {
      return;
    }
    this.viewer.redrawVolumes();
  }
  drawColorMap(canvas) {
    if (!canvas || !this.props.colorMap) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const pad = { top: 10, left: 10, bottom: 30, right: 30 };
    const grad = ctx.createLinearGradient(
      pad.left,
      pad.top,
      width - pad.right,
      pad.top,
    );
    this.props.colorMap.forEach((stop, i) => {
      const t = (i + 0.5) / this.props.colorMap.length;
      grad.addColorStop(t, stop.color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(
      pad.left,
      pad.top,
      width - pad.right,
      height - pad.bottom
    );
    ctx.strokeRect(
      pad.left,
      pad.top,
      width - pad.right,
      height - pad.bottom
    );
    ctx.stroke();
    ctx.font="14px Arial";
    ctx.fillStyle = '#000';
    let text = `${Math.round(100 * this.props.tomography.min) / 100}`;
    ctx.fillText(text, pad.left, pad.top + height - 15);
    text = `${Math.round(100 * this.props.tomography.max) / 100}`;
    ctx.fillText(text, width - pad.right - 20, pad.top + height - 15);
    text = `${Math.round(100 * this.props.tomography.max) / 100}`;
  }
  componentDidMount() {
    const component = this;
    this.viewer = window.BrainBrowser.VolumeViewer.start("tomography-viewer-container", function(viewer) {
      viewer.loadDefaultColorMapFromURL(component.props.brainbrowserColormapURL);
      // Set the size of slice display panels.
      viewer.setPanelSize(PANEL_SIZE, PANEL_SIZE);
      // Start rendering.
      viewer.loadVolumes({
        volumes: [
          {
            type: 'nifti1',
            nii_url: component.props.atlasURLs.volume
          },
          {
            type: 'nifti1',
            nii_url: component.props.atlasURLs.mask
          }
        ],
        overlay: {}
      });
      viewer.addEventListener('volumeuiloaded', (event) => {
        if (event.volume_id !== DISPLAY_INDEX) {
          event.container.style.display = 'none';
        }
      });
      viewer.addEventListener('volumesloaded', () => {
        const displayVolume = viewer.volumes[DISPLAY_INDEX];
        const maskVolume = viewer.volumes[MASK_INDEX];
        displayVolume.blend_ratios[0] = 0.85;
        displayVolume.blend_ratios[1] = 1.00;
        displayVolume.setColormapFunction(MASK_INDEX, component.interpolateTomographyColor.bind(component, maskVolume));
        displayVolume.setColormapFunction(MASK_INDEX, component.interpolateTomographyColor.bind(component, maskVolume));
        const header = maskVolume.header;
        const sparseMaps = component.props.tomographyPoints.map(points =>
           makeOverlapIndexMaps(points, header, maskVolume)
        );
        component.setState({ loaded: true, sparseMaps });
      });
      viewer.render();
    });
  }
  interpolateTomographyColor(volume, { min, max }, coord, maskValue) {
    if (maskValue < (MASK_THRESHOLD * max)) {
      return [0x00, 0x00, 0x00, 0x00];
    }
    if (this.state.sparseMaps.length === 0) {
      return [0x00, 0x00, 0x00, 0x00];
    }
    const startFrequency = this.props.startFrequency;
    const frequency = this.props.frequency || startFrequency;
    const frequencyStep = this.props.stepSize;
    const freqIndex = Math.max(0, Math.floor((frequency - startFrequency) / frequencyStep));
    if (!this.props.tomography || !this.props.tomography.tomographies[freqIndex]) {
      return [0x00, 0x00, 0x00, 0x00];
    }
    const tomography = this.props.tomography.tomographies[freqIndex];
    const maps = this.state.sparseMaps.find(m => m.numPoints === tomography.length);
    if (!maps) {
      return [0x00, 0x00, 0x00, 0x00];
    }
    const { indexMaps, distanceMaps } = maps;
    const neighbours = [];
    for (let i = 0; i < indexMaps.length; i++) {
      const volumeIndex = getArrayOffset(coord, volume.header);
      if (indexMaps[i][volumeIndex] !== -1) {
        neighbours.push({
          index: indexMaps[i][volumeIndex],
          distance: distanceMaps[i][volumeIndex]
        });
      }
    }
    if (neighbours.length === 0) {
      return [0xff, 0xff, 0xff, 0xff];
    }
    let t = 0;
    let sumDistances = 0;
    for (let i = 0; i < neighbours.length; i++) {
      const index = neighbours[i].index;
      if (!tomography[index]) {
        continue;
      }
      const distance = neighbours[i].distance;
      t += tomography[index] / distance;
      sumDistances += 1 / distance;
    }
    t = t / sumDistances;
    const minValue = this.props.tomography.min;
    const maxValue = this.props.tomography.max;
    const mid = (minValue + maxValue) / 2;
    t = 0.5 + (t - mid) / (maxValue - minValue);
    t = Math.max(0, Math.min(0.999, t));
    return this.colorMap.interpolate(t);
  }
  render() {
    const colorMap =
      <canvas
        ref={canvas => { this.drawColorMap(canvas); }}
        className="color-map-canvas"
        height={50}
        width={200}
      />
    ;
    return (
      <div id="tomography-viewer-container">
        <button onClick={() => { this.viewer.resetDisplays(); this.viewer.redrawVolumes(); }}>
          reset viewports
        </button>
        <div>
          { this.props.colorMap ? colorMap : null}
        </div>
        { this.state.loaded ? null : <div>Loading...</div> }
      </div>
    )
  }
}
