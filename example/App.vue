<template>
  <div id="app" class="container-fluid">
    <div class="row main-row">
      <div class="col-3">
        <div class="card control-left">
          <div class="card-header">Props</div>
          <div class="card-body">
            <div class="form-horizontal">
              <div class="form-group">
                <label for="showLabels" class="control-label"
                  >Show Labels</label
                >

                <select
                  id="showLabels"
                  class="form-control"
                  v-model="showLabels"
                >
                  <option :value="false">No</option>
                  <option :value="true">Yes</option>
                  <option :value="showLabelsFunction">Custom</option>
                </select>
              </div>

              <div class="form-group custo-checkbox">
                <label for="colorScheme" class="control-label"
                  >Use custom color scheme</label
                >
                <div>
                  <input
                    id="override"
                    type="checkbox"
                    v-model="overrideColorScale"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="colorScheme" class="control-label"
                  >Color scheme</label
                >

                <select
                  id="colorScheme"
                  class="form-control"
                  v-model="colorScheme"
                  :disabled="overrideColorScale"
                >
                  <option
                    v-for="(scheme, index) in colorSchemes"
                    :key="index"
                    :value="scheme.value"
                  >
                    {{ scheme.text }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="minAngleDisplayed"
                  >Minimal arc angle to be displayed</label
                >
                <div>
                  <input
                    id="minAngleDisplayed"
                    class="form-control"
                    type="range"
                    min="0"
                    step="0.005"
                    max="0.5"
                    v-model.number="minAngleDisplayed"
                  />
                </div>
                <div>
                  <p>{{ minAngleDisplayed }} radian</p>
                </div>
              </div>

              <div class="form-group">
                <label for="centralCircleRelativeSize"
                  >Central circle relative size</label
                >
                <div>
                  <input
                    id="centralCircleRelativeSize"
                    class="form-control"
                    type="range"
                    min="0"
                    step="1"
                    max="50"
                    v-model.number="centralCircleRelativeSize"
                  />
                </div>
                <div>
                  <p>{{ centralCircleRelativeSize }} %</p>
                </div>
              </div>

              <div class="form-group">
                <label for="inAnimationDuration">Duration animation in</label>
                <div>
                  <input
                    id="inAnimationDuration"
                    class="form-control"
                    type="range"
                    min="0"
                    max="250"
                    v-model.number="inAnimationDuration"
                  />
                </div>
                <div>
                  <p>{{ inAnimationDuration }} ms</p>
                </div>
              </div>

              <div class="form-group">
                <label for="minAngleDisplayed">Duration animation out</label>
                <div>
                  <input
                    id="outAnimationDuration"
                    class="form-control"
                    type="range"
                    min="0"
                    max="2000"
                    v-model.number="outAnimationDuration"
                  />
                </div>
                <div>
                  <p>{{ outAnimationDuration }} ms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-9">
        <div class="card control-middle">
          <div class="card-header">Sunburst</div>
          <div class="card-body father">
            <sunburst
              id="resizable"
              class="sunburst"
              :data="data"
              :max-label-text="20"
              :centralCircleRelativeSize="centralCircleRelativeSize"
              :showLabels="showLabels"
              :minAngleDisplayed="minAngleDisplayed"
              :colorScheme="colorScheme"
              :colorScale="colorScale"
              :inAnimationDuration="inAnimationDuration"
              :outAnimationDuration="outAnimationDuration"
            >
              <breadcrumbTrail
                slot="legend"
                slot-scope="{ nodes, colorGetter, width }"
                :current="nodes.mouseOver"
                :root="nodes.root"
                :colorGetter="colorGetter"
                :from="nodes.zoomed"
                :width="width"
              />

              <nodeInfoDisplayer
                slot="top"
                slot-scope="{ nodes }"
                :current="nodes.mouseOver"
                :root="nodes.root"
                :clicked="nodes.clicked"
                description="of selected"
              />

              <template slot="pop-up" slot-scope="{ data }">
                <div class="pop-up">{{data.name}}</div>
              </template>

              <template slot-scope="{ on, actions }">
                <highlightOnHover v-bind="{ on, actions }" />
                <zoomOnClick v-bind="{ on, actions }" />
                <popUpOnHover  v-bind="{ on, actions }"/>
              </template>
            </sunburst>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import $ from "jquery";
import "jquery-ui/ui/widgets/resizable.js";

import sunburst from "@/components/sunburst";
import nodeInfoDisplayer from "@/components/nodeInfoDisplayer";
import breadcrumbTrail from "@/components/breadcrumbTrail";
//behaviours
import highlightOnHover from "@/components/behavior/highlightOnHover";
import zoomOnClick from "@/components/behavior/zoomOnClick";
import popUpOnHover from "@/components/behavior/popUpOnHover";

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
      minAngleDisplayed: 0.01,
      colorScheme: colorSchemesNames[0].value,
      colorSchemes: colorSchemesNames,
      inAnimationDuration: 100,
      outAnimationDuration: 1000,
      overrideColorScale: false,
      centralCircleRelativeSize: 25,
      showLabels: false,
      custoColorScale: scaleOrdinal([
        "#e39b89",
        "#31ea74",
        "#3c7227",
        "#9dad1f"
      ])
    };
  },
  computed: {
    colorScale() {
      return this.overrideColorScale ? this.custoColorScale : null;
    }
  },
  methods: {
    showLabelsFunction(d) {
      const {
        data,
        context: { angle, relativeDepth }
      } = d;
      if (relativeDepth > 2 || angle < 5) {
        return null;
      }
      return data.name;
    }
  },
  mounted() {
    $("#resizable").resizable({
      containment: "parent"
    });
  },
  components: {
    sunburst,
    nodeInfoDisplayer,
    breadcrumbTrail,
    highlightOnHover,
    zoomOnClick,
    popUpOnHover
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

  .pop-up {
    background-color: white;
    border: black;
    pointer-events: none;
    opacity: 0.92;
  }

  .main-row {
    height: 800px;
  }

  .control-middle {
    height: 600px;
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
    width: 100%;
    height: 100%;
    position: relative;
  }

  .custo-checkbox {
    display: flex;
    justify-content: space-between;
  }
}
</style>
