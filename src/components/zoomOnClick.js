export default {
  props: {
    /**
     *  Sunburst nodes
     */
    nodes: {
      required: false,
      type: Object
    },
    /**
     *  Sunburst actions
     */
    actions: {
      required: true,
      type: Object
    }
  },

  render() {
    //no rendering
  },

  watch: {
    "nodes.clicked": function(node) {
      this.actions.zoomToNode(node);
    }
  }
};
