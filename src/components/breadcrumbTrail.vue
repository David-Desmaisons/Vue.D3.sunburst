<template>
  <div class="sequence" :style="{'order':order}">
  </div>
</template>
<script>
import { select } from "d3";

export default {
  props: {
    nodes: {
      required: false,
      type: Object
    },
    colorGetter: {
      required: true,
      tyoe: Function
    },
    width: {
      required: false,
      type: Number
    },
    order: {
      required: false,
      type: Number,
      default: 1
    },
    itemWidth: {
      required: false,
      type: Number,
      default: 80
    },
    itemHeight: {
      required: false,
      type: Number,
      default: 30
    },
    spacing: {
      required: false,
      type: Number,
      default: 3
    },
    tailWidth: {
      required: false,
      type: Number,
      default: 10
    }
  },
  mounted() {
    var trail = select(this.$el)
      .append("svg:svg")
      .attr("width", this.width)
      .attr("height", 50)
      .attr("class", "trail");
    // Add the label at the end, for the percentage.
    trail
      .append("svg:text")
      .attr("class", "endlabel")
      .style("fill", "#000");
  },
  methods: {
    breadcrumbPoints(_, i) {
      var points = [];
      points.push("0,0");
      points.push(this.itemWidth + ",0");
      points.push(this.itemWidth + this.tailWidth + "," + this.itemHeight / 2);
      points.push(this.itemWidth + "," + this.itemHeight);
      points.push("0," + this.itemHeight);
      if (i > 0) {
        // Leftmost breadcrumb; don't include 6th vertex.
        points.push(this.tailWidth + "," + this.itemHeight / 2);
      }
      return points.join(" ");
    }
  },
  watch: {
    width() {
      select(this.$el)
        .select(".trail")
        .attr("width", this.width);
    },
    "nodes.mouseOver": {
      deep: true,
      handler(current) {
        if (!current) {
          select(this.$el)
            .select(".trail")
            .style("visibility", "hidden");
          return;
        }
        const nodeArray = current.ancestors().reverse();

        // Data join; key function combines name and depth (= position in sequence).
        var trail = select(this.$el)
          .select(".trail")
          .selectAll("g")
          .data(nodeArray, d => d.data.name + d.depth);

        // Remove exiting nodes.
        trail.exit().remove();

        // Add breadcrumb and label for entering nodes.
        var entering = trail.enter().append("svg:g");

        entering
          .append("svg:polygon")
          .attr("points", this.breadcrumbPoints)
          .style("fill", this.colorGetter);

        entering
          .append("svg:text")
          .attr("x", (this.itemWidth + this.tailWidth) / 2)
          .attr("y", this.itemHeight / 2)
          .attr("dy", "0.25em")
          .attr("text-anchor", "middle")
          .text(d => d.data.name);

        // Merge enter and update selections; set position for all nodes.
        entering
          .merge(trail)
          .attr(
            "transform",
            (d, i) =>
              "translate(" + i * (this.itemWidth + this.spacing) + ", 0)"
          );

        const text = `${(
          100 *
          this.nodes.mouseOver.value /
          this.nodes.root.value
        ).toPrecision(3)} %`;

        // Now move and update the percentage at the end.
        select(this.$el)
          .select(".trail")
          .select(".endlabel")
          .attr("x", (nodeArray.length + 0.5) * (this.itemWidth + this.spacing))
          .attr("y", this.itemHeight / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(text);

        select(this.$el)
          .select(".trail")
          .style("visibility", "");
      }
    }
  }
};
</script>
<style lang="less" scoped>
.sequence {
  width: 100%;
  height: 50px;
  margin-left: 10px;
  margin-right: 10px;
}
</style>
