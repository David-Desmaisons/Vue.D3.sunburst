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

      <div class="pop-up-tree"  :style="popUpStyle">
        <!-- Use this slot as an arc pop-up-->
        <slot v-if="popUpNode"
          name="pop-up"
          :node="popUpNode"
          :data="popUpNode.data"
          :actions="actions"
        >
        </slot>
      </div>

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
import resize from "vue-resize-directive";
import { select } from "d3-selection";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { hierarchy, partition } from "d3-hierarchy";
import { interpolate } from "d3-interpolate";
import { arc } from "d3-shape";
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "transition" }]*/
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

function getDx({ textAngle, currentDx }) {
  if (textAngle <= 180) {
    return 5;
  }
  return !!currentDx && currentDx < -5 ? currentDx : -5;
}

function computeStoreDx(d, context) {
  const nodeValue = context.getNodeValue(d);
  const dx = getDx(nodeValue);
  nodeValue.currentDx = dx;
  return dx;
}

function defaultSort(a, b){
   return b.value - a.value;
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
      type: [Boolean, Function],
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
    },
    /**
     *  Opacity to be applied to none highlighted nodes
     */
    highlightOpacity: {
      type: Number,
      required: false,
      default: 0.3,
      validator: v => v >= 0 && v < 1
    },
    /**
     *  Function used sort level-1 nodes, will be used on the onData function.
     */
    sort: {
      type: Function,
      required: false,
      default: defaultSort,
    },
    /**
     *  If true disable sort on the level-1 nodes.
     */
    disableSort: {
      type: Boolean,
      required: false,
      default: false,
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
      height: null,

      /**
       * @private
       */
      radius: null,

      /**
       * @private
       */
      popUpNode: null
    };
  },

  created() {
    this._cachedNodes = {};
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

    this.vis.append("defs");

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
      const { textAngle } = this.getNodeValue(d);
      return `rotate(${textAngle - 90}) translate(${y},0) rotate(${
        textAngle < 180 ? 0 : 180
      })`;
    },

    /**
     * @private
     */
    getTextAnchor(d) {
      const { textAngle } = this.getNodeValue(d);
      return textAngle < 180 ? "start" : "end";
    },

    /**
     * @private
     */
    arcClass({ depth, height }) {
      return `slice-${depth -
        this.zoomedDepth} depth-${depth} height-${height}`;
    },

    /**
     * @private
     */
    getNodeContext(d) {
      const { zoomedDepth, scaleX } = this;
      const angle = ((scaleX(d.x1) - scaleX(d.x0)) * 180) / Math.PI;
      const relativeDepth = d.depth - zoomedDepth;
      return {
        ...d,
        context: {
          angle,
          relativeDepth
        }
      };
    },

    /**
     * @private
     */
    getCircleClass() {
      return `central-circle depth-${this.zoomedDepth}`;
    },

    /**
     * @private
     */
    addTextAttribute(selection) {
      const {
        getTextAngle,
        getTextTransform,
        getTextAnchor,
        getNodeValue
      } = this;
      const textExtractor = this.getTextExtractor();

      const textSelection = selection
        .each(d => (getNodeValue(d).textValue = textExtractor(d)))
        .attr(
          "display",
          d =>
            getNodeValue(d).textValue === null || d.depth === 0 ? "none" : null
        )
        .filter(d => getNodeValue(d).textValue !== null)
        .each(d => (getNodeValue(d).textAngle = getTextAngle(d)))
        .attr("transform", d => getTextTransform(d))
        .attr("text-anchor", d => getTextAnchor(d))
        .attr("dx", d => computeStoreDx(d, this))
        .text(d => getNodeValue(d).textValue);

      this.adjustText(textSelection);
    },

    /**
     * @private
     */
    getNodeValue({ id }) {
      const { _cachedNodes } = this;
      const cached = _cachedNodes[id];
      if (cached) {
        return cached;
      }
      const value = {};
      _cachedNodes[id] = value;
      return value;
    },

    /**
     * @private
     */
    onData(data, { onlyRedraw = false } = {}) {
      if (!data) {
        this.vis.selectAll("g").remove();
        Object.keys(this.graphNodes).forEach(k => (this.graphNodes[k] = null));
        return;
      }

      if (!onlyRedraw) {
        this.root = hierarchy(data).sum(d => d.size);
        if(!this.disableSort) this.root = this.root.sort(this.sort);

        this.nodes = partition()(this.root).descendants();

        const { arcIdentification } = this;
        this.nodes.forEach(d => {
          d.id = arcIdentification(d);
          Object.freeze(d);
        });
        this._cachedNodes = {};
      }

      const {
        zoomedNode,
        hasCentralCircle,
        getCircle,
        minAngleDisplayed,
        scaleX
      } = this;
      this.scaleY.domain([hasCentralCircle ? zoomedNode.y1 : zoomedNode.y0, 1]);

      const rootNode = this.nodes[0];
      const ringNumber = rootNode.height + 1;
      const definitions = this.vis
        .select("defs")
        .selectAll("clipPath")
        .data([...Array(ringNumber).keys()]);

      definitions
        .enter()
        .append("clipPath")
        .attr("id", id => `clip-${id}`)
        .append("path")
        .attr("clip-rule", "evenodd")
        .merge(definitions.select("path"))
        .attr("d", d => getCircle(d, ringNumber));

      definitions.exit().remove();

      const groups = this.getGroups();
      const colorGetter = this.colorGetter;
      const mouseOver = this.mouseOver.bind(this);
      const click = this.click.bind(this);
      const { arcSunburst, arcClass } = this;
      const self = this;

      const newGroups = groups
        .enter()
        .append("g")
        .attr("fill-opacity", 1);

      const mergedGroups = newGroups
        .merge(groups)
        .attr("class", arcClass)
        .attr(
          "display",
          d => (scaleX(d.x1) - scaleX(d.x0) > minAngleDisplayed ? null : "none")
        );

      if (this.showLabels && this.maxLabelText !== null) {
        mergedGroups.attr("clip-path", d => `url(#clip-${d.depth})`);
      }

      mergedGroups
        .on("mouseover", function(node) {
          mouseOver({ node });
          select(this).attr("clip-path", null);
        })
        .on("mouseleave", function(d) {
          if (!self.showLabels || self.maxLabelText === null) {
            return;
          }
          select(this).attr("clip-path", `url(#clip-${d.depth})`);
        })
        .on("click", click);

      newGroups
        .append("path")
        .each(function(d) {
          copyCurrentValues(this, d);
        })
        .merge(groups.select("path"))
        .attr("fill", d => colorGetter(d.data, d))
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

      if (onlyRedraw) {
        return;
      }

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
    getTextExtractor() {
      if (!this.showLabelsIsFunction) {
        return d => d.data.name;
      }
      const { showLabels, getNodeContext } = this;
      return d => showLabels(getNodeContext(d));
    },

    /**
     * @private
     */
    getGroups() {
      return this.vis.selectAll("g").data(this.nodes, ({ id }) => id);
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

      this.width = width;
      this.height = height;
      this.radius = Math.min(width, height) / 2;
      this.updateScaleY();

      const { hasCentralCircle } = this;
      if (hasCentralCircle) {
        const { mouseOver } = this;
        const circle = onMount
          ? this.vis
              .append("circle")
              .attr("cx", 0)
              .attr("cy", 0)
              .attr("fill", "none")
              .attr("pointer-events", "bounding-box")
              .on("mouseover", () => {
                const {
                  graphNodes: { zoomed }
                } = this;
                if (zoomed === null) {
                  return;
                }
                mouseOver({ node: zoomed, center: true });
              })
              .on("click", () => {
                const parentZoomed = this.getZoomParent();
                if (parentZoomed === null) {
                  return;
                }
                this.click(parentZoomed);
              })
          : this.vis.select("circle.central-circle");
        circle
          .attr("r", this.scaleY.range()[0])
          .attr("class", this.getCircleClass());
      }

      this.onData(this.data, { onlyRedraw: !onMount });
    },

    /**
     * @private
     */
    adjustText(textSelection) {
      const { scaleY, maxLabelText, getNodeValue } = this;
      if (maxLabelText === null) {
        return;
      }
      textSelection
        .filter(function(node) {
          const d = getNodeValue(node);
          if (d.textValue === null || d.textAngle <= 180) {
            return false;
          }
          const textLength = select(this)
            .node()
            .getComputedTextLength();
          const maxLength = scaleY(node.y1) - scaleY(node.y0) + maxLabelText;
          if (textLength + 5 <= maxLength) {
            return false;
          }
          d.currentDx = textLength - maxLength;
          return true;
        })
        .attr("dx", node => getNodeValue(node).currentDx);
    },

    /**
     * @private
     */
    reDraw(options = {}) {
      this.onData(this.data, { onlyRedraw: true, ...options });
    },

    /**
     * @private
     */
    mouseOver({ node, center = false }) {
      this.graphNodes.mouseOver = node;
      /**
       * Fired when mouse is over a sunburst node.
       * @param {Object} value - {node, sunburst} The corresponding node and sunburst component
       */
      this.$emit("mouseOverNode", { node, center, sunburst: this });
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
     * @param {Number} opacity opacity of the none highlighted nodes, default to props highlightOpacity
     */
    highlightPath(node, targetOpacity = null) {
      const opacity =
        targetOpacity === null ? this.highlightOpacity : targetOpacity;
      if (node === this.graphNodes.zoomed && this.hasCentralCircle) {
        this.resetHighlight();
        return;
      }
      const sequenceArray = node.ancestors();

      const visiblePath = this.vis.selectAll("g");

      visiblePath
        .filter(d => sequenceArray.indexOf(d) === -1)
        .attr("fill-opacity", opacity);

      visiblePath
        .filter(d => sequenceArray.indexOf(d) >= 0)
        .attr("fill-opacity", 1);

      this.setHighligth(node);
    },

    /**
     * Zoom to a given node.
     * @param {Object} node the D3 node to zoom to.
     */
    zoomToNode(node) {
      if (this.hasCentralCircle && node.height === 0) {
        node = node.parent;
      }
      this.graphNodes.zoomed = node;

      /**
       * Fired when the zoomed node changed.
       * @param {Object} value - {node, sunburst} The corresponding zoomed node and sunburst component
       */
      this.$emit("zoomedChanged", { node, sunburst: this });

      const descendants = node.descendants();
      const textNodes = this.vis.selectAll("text");

      const updateText = () => {
        const futureVisibleArcs = textNodes
          .filter(d => d !== node && descendants.includes(d))
          .attr("display", null);

        if (!this.showLabelsIsFunction) {
          this.adjustText(textNodes);
          return;
        }
        this.addTextAttribute(futureVisibleArcs);
      };

      textNodes
        .filter(d => d === node || descendants.indexOf(d) === -1)
        .attr("display", "none");

      const {
        getNodeValue,
        getTextAngle,
        getTextTransform,
        arcSunburst,
        getTextAnchor,
        hasCentralCircle,
        minAngleDisplayed,
        arcClass
      } = this;
      this.vis.selectAll("g").attr("class", arcClass);

      this.vis
        .select("circle.central-circle")
        .attr("class", this.getCircleClass());

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

      let countDown = 0;
      transitionSelection
        .selectAll("text")
        .filter(d => getNodeValue(d).textValue !== null)
        .each(() => countDown++)
        .tween("text.angle", d => () =>
          (getNodeValue(d).textAngle = getTextAngle(d))
        )
        .attrTween("transform", d => () => getTextTransform(d))
        .attrTween("text-anchor", d => () => getTextAnchor(d))
        .attrTween("dx", d => () => computeStoreDx(d, this))
        .on("end", () => {
          if (--countDown === 0) {
            updateText();
          }
        });

      transitionSelection
        .selectAll("path")
        .attrTween("d", nd => () => arcSunburst(nd));

      if (minAngleDisplayed > 0) {
        transitionSelection
          .selectAll("g")
          .filter(d => descendants.includes(d))
          .attrTween("display", d => () => {
            const { scaleX } = this;
            return scaleX(d.x1) - scaleX(d.x0) > minAngleDisplayed
              ? null
              : "none";
          });
      }

      const { getCircle } = this;
      this.vis
        .select("defs")
        .selectAll("path")
        .transition("zoom")
        .duration(750)
        .attrTween("d", d => () => getCircle(d));
    },

    /**
     * @private
     */
    getCircle(d, ringNumberValue = null) {
      const ringNumber =
        ringNumberValue != null
          ? ringNumberValue
          : this.graphNodes.root.height + 1;
      const { maxLabelText, scaleY } = this;
      const offSet = maxLabelText || 0;
      const fromCircle = scaleY((d + 1) / ringNumber);
      return arc()
        .innerRadius(scaleY(d / ringNumber))
        .outerRadius(fromCircle + offSet)
        .startAngle(0)
        .endAngle(360)();
    },

    /**
     * Reset the highlighted path
     */
    resetHighlight() {
      this.vis.selectAll("g").attr("fill-opacity", 1);

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
    },

    /**
     * @private
     */
    closeContextMenu() {
      this.popUpNode = null;
    },

    /**
     * @private
     */
    setContextMenu(value) {
      this.popUpNode = value;
    }
  },

  computed: {
    /**
     * @private
     */
    actions() {
      const {
        highlightPath,
        zoomToNode,
        resetHighlight,
        closeContextMenu,
        setContextMenu
      } = this;
      return {
        highlightPath,
        zoomToNode,
        resetHighlight,
        setContextMenu,
        closeContextMenu
      };
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
    },

    /**
     * @private
     */
    showLabelsIsFunction() {
      return typeof this.showLabels === "function";
    },

    /**
     * @private
     */
    popUpStyle() {
      const { popUpNode } = this;
      if (popUpNode === null) {
        return null;
      }

      const { width, height } = this;
      const [x, y] = this.arcSunburst.centroid(popUpNode);
      return {
        transform: `translate(${width / 2 + x}px, ${height / 2 + y}px)`
      };
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
        .attr("fill", d => value(d.data));
    },

    showLabels(value) {
      this.vis.selectAll("text").remove();
      if (!value) {
        return;
      }
      if (this.maxLabelText !== null) {
        this.getGroups().attr("clip-path", d => `url(#clip-${d.depth})`);
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
    },

    radius(radius) {
      const { height, width } = this;
      /**
       * Fired when component is resizing.
       * @param {Object} value - {radius, height, width} Size information in pixel
       */
      this.$emit("resize", { radius, height, width });
    }
  }
};
</script>

<style lang="less" scoped>
.pop-up-tree {
  z-index: 1000;
  position: absolute;
  inset: 0px auto auto 0px;
  pointer-events: none;
  will-change: transform;
}

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
    overflow: hidden;
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
