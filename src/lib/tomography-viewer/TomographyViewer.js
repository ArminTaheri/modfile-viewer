import React, { Component } from 'react';
import './TomographyViewer.css';

const PANEL_SIZE = 256
export default class TomographyViewer extends Component {
  constructor(props) {
    super(props);
    this.state = { loaded: false };
  }
  componentWillReceiveProps() {
    if (!this.viewer) {
      return;
    }
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
        if (event.volume_id !== 2) {
          event.container.style.display = 'none';
          return;
        }
        setTimeout(() => {
          event.volume.display.addEventListener('draw', event => {
            component.drawTomography(event.target);
          });
        }, 50);
      });
      viewer.addEventListener('volumesloaded', () => {
        viewer.volumes[2].blend_ratios[0] = 1.0
        viewer.volumes[2].blend_ratios[1] = 1.0
        viewer.redrawVolumes();
        component.setState({ loaded: true });
      });
      viewer.render();
    });
  }
  drawTomography(panel) {
    console.log(panel.slice.slices[1].data);
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
