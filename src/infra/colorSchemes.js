import { scaleOrdinal } from "d3-scale";
import {
  schemeAccent,
  schemeCategory10,
  schemePaired,
  schemePastel1,
  schemePastel2,
  schemeSet1,
  schemeSet2,
  schemeSet3
} from "d3-scale-chromatic";

const rawColorSchemes = {
  schemeAccent,
  schemeCategory10,
  schemePaired,
  schemePastel1,
  schemePastel2,
  schemeSet1,
  schemeSet2,
  schemeSet3
};

function toDisplayName(value) {
  return value
    .replace(/(^.+)([A-Z])/g, (_, m1, m2) => m1 + " " + m2)
    .replace(/(^.+)([1-9])(?:[0-9]*)/g, (_, m1, m2) => m1 + " " + m2)
    .replace(/^\w/, c => c.toUpperCase());
}

const colorSchemes = {};
Object.keys(rawColorSchemes).forEach(key => {
  colorSchemes[key] = {
    name: toDisplayName(key),
    scale: scaleOrdinal(rawColorSchemes[key])
  };
});

export { colorSchemes };
