<template>
  <div class="bread-sequence">
  </div>
</template>
<script>
import { select } from "d3-selection";

/**
 * Generic breadcrumb trail component.
 */
export default {
  name: "breadcrumb",
  props: {
    /**
     * Items to be displayed
     */
    items: {
      required: true,
      type: Array
    },
    /**
     * Current item
     */
    from: {
      required: false,
      type: Object
    },
    /**
     * End text
     */
    endText: {
      required: false,
      type: String,
      default: ""
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
      .attr("class", "trail")
      .style("overflow", "visible");
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
      if (this.items.length === 0) {
        select(this.$el)
          .select(".trail")
          .style("visibility", "hidden");
        return;
      }

      // Data join; key function combines name and depth (= position in sequence).
      var trail = select(this.$el)
        .select(".trail")
        .selectAll("g")
        .data(this.items, d => d.id);

      // Remove exiting nodes.
      trail.exit().remove();

      // Add breadcrumb and label for entering nodes.
      var entering = trail.enter().append("svg:g");

      entering
        .append("svg:polygon")
        .attr("points", this.breadcrumbPoints)
        .style("fill", this.colorGetter);

      entering
        .append("svg")
        .attr("x", this.tailWidth)
        .attr("y", 0)
        .attr("width", this.itemWidth - this.tailWidth)
        .attr("heigth", this.itemHeight)
        .insert("svg:text")
        .attr("x", this.itemWidth / 2)
        .attr("y", this.itemHeight / 2)
        .attr("dy", "0.25em")
        .attr("text-anchor", "middle")
        .text(d => d.name);

      let originIndex = this.from === null ? 0 : this.items.indexOf(this.from);
      originIndex = originIndex < 0 ? this.items.length : originIndex;
      // Merge enter and update selections; set position for all nodes.
      entering
        .merge(trail)
        .attr(
          "transform",
          (d, i) => "translate(" + i * (this.itemWidth + this.spacing) + ", 0)"
        )
        .transition(500)
        .style("opacity", d =>
          this.items.indexOf(d) >= originIndex ? 1 : 0.5
        );

      // Now move and update the percentage at the end.
      select(this.$el)
        .select(".trail")
        .select(".endlabel")
        .attr(
          "x",
          this.items.length * (this.itemWidth + this.tailWidth / 2) +
            this.spacing * 2
        )
        .attr("y", this.itemHeight / 2)
        .attr("dy", "0.25em")
        .attr("text-anchor", "left")
        .text(this.endText);

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
    items: {
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
.bread-sequence {
  width: 100%;
  margin: 10px;
  overflow: visible;
}
</style>
