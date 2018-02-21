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

export default class TomographyViewer extends Component {
  constructor(props) {
    super(props);
    this.state = { loaded: false, sparseMaps: [] };
    this.componentWillReceiveProps(props);
    window.fetch('static/data/AVE-ETC-A-0.MOD')
      .then(res => res.blob())
      .then(blob => new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob);
        reader.onload = function() {
          resolve(this.result);
        }
      }))
      .then(buffer => {
        const interp = new QeegModFileInterpreter(parseModFile(buffer));
        const tomographies = [];
        const numTomographies = interp.getDimensionSizes()[1];
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < numTomographies; i++) {
          const tomography = interp.getSpectrum(0, i);
          tomographies.push(tomography);
          for (let j = 0; j < tomography.length; j++) {
            if (min > tomography[j]) {
              min = tomography[j]
            }
            if (max < tomography[j]) {
              max = tomography[j];
            }
          }
        }
        this.setState({ tomography: {
          min,
          max,
          tomographies
        }});
      })
      .catch(err => { console.error(err); alert(err); });
    ;
  }
  componentWillReceiveProps() {
    if (!this.props.state.has('colorMap')) {
      return;
    }
    const stops = this.props.state.get('colorMap').toJS();
    this.colorMap = new ColorMap(100, stops);
  }
  componentDidUpdate() {
    if (!this.viewer) {
      return;
    }
    this.viewer.redrawVolumes();
  }
  componentDidMount() {
    const component = this;
    this.viewer = window.BrainBrowser.VolumeViewer.start("tomography-viewer-container", function(viewer) {
      viewer.loadDefaultColorMapFromURL('static/color-maps/gray-scale.txt');
      // Set the size of slice display panels.
      viewer.setPanelSize(PANEL_SIZE, PANEL_SIZE);
      // Start rendering.
      viewer.loadVolumes({
        volumes: [
          {
            type: 'nifti1',
            nii_url: 'static/data/atlas/mni_icbm152_t1_tal_nlin_sym_09c.nii',
          },
          {
            type: 'nifti1',
            nii_url: 'static/data/atlas/mni_icbm152_gm_tal_nlin_sym_09c.nii',
          }
        ],
        overlay: {}
      });
      viewer.addEventListener('volumeuiloaded', (event) => {
        if (event.volume_id !== DISPLAY_INDEX) {
          event.container.parentElement.removeChild(event.container);
        }
      });
      viewer.addEventListener('volumesloaded', () => {
        const displayVolume = viewer.volumes[DISPLAY_INDEX];
        const maskVolume = viewer.volumes[MASK_INDEX];
        displayVolume.blend_ratios[0] = 0.85;
        displayVolume.blend_ratios[1] = 1.00;
        displayVolume.setColormapFunction(MASK_INDEX, component.interpolateTomographyColor.bind(component, maskVolume));
        displayVolume.setColormapFunction(MASK_INDEX, component.interpolateTomographyColor.bind(component, maskVolume));
        const parsePoints = (text) => text.split("\n")
          .map(s => new Float32Array(s.trim().split(/\s+/).map(n => Number(n))))
        ;
        const header = maskVolume.header;
        const makeOverlapIndexMaps = (points) => {
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
        window.fetch('static/data/atlas/ETCgrid.txt')
          .then(res => res.text())
          .then(text => {
            const points = parsePoints(text);
            const pointsMaps = makeOverlapIndexMaps(points);
            const sparseMaps = component.state.sparseMaps.concat([pointsMaps]);
            component.setState({ sparseMaps });
          });
        ;
        window.fetch('static/data/atlas/ETCBGgrid.txt')
          .then(res => res.text())
          .then(text => {
            const points = parsePoints(text);
            const pointsMaps = makeOverlapIndexMaps(points);
            const sparseMaps = component.state.sparseMaps.concat([pointsMaps]);
            component.setState({ sparseMaps });
          });
        ;
        component.setState({ loaded: true });
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
    const startFrequency = this.props.state.get('startFrequency');
    const frequency = this.props.state.get('cursorFreq') || startFrequency;
    const frequencyStep = this.props.state.get('frequencyStep');
    const freqIndex = Math.max(0, Math.floor((frequency - startFrequency) / frequencyStep));
    if (!this.state.tomography || !this.state.tomography.tomographies[freqIndex]) {
      return [0x00, 0x00, 0x00, 0x00];
    }
    const tomography = this.state.tomography.tomographies[freqIndex];
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
    const minValue = this.state.tomography.min;
    const maxValue = this.state.tomography.max;
    const mid = (minValue + maxValue) / 2;
    t = 0.5 + (t - mid) / (maxValue - minValue);
    t = Math.max(0, Math.min(0.999, t));
    return this.colorMap.interpolate(t);
  }
  render() {
    return (
      <div id="tomography-viewer-container">
        <button onClick={() => { this.viewer.resetDisplays(); this.viewer.redrawVolumes(); }}>
          reset viewports
        </button>
        { this.state.loaded ? null : <div>Loading...</div> }
      </div>
    )
  }
}
