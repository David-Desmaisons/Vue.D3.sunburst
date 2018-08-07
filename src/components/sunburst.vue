<template>
  <div class="viewport" v-resize="resize">
    <slot :vis="vis" :colorScale="colorScale" :lastClickedNode="lastClickedNode" :lastMouseOverNode="lastMouseOverNode" :rootNode="rootNode" :highlightPath="highlightPath" :zoomToNode="zoomToNode">
    </slot>
  </div>
</template>
<script>
import resize from "vue-resize-directive";
import { colorSchemes } from "../infra/colorSchemes";
import {
  arc,
  hierarchy,
  interpolate,
  partition,
  scaleLinear,
  scaleSqrt,
  select
} from "d3";

const scaleX = scaleLinear()
  .range([0, 2 * Math.PI])
  .clamp(true);

const scaleY = scaleSqrt().range([0, 1]);

const arcSunburst = arc()
  .startAngle(d => scaleX(d.x0))
  .endAngle(d => scaleX(d.x1))
  .innerRadius(d => Math.max(0, scaleY(d.y0)))
  .outerRadius(d => Math.max(0, scaleY(d.y1)));

function recursiveName(node) {
  const res = node
    .ancestors()
    .map(node => node.data.name)
    .join("-");
  return res;
}

function copyCurrentValues(to, from) {
  const { x0, x1, y0, y1 } = from;
  to._current = { x0, x1, y0, y1 };
}

function arc2Tween(d, indx) {
  const positionsKeys = ["x0", "x1", "y0", "y1"];
  const interpolates = {};
  positionsKeys.forEach(key => {
    interpolates[key] = interpolate(this._current[key], d[key]);
  });
  copyCurrentValues(this, d);

  return function(t) {
    const tmp = {};
    positionsKeys.forEach(key => {
      tmp[key] = interpolates[key](t);
    });
    return arcSunburst(tmp, indx);
  };
}

const useNameForColor = d => d.data.name;

export default {
  name: "sunburst",

  inject: {
    defaultSchemeColor: {
      default: Object.keys(colorSchemes)[0]
    }
  },

  props: {
    /**
     * Sunburst data where children property is a array containing children.
     */
    data: {
      type: Object,
      required: false
    },
    /**
     * D3 color scheme to be used.
     */
    colorScheme: {
      type: String,
      required: false,
      default() {
        return this.defaultSchemeColor;
      },
      validator: value => Object.keys(colorSchemes).indexOf(value) !== -1
    },
    /**
     * Function used to map an item and its color.
     * (nodeD3: Object) => color: Number | String
     * By default use the node name
     */
    getCategoryForColor: {
      type: Function,
      required: false,
      default: useNameForColor
    },
    /**
     * Minimal arc angle to be displayed (in radian).
     */
    minAngleDisplayed: {
      type: Number,
      required: false,
      default: 0.005
    },
    /**
     * Function used to identify an arc, will be used during graph updates.
     * (nodeD3: Object) => id: String
     * @default id based on recursive agregation of node parent name
     */
    arcIdentification: {
      type: Function,
      required: false,
      default: recursiveName
    },
    /**
     *  Duration for in animation in milliseconds
     */
    inAnimationDuration: {
      type: Number,
      required: false,
      default: 100
    },
    /**
     *  Duration for out animation in milliseconds
     */
    outAnimationDuration: {
      type: Number,
      required: false,
      default: 1000
    }
  },

  directives: {
    resize
  },

  data() {
    return {
      vis: null,
      lastClickedNode: null,
      lastMouseOverNode: null,
      rootNode: null
    };
  },

  mounted() {
    this.vis = select(this.$el)
      .append("svg")
      .style("overflow", "visible")
      .attr("class", "root");
    this.resize();
  },

  methods: {
    /**
     * @private
     */
    getSize() {
      var width = this.$el.clientWidth;
      var height = this.$el.clientHeight;
      return { width, height };
    },

    /**
     * @private
     */
    onData(data) {
      if (!data) {
        this.vis.selectAll("path").remove();
        return;
      }

      this.root = hierarchy(data)
        .sum(d => d.size)
        .sort((a, b) => b.value - a.value);

      this.nodes = partition()(this.root)
        .descendants()
        .filter(d => Math.abs(scaleX(d.x1 - d.x0)) > this.minAngleDisplayed);

      const pathes = this.getPathes();
      const colorGetter = d => this.colorScale(this.getCategoryForColor(d));
      const mouseOver = this.mouseOver.bind(this);
      const click = this.click.bind(this);

      pathes
        .enter()
        .append("path")
        // .attr("display", d => (d.depth ? null : "none"))
        .style("opacity", 1)
        .on("mouseover", mouseOver)
        .on("click", click)
        .each(function(d) {
          copyCurrentValues(this, d);
        })
        .merge(pathes)
        .style("fill", colorGetter)
        .transition("enter")
        .duration(this.inAnimationDuration)
        .attrTween("d", arc2Tween);

      pathes.exit().remove();
    },

    /**
     * @private
     */
    getPathes() {
      return this.vis
        .selectAll("path")
        .data(this.nodes, this.arcIdentification);
    },

    /**
     * @private
     */
    resize() {
      const { width, height } = this.getSize();
      this.vis
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${width / 2}, ${height / 2} )`);

      this.radius = Math.min(width, height) / 2;
      const [scaleYMin] = scaleY.range();
      scaleY.range([scaleYMin, this.radius]);

      this.onData(this.data);
    },

    /**
     * @private
     */
    reDraw() {
      this.onData(this.data);
    },

    /**
     * @private
     */
    mouseOver(value) {
      this.lastClickedNode = value;
      /**
       * Fired when mouse is over a sunburst node.
       * @param {Object} value - {node, sunburst} The corresponding node and sunburst component
       */
      this.$emit("mouseOverNode", { node: value, sunburst: this });
    },

    /**
     * @private
     */
    click(value) {
      this.lastMouseOverNode = value;
      /**
       * Fired when sunburst node is cliscked.
       * @param {Object} value - {node, sunburst} The corresponding node and sunburst component
       */
      this.$emit("clickNode", { node: value, sunburst: this });
    },

    /**
     * Highlight the arc path leading to a given node.
     * @param {Object} node the D3 node to highlight
     * @param {Number} opacity opacity of the none highlighted nodes, default to 0.3
     */
    highlightPath(node, opacity = 0.3) {
      const sequenceArray = node.ancestors();

      this.vis
        .selectAll("path")
        .filter(d => sequenceArray.indexOf(d) === -1)
        .transition()
        .duration(this.inAnimationDuration)
        .style("opacity", opacity);

      this.vis
        .selectAll("path")
        .filter(d => sequenceArray.indexOf(d) >= 0)
        .style("opacity", 1);
    },

    /**
     * Zoom to a given node.
     * @param {Object} node the D3 node to zoom to.
     */
    zoomToNode(d) {
      this.vis
        .transition("zoom")
        .duration(750)
        .tween("scale", () => {
          const xd = interpolate(scaleX.domain(), [d.x0, d.x1]);
          const yd = interpolate(scaleY.domain(), [d.y0, 1]);
          const yr = interpolate(scaleY.range(), [d.y0 ? 20 : 0, this.radius]);

          return t => {
            scaleX.domain(xd(t));
            scaleY.domain(yd(t)).range(yr(t));
          };
        })
        .selectAll("path")
        .attrTween("d", nd => () => arcSunburst(nd));
    },

    /**
     * Reset the highlighted path
     */
    resetHighlight() {
      this.vis
        .selectAll("path")
        .transition()
        .duration(this.outAnimationDuration)
        .style("opacity", 1);
    }
  },

  computed: {
    /**
     * @private
     */
    colorScale() {
      return colorSchemes[this.colorScheme].scale;
    }
  },

  watch: {
    data: {
      handler(current) {
        this.onData(current);
      },
      deep: true
    },

    colorScheme() {
      const colorGetter = d => this.colorScale(this.getCategoryForColor(d));
      this.getPathes().style("fill", colorGetter);
    },

    minAngleDisplayed() {
      this.reDraw();
    }
  }
};
</script>

<style lang="less">
</style>
