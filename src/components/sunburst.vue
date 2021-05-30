<template>
  <div class="graph">
    <!-- Use this slot to add information on top or bottom of the graph-->
    <slot
      name="legend"
      :width="width"
      :colorGetter="colorGetter"
      :nodes="graphNodes"
      :actions="actions"
    >
    </slot>

    <div class="viewport" v-resize.throttle.250="resize">
      <!-- Use this slot to add information on top of the graph -->
      <slot
        name="top"
        :colorGetter="colorGetter"
        :nodes="graphNodes"
        :actions="actions"
      >
      </slot>

      <!-- Use this slot to add behaviors to the sunburst -->
      <slot :on="on" :actions="actions"> </slot>
    </div>
  </div>
</template>
<script>
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "transition" }]*/

import resize from "vue-resize-directive";
import { select } from "d3-selection";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { hierarchy, partition } from "d3-hierarchy";
import { interpolate } from "d3-interpolate";
import { arc } from "d3-shape";
import { transition } from "d3-transition";
import { colorSchemes } from "../infra/colorSchemes";

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

function arc2Tween(arcSunburst, d, indx) {
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

function getTextWrapper({ padding, width }) {
  // Adapted from: https://stackoverflow.com/a/27723752/965332
  return function() {
    const self = select(this);
    let textLength = self.node().getComputedTextLength();
    let text = self.text();
    while (textLength > width - 2 * padding && text.length > 0) {
      text = text.slice(0, -1);
      self.text(text + "\u2026");
      textLength = self.node().getComputedTextLength();
    }
  };
}

const useNameForColor = d => d.name;
const miminalRadius = 20;

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
     * D3 color scale.
     */
    colorScale: {
      type: Function,
      required: false
    },
    /**
     * Function used to map an item and its color.
     * (nodeD3: Object) => category: Number | String
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
    },
    /**
     *  If true display name attributes as arc labels
     */
    showLabels: {
      type: Boolean,
      required: false,
      default: false
    },
    /**
     *  Max size for label, if null text will not be truncated
     */
    maxLabelText: {
      type: Number,
      required: false,
      default: 45
    },
    /**
     *  Size in percentage of the total graph, of a central circle
     */
    centralCircleRelativeSize: {
      type: Number,
      required: false,
      default: 0,
      validator: v => v >= 0 && v < 100
    }
  },

  directives: {
    resize
  },

  data() {
    const { centralCircleRelativeSize } = this;
    const scaleX = scaleLinear()
      .range([0, 2 * Math.PI])
      .clamp(true);
    const scaleY = scaleSqrt().clamp(centralCircleRelativeSize > 0);

    this.scaleX = scaleX;
    this.scaleY = scaleY;

    this.arcSunburst = arc()
      .startAngle(d => scaleX(d.x0))
      .endAngle(d => scaleX(d.x1))
      .innerRadius(d => Math.max(0, scaleY(d.y0)))
      .outerRadius(d => Math.max(0, scaleY(d.y1)));

    return {
      /**
       * @private
       */
      graphNodes: {
        clicked: null,
        mouseOver: null,
        zoomed: null,
        root: null,
        highlighted: null
      },

      /**
       * @private
       */
      width: null,

      /**
       * @private
       */
      height: null
    };
  },

  mounted() {
    const [viewport] = this.$el.getElementsByClassName("viewport");
    this.viewport = viewport;
    this.vis = select(viewport)
      .append("svg")
      .style("overflow", "visible")
      .attr("class", "root")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g");

    select(viewport).on("mouseleave", () => {
      /**
       * Fired when mouse leaves the sunburst node.
       */
      this.$emit("mouseLeave");
      this.graphNodes.mouseOver = null;
    });

    this.resize(true);
  },

  methods: {
    /**
     * @private
     */
    getSize() {
      var width = this.viewport.clientWidth;
      var height = this.viewport.clientHeight;
      return { width, height };
    },

    /**
     * @private
     */
    getTextAngle(d) {
      const { scaleX } = this;
      return (scaleX((d.x0 + d.x1) / 2) * 180) / Math.PI;
    },

    /**
     * @private
     */
    getTextTransform(d) {
      const { scaleY } = this;
      const y = scaleY(d.y0);
      return `rotate(${d.textAngle - 90}) translate(${y},0) rotate(${
        d.textAngle < 180 ? 0 : 180
      })`;
    },

    /**
     * @private
     */
    getTextAnchor(d) {
      return d.textAngle < 180 ? "start" : "end";
    },

    /**
     * @private
     */
    addTextAttribute(selection) {
      const {
        graphNodes: { zoomed },
        getTextAngle,
        getTextTransform,
        getTextAnchor
      } = this;
      const descendants = zoomed === null ? null : zoomed.descendants();
      const textSelection = selection
        .each(d => (d.textAngle = getTextAngle(d)))
        .attr("transform", d => getTextTransform(d))
        .attr("text-anchor", d => getTextAnchor(d))
        .attr("dx", d => (d.textAngle > 180 ? -3 : 3))
        .attr("display", d => (d.depth ? null : "none"))
        .text(d => d.data.name)
        .style(
          "opacity",
          d =>
            zoomed != null && (d === zoomed || descendants.indexOf(d) === -1)
              ? 0
              : 1
        );
      const { maxLabelText: width } = this;
      if (width) {
        const wrap = getTextWrapper({ width, padding: 0 });
        textSelection.each(wrap);
      }
    },

    /**
     * @private
     */
    onData(data, onlyRedraw = false) {
      if (!data) {
        this.vis.selectAll("g").remove();
        Object.keys(this.graphNodes).forEach(k => (this.graphNodes[k] = null));
        return;
      }

      if (!onlyRedraw) {
        this.root = hierarchy(data)
          .sum(d => d.size)
          .sort((a, b) => b.value - a.value);
      }

      this.nodes = partition()(this.root)
        .descendants()
        .filter(
          d => Math.abs(this.scaleX(d.x1 - d.x0)) > this.minAngleDisplayed
        );

      const rootNode = this.nodes[0];
      const { zoomedNode, hasCentralCircle } = this;
      this.scaleY.domain([hasCentralCircle ? zoomedNode.y1 : zoomedNode.y0, 1]);     

      const groups = this.getGroups();
      const colorGetter = this.colorGetter;
      const mouseOver = this.mouseOver.bind(this);
      const click = this.click.bind(this);
      const { arcSunburst, zoomedDepth } = this;

      const newGroups = groups
        .enter()
        .append("g")
        .style("opacity", 1);

      newGroups
        .merge(groups)
        .attr("class", d => `slice-${d.depth - zoomedDepth}`);

      newGroups
        .append("path")
        .on("mouseover", mouseOver)
        .on("click", click)
        .each(function(d) {
          copyCurrentValues(this, d);
        })
        .merge(groups.select("path"))
        .style("fill", d => colorGetter(d.data, d))
        .transition("enter")
        .duration(this.inAnimationDuration)
        .attrTween("d", function(d, index) {
          return arc2Tween.call(this, arcSunburst, d, index);
        });

      if (this.showLabels) {
        const newTextes = newGroups
          .append("text")
          .attr("class", "node-info")
          .attr("dy", ".35em");

        this.addTextAttribute(newTextes.merge(groups.select("text")));
      }

      groups.exit().remove();

      this.graphNodes.root = rootNode;
      /**
       * Fired when root changed.
       * @param {Object} value - {node, sunburst} The corresponding node and sunburst component
       */
      this.$emit("rootChanged", { node: rootNode, sunburst: this });
    },

    /**
     * @private
     */
    getGroups() {
      return this.vis.selectAll("g").data(this.nodes, this.arcIdentification);
    },

    /**
     * @private
     */
    resize(context) {
      const onMount = context === true;
      const { width, height } = this.getSize();
      this.vis
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${width / 2}, ${height / 2} )`);

      this.radius = Math.min(width, height) / 2;
      this.updateScaleY();

      const { hasCentralCircle } = this;
      if (hasCentralCircle) {
        const circle = onMount
          ? this.vis
              .append("circle")
              .attr("cx", 0)
              .attr("cy", 0)
              .attr("fill", "none")
              .attr("pointer-events", "bounding-box")
              .attr("class", "central-circle")
              .on("mouseover", () => {
                const {
                  graphNodes: { zoomed }
                } = this;
                if (zoomed === null) {
                  return;
                }
                this.mouseOver(zoomed);
              })
              .on("click", () => {
                const parentZoomed = this.getZoomParent();
                if (parentZoomed === null) {
                  return;
                }
                this.click(parentZoomed);
              })
          : this.vis.select("circle");
        circle.attr("r", this.scaleY.range()[0]);
      }

      this.onData(this.data, !onMount);
      this.width = width;
      this.height = height;
    },

    /**
     * @private
     */
    reDraw() {
      this.onData(this.data, true);
    },

    /**
     * @private
     */
    mouseOver(value) {
      this.graphNodes.mouseOver = value;
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
      this.graphNodes.clicked = value;
      /**
       * Fired when sunburst node is clicked.
       * @param {Object} value - {node, sunburst} The corresponding node and sunburst component
       */
      this.$emit("clickNode", { node: value, sunburst: this });
    },

    /**
     * @private
     */
    getZoomParent() {
      const {
        graphNodes: { zoomed }
      } = this;
      if (zoomed === null) {
        return null;
      }
      return zoomed.parent;
    },

    /**
     * Highlight the arc path leading to a given node.
     * @param {Object} node the D3 node to highlight
     * @param {Number} opacity opacity of the none highlighted nodes, default to 0.3
     */
    highlightPath(node, opacity = 0.3) {
      const sequenceArray = node.ancestors();

      const visiblePath = this.vis.selectAll("g");

      visiblePath
        .filter(d => sequenceArray.indexOf(d) === -1)
        .transition()
        .duration(this.inAnimationDuration)
        .style("opacity", opacity);

      visiblePath
        .filter(d => sequenceArray.indexOf(d) >= 0)
        .style("opacity", 1);

      this.setHighligth(node);
    },

    /**
     * Zoom to a given node.
     * @param {Object} node the D3 node to zoom to.
     */
    zoomToNode(node) {
      if (
        this.hasCentralCircle &&
        (!node.children || node.children.length === 0)
      ) {
        node = node.parent;
      }
      this.graphNodes.zoomed = node;

      /**
       * Fired when the zoomed node changed.
       * @param {Object} value - {node, sunburst} The corresponding zoomed node and sunburst component
       */
      this.$emit("zoomedChanged", { node, sunburst: this });

      const descendants = node.descendants();
      this.vis
        .selectAll("text")
        .transition()
        .delay(200)
        .duration(550)
        .style(
          "opacity",
          d => (d === node || descendants.indexOf(d) === -1 ? 0 : 1)
        );

      const {
        zoomedDepth,
        getTextAngle,
        getTextTransform,
        arcSunburst,
        getTextAnchor,
        hasCentralCircle
      } = this;
      this.vis
        .selectAll("g")
        .attr("class", d => `slice-${d.depth - zoomedDepth}`);

      const transitionSelection = this.vis
        .transition("zoom")
        .duration(750)
        .tween("scale", () => {
          const { scaleX, scaleY, radius, centralCircleRelativeSize } = this;
          const xd = interpolate(scaleX.domain(), [node.x0, node.x1]);
          const yd = interpolate(scaleY.domain(), [
            hasCentralCircle ? node.y1 : node.y0,
            1
          ]);
          const miminalY = (radius * centralCircleRelativeSize) / 100;
          const firstY =
            miminalY === 0 && node.y0 > 0 ? miminalRadius : miminalY;
          const yr = interpolate(scaleY.range(), [firstY, radius]);
          return t => {
            scaleX.domain(xd(t));
            scaleY.domain(yd(t)).range(yr(t));
          };
        });

      transitionSelection
        .selectAll("text")
        .tween("text.angle", d => {
          return () => (d.textAngle = getTextAngle(d));
        })
        .attrTween("transform", d => () => getTextTransform(d))
        .attrTween("text-anchor", d => () => getTextAnchor(d))
        .attrTween("dx", d => () => (d.textAngle > 180 ? -3 : 3));

      transitionSelection
        .selectAll("path")
        .attrTween("d", nd => () => arcSunburst(nd));
    },

    /**
     * Reset the highlighted path
     */
    resetHighlight() {
      this.vis
        .selectAll("g")
        .transition()
        .duration(this.outAnimationDuration)
        .style("opacity", 1);

      this.setHighligth(null);
    },

    /**
     * @private
     */
    setHighligth(node) {
      this.graphNodes.highlighted = node;
      /**
       * Fired when mouse is over a sunburst node.
       * @param {Object} value - {node, sunburst} The corresponding node and sunburst component
       */
      this.$emit("highlightedChanged", { node, sunburst: this });
    },

    /**
     * @private
     */
    updateScaleY() {
      const { radius, scaleY, zoomedDepth, centralCircleRelativeSize } = this;
      const scaleYMin =
        centralCircleRelativeSize === 0 && zoomedDepth > 0
          ? miminalRadius
          : (radius * centralCircleRelativeSize) / 100;
      return scaleY.range([scaleYMin, radius]);
    }
  },

  computed: {
    /**
     * @private
     */
    actions() {
      const { highlightPath, zoomToNode, resetHighlight } = this;
      return { highlightPath, zoomToNode, resetHighlight };
    },

    /**
     * @private
     */
    on() {
      return this.$on.bind(this);
    },

    /**
     * @private
     */
    colorGetter() {
      const colorScale =
        this.colorScale || colorSchemes[this.colorScheme].scale;
      return d => colorScale(this.getCategoryForColor(d));
    },

    /**
     * @private
     */
    zoomedDepth() {
      const { zoomed } = this.graphNodes;
      return zoomed === null ? 0 : zoomed.depth;
    },

    /**
     * @private
     */
    zoomedNode() {
      const { zoomed } = this.graphNodes;
      return zoomed || this.root;
    },

    /**
     * @private
     */
    hasCentralCircle() {
      const { centralCircleRelativeSize } = this;
      return centralCircleRelativeSize > 0;
    }
  },

  watch: {
    data: {
      handler(current) {
        this.onData(current);
      },
      deep: true
    },

    colorGetter(value) {
      this.getGroups()
        .select("path")
        .style("fill", d => value(d.data));
    },

    showLabels(value) {
      if (!value) {
        this.vis.selectAll("text").remove();
        return;
      }
      const labels = this.vis
        .selectAll("g")
        .append("text")
        .attr("class", "node-info")
        .attr("dy", ".35em");
      this.addTextAttribute(labels);
    },

    minAngleDisplayed() {
      this.reDraw();
    },

    centralCircleRelativeSize() {
      const { hasCentralCircle } = this;
      this.updateScaleY().clamp(hasCentralCircle);
      this.reDraw();
    }
  }
};
</script>

<style lang="less" scoped>
.graph {
  height: 100%;
  width: 100%;
  display: flex;
  flex-flow: column wrap;
}

.viewport {
  width: 100%;
  flex: 1 1 auto;
}
</style>

<style lang="less">
svg {
  text.node-info {
    pointer-events: none;
    font-size: 8px;
  }

  .addTextSize (@index) when (@index > 0) {
    .slice-@{index} {
      text.node-info {
        font-size: unit(12-@index, px);
      }
    }
    .addTextSize(@index - 1);
  }
  .addTextSize(4);
}
</style>
