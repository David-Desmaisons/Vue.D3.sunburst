export default {
  props: {
    nodes: {
      required: false,
      type: Object
    },
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
