<template>
  <div
    class="infornation-sunburst"
    v-if="show"
  >
    <span>{{displayPercentage}}</span>
    <br /> {{description}}
    <br /><span
      v-if="showAllNumber"
      class="detail"
    >({{current.value}} / {{base}})</span>
  </div>
</template>
<script>
/**
 * Component that display the percentage value of the current node relative to root.
 * Can be used as a "top" slot of sunburst component.
 */
export default {
  name: "nodeInfoDisplayer",
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
     *  Clicked node
     */
    clicked: {
      required: false,
      type: Object
    },
    /**
     *  Text to be displayed
     */
    description: {
      required: true,
      type: String
    },
    /**
     *  Show fraction format of size if true
     */
    showAllNumber: {
      required: false,
      type: Boolean,
      default: true
    }
  },
  computed: {
    /**
     * @private
     */
    base() {
      return this.clicked ? this.clicked.value : this.root.value;
    },
    percentage() {
      if (this.current == null || this.root == null) {
        return null;
      }

      return (100 * this.current.value) / this.base;
    },
    displayPercentage() {
      const percentage = this.percentage;
      return percentage === null ? null : `${percentage.toPrecision(3)} %`;
    },
    show() {
      const percentage = this.percentage;
      return percentage !== null && percentage <= 100;
    }
  }
};
</script>
<style lang="less" scoped>
.infornation-sunburst {
  width: 300px;
  height: 100px;
  padding: 20px;
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 10;
  margin-left: -150px;
  margin-top: -70px;
  text-align: center;

  span {
    font-size: 2em;
  }

  span.detail {
    font-size: 1em;
  }
}
</style>
