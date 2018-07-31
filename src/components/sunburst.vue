<template>
  <div class="viewport" v-resize="resize">
  </div>
</template>
<script>
import resize from "vue-resize-directive";
import { arc, select, hierarchy, partition } from "d3";

const directives = {
  resize
};

const arcSunburst = arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(d => Math.sqrt(d.y1));

function getParents(node) {
  if (node.parent == null) {
    return [node];
  }
  return [node, ...getParents(node.parent)];
}

function recursiveName(node) {
  const res = getParents(node)
    .map(node => node.data.name)
    .join("-");
  console.log(res);
  return res;
}

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
     * Object or function used to map an item and its color.
     */
    colors: {
      type: [Object, Function],
      required: false
    },
    /**
     * Default sunburst color if colors is not provided.
     */
    defaultColor: {
      type: String,
      required: false,
      default: "#7b615c"
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
     * (node: Object) => id: String
     * @default id based on recursive agregation of node parent name
     */
    arcIdentification: {
      type: Function,
      required: false,
      default: recursiveName
    }
  },

  directives,

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
      const root = hierarchy(data)
        .sum(d => d.size)
        .sort((a, b) => b.value - a.value);

      const nodes = this.partition(root)
        .descendants()
        .filter(d => Math.abs(d.x1 - d.x0) > this.minAngleDisplayed);

      const pathes = this.vis
        .selectAll("path")
        .data(nodes, this.arcIdentification);

      pathes
        .enter()
        .append("svg:path")
        .attr("display", d => (d.depth ? null : "none"))
        .style("fill", this.getColor)
        .style("opacity", 1)
        .merge(pathes)
        .attr("d", arcSunburst)
        .style("fill", this.getColor);

      pathes.exit().remove();
    },

    /**
     * @private
     */
    getColor(d) {
      const colors = this.colors;
      if (!colors) {
        return this.defaultColor;
      }
      if (Array.isArray(colors)) {
        return colors[d.data.name];
      }
      return colors(d.data.name);
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
    }
  },

  computed: {},

  watch: {
    data(current) {
      this.onData(current);
    },
    minAngleDisplayed() {
      this.onData(this.data);
    }
  }
};
</script>

<style lang="less">
</style>
