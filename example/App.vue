<template>
  <div id="app" class="container-fluid">
    <div class="row main-row">
      <div class="col-3">
        <div class="card control-left">
          <div class="card-header">Props</div>
          <div class="card-body">
            <div class="form-horizontal">
              <div class="form-group">
                <label for="minAngleDisplayed">minAngleDisplayed</label>
                <div>
                  <input id="minAngleDisplayed" class="form-control" type="range" min="0" step="0.005" max="0.5" v-model.number="minAngleDisplayed">
                </div>
                <div>
                  <p>{{minAngleDisplayed}}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-9">
        <div class="card control-left">
          <div class="card-header">Sunburst</div>
          <div class="card-body father-draggable">
            <vue-draggable-resizable :w="500" :h="500" :parent="true">
              <sunburst id="sunburst" :data="data" :minAngleDisplayed="minAngleDisplayed" />
            </vue-draggable-resizable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { sunburst } from "@/sunburst";
import VueDraggableResizable from "vue-draggable-resizable";
import data from "../data/data";

export default {
  name: "app",
  data() {
    return {
      data,
      minAngleDisplayed: 0.05
    };
  },
  components: {
    sunburst,
    VueDraggableResizable
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

  .father-draggable {
    position: relative;
    width: 100%;
    height: 100%;
  }

  #sunburst {
    width: 100%;
    height: 100%;
  }
}
</style>
