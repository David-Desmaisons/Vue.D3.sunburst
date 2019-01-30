<template>
  <div class="sequence" :style="{'order':order}">
  </div>
</template>
<script>
import { select } from "d3-selection";

/**
 * Breadcrumb trail component displaying path between root node and current node.
 * Can be used as a "legend" slot of sunburst component.
 */
export default {
  name: "breadcrumbTrail",
  props: {
    /**
     *  Root node
     */
    root: {
      required: false,
      type: Object
    },
    /**
     *  Current node
     */
    current: {
      required: false,
      type: Object
    },
    /**
     *  Reference node, parents nodes of the current will have an opacity below 1
     */
    from: {
      required: false,
      type: Object
    },
    /**
     *  ColorGetter exposed by sunburst
     */
    colorGetter: {
      required: true,
      type: Function
    },
    /**
     *  Sunburst width
     */
    width: {
      required: false,
      type: Number
    },
    /**
     *  Css Order. If 1 the slot is displayed below the sunburst, if 0 the slot is displayed on top the sunburst
     */
    order: {
      required: false,
      type: Number,
      default: 1
    },
    /**
     *  Bread crumb item width
     */
    itemWidth: {
      required: false,
      type: Number,
      default: 80
    },
    /**
     * Bread crumb item height
     */
    itemHeight: {
      required: false,
      type: Number,
      default: 30
    },
    /**
     * Spacing between breadcrumb items
     */
    spacing: {
      required: false,
      type: Number,
      default: 3
    },
    /**
     * With of tailing element
     */
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
    /**
     * @private
     */
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
    },

    /**
     * @private
     */
    draw() {
      if (!this.current) {
        select(this.$el)
          .select(".trail")
          .style("visibility", "hidden");
        return;
      }
      const nodeArray = this.current.ancestors().reverse();
      const origin = this.from || this.root;
      const [, ...nodeFrom] = origin.ancestors();

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
          (d, i) => "translate(" + i * (this.itemWidth + this.spacing) + ", 0)"
        )
        .style("opacity", d => (nodeFrom.indexOf(d) === -1 ? 1 : 0.5));

      const percentage = (100 * this.current.value) / this.root.value;
      const text = `${percentage.toPrecision(3)} % of total`;

      // Now move and update the percentage at the end.
      select(this.$el)
        .select(".trail")
        .select(".endlabel")
        .attr("x", (nodeArray.length + 0.75) * (this.itemWidth + this.spacing))
        .attr("y", this.itemHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(text);

      select(this.$el)
        .select(".trail")
        .style("visibility", "");
    }
  },
  watch: {
    width() {
      select(this.$el)
        .select(".trail")
        .attr("width", this.width);
    },
    current: {
      deep: true,
      handler() {
        this.draw();
      }
    },
    root: {
      deep: true,
      handler() {
        this.draw();
      }
    },
    from() {
      this.draw();
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
