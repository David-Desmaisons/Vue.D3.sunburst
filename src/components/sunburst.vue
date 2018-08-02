<template>
  <div class="viewport" v-resize="resize">
  </div>
</template>
<script>
import resize from "vue-resize-directive";
import { colorSchemes } from "../infra/colorSchemes";
import { arc, hierarchy, partition, select } from "d3";

const arcSunburst = arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(d => Math.sqrt(d.y1));

function getParents(node) {
  if (node == null) {
    return [];
  }
  return [node, ...getParents(node.parent)];
}

function recursiveName(node) {
  const res = getParents(node)
    .map(node => node.data.name)
    .join("-");
  return res;
}

const getCategoryColor = (scale, d) => scale(d.data.name);

export default {
  name: "sunburst",

  props: {
    /**
     * Sunburst data where children property is a array containing children.
     */
    data: {
      type: Object,
      required: true
    },
    /**
     * D3 color scheme to be used.
     */
    colorScheme: {
      type: String,
      required: false,
      default: "schemeCategory10",
      validator: value => Object.keys(colorSchemes).indexOf(value) !== -1
    },
    /**
     * Function used to map an item and its color.
     * (nodeD3: Object) => color: String
     */
    getColorForNode: {
      type: Function,
      required: false,
      default: getCategoryColor
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
    }
  },

  directives: {
    resize
  },

  data() {
    return {};
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
      this.root = hierarchy(data)
        .sum(d => d.size)
        .sort((a, b) => b.value - a.value);

      this.nodes = this.partition(this.root)
        .descendants()
        .filter(d => Math.abs(d.x1 - d.x0) > this.minAngleDisplayed);

      const pathes = this.getPathes();
      const colorGetter = this.getColorForNode.bind(this, this.colorScale);

      pathes
        .enter()
        .append("svg:path")
        .attr("display", d => (d.depth ? null : "none"))
        .style("opacity", 1)
        .merge(pathes)
        .attr("d", arcSunburst)
        .style("fill", colorGetter);

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
      this.partition = partition().size([
        2 * Math.PI,
        this.radius * this.radius
      ]);
      this.onData(this.data);
    },

    /**
     * @private
     */
    reDraw() {
      this.onData(this.data);
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
    data(current) {
      this.onData(current);
    },
    colorScheme() {
      const colorGetter = this.getColorForNode.bind(this, this.colorScale);
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
