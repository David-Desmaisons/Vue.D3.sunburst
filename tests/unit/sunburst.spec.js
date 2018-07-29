import { shallowMount } from "@vue/test-utils";
import sunburst from "@/components/sunburst.vue";

describe("sunburst.vue", () => {
  it("renders props.msg when passed", () => {
    const msg = "new message";
    const wrapper = shallowMount(sunburst, {
      propsData: { msg }
    });
    expect(wrapper.text()).toMatch(msg);
  });
});
