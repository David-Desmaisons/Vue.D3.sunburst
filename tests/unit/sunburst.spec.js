import { shallowMount } from "@vue/test-utils";
import {sunburst} from "@/sunburst";

describe("sunburst.vue", () => {
  it("use data passed as props", () => {
    const data = {};
    const wrapper = shallowMount(sunburst, {
      propsData: { data }
    });
    expect(wrapper.vm.data).toBe(data);
  });
});
