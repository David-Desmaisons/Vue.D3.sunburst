<template>
    <div class="viewport" v-resize="resize">
    </div>
</template>
<script>
import resize from "vue-resize-directive";
import * as d3 from "d3";

const props = {
  data: {
    type: Object,
    required: true
  },
  colors: {
    required: false
  },
  defaultColor: {
    type: String,
    required: false,
    default: "#7b615c"
  },
  minAngleDisplayed: {
    type: Number,
    required: false,
    default: 0.005
  }
};

const directives = {
  resize
};

const arc = d3
  .arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(d => Math.sqrt(d.y1));

export default {
  name: "sunburst",

  props,

  directives,

  data() {
    return {};
  },

  mounted() {
    this.vis = d3
      .select(this.$el)
      .append("svg")
      .style("overflow", "visible")
      .attr("class", "root");
    this.resize();
  },

  methods: {
    getSize() {
      var width = this.$el.clientWidth;
      var height = this.$el.clientHeight;
      return { width, height };
    },

    onData(data) {
      const root = d3
        .hierarchy(data)
        .sum(d => d.size)
        .sort((a, b) => b.value - a.value);

      const nodes = this.partition(root)
        .descendants()
        .filter(d => Math.abs(d.x1 - d.x0) > this.minAngleDisplayed);

      const pathes = this.vis
        .selectAll("path")
        .data(nodes, n => `${n.x0};${n.x1};${n.y0};${n.y1}`);

      pathes
        .enter()
        .append("svg:path")
        .attr("display", d => (d.depth ? null : "none"))
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", this.getColor)
        .style("opacity", 1);

      pathes.exit().remove();
    },

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

    resize() {
      const { width, height } = this.getSize();
      this.vis
        .attr("width", width)
        .attr("height", height)
        .attr("transform", `translate(${width / 2}, ${height / 2} )`);

      this.radius = Math.min(width, height) / 2;
      this.partition = d3.partition().size([2 * Math.PI, this.radius * this.radius]);
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
