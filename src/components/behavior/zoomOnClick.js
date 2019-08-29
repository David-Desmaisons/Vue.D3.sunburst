/**
 * Renderless component providing the zoom on click behavior.
 *Can be used as a default slot of sunburst component.
 */
export default {
  name: "zoomOnClick",
  props: {
    /**
     *  Sunburst nodes. Typically provided by sunburst default slot.
     */
    on: {
      required: true,
      type: Function
    },
    /**
     *  Sunburst actions. Typically provided by sunburst default slot.
     */
    actions: {
      required: true,
      type: Object
    }
  },

  render: () => null,

  created() {
    this.on("clickNode", ({node}) =>{
      this.actions.zoomToNode(node);
    });
  }
};
