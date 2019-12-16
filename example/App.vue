<template>
  <div id="app" class="container-fluid">
    <div class="row main-row">
      <div class="col-3">
        <div class="card control-left">
          <div class="card-header">Props</div>
          <div class="card-body">
            <div class="form-horizontal">
              <div class="form-group">
                <label for="colorScheme" class="control-label">Color scheme</label>
                <select id="colorScheme" class="form-control" v-model="colorScheme">
                  <option v-for="(scheme,index) in colorSchemes" :key="index" :value="scheme.value">{{scheme.text}}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="minAngleDisplayed">Minimal arc angle to be displayed</label>
                <div>
                  <input id="minAngleDisplayed" class="form-control" type="range" min="0" step="0.005" max="0.5" v-model.number="minAngleDisplayed">
                </div>
                <div>
                  <p>{{minAngleDisplayed}} radian</p>
                </div>
              </div>

              <div class="form-group">
                <label for="inAnimationDuration">Duration animation in</label>
                <div>
                  <input id="inAnimationDuration" class="form-control" type="range" min="0" max="250" v-model.number="inAnimationDuration">
                </div>
                <div>
                  <p>{{inAnimationDuration}} ms</p>
                </div>
              </div>

              <div class="form-group">
                <label for="minAngleDisplayed">Duration animation out</label>
                <div>
                  <input id="outAnimationDuration" class="form-control" type="range" min="0" max="2000" v-model.number="outAnimationDuration">
                </div>
                <div>
                  <p>{{outAnimationDuration}} ms</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      <div class="col-9">
        <div class="card control-left">
          <div class="card-header">Sunburst</div>
          <div class="card-body father">
            <sunburst class="sunburst" :data="data" :minAngleDisplayed="minAngleDisplayed" :colorScheme="colorScheme" :colorScale="colorScale" :inAnimationDuration="inAnimationDuration" :outAnimationDuration="outAnimationDuration">

              <breadcrumbTrail slot="legend" slot-scope="{ nodes, colorGetter, width }" :current="nodes.mouseOver" :root="nodes.root" :colorGetter="colorGetter" :from="nodes.zoomed" :width="width" />

              <nodeInfoDisplayer slot="top" slot-scope="{ nodes }" :current="nodes.mouseOver" :root="nodes.root" :clicked="nodes.clicked" description="of selected" />

              <template slot-scope="{ on, actions }">
                <highlightOnHover v-bind="{ on, actions }" />
                <zoomOnClick v-bind="{ on, actions }" />
              </template>
            </sunburst>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import sunburst from "@/components/sunburst";
import nodeInfoDisplayer from "@/components/nodeInfoDisplayer";
import breadcrumbTrail from "@/components/breadcrumbTrail";
//behaviours
import highlightOnHover from "@/components/behavior/highlightOnHover";
import zoomOnClick from "@/components/behavior/zoomOnClick";

import { colorSchemes } from "@/infra/colorSchemes";
import data from "../data/data";
import { scaleOrdinal } from "d3-scale";

const colorSchemesNames = Object.keys(colorSchemes).map(key => ({
  value: key,
  text: colorSchemes[key].name
}));

export default {
  name: "app",
  data() {
    return {
      data,
      minAngleDisplayed: 0.05,
      colorScheme: colorSchemesNames[0].value,
      colorSchemes: colorSchemesNames,
      inAnimationDuration: 100,
      outAnimationDuration: 1000,
      colorScale: scaleOrdinal(["#e39b89", "#31ea74", "#3c7227", "#9dad1f"])
    };
  },
  methods: {},
  components: {
    sunburst,
    nodeInfoDisplayer,
    breadcrumbTrail,
    highlightOnHover,
    zoomOnClick
  }
};
</script>

<style lang="less">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;

  height: 800px;

  .main-row {
    height: 800px;
  }

  .control-left {
    height: 100%;
  }

  .resizable {
    margin-left: calc(50% - 50px);
  }

  .father {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
  }

  .sunburst {
    width: 500px;
    height: 500px;
    position: relative;
  }
}
</style>
