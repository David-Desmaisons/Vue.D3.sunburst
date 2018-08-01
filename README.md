# Vue.D3.Sunburst

[![GitHub open issues](https://img.shields.io/github/issues/David-Desmaisons/Vue.D3.sunburst.svg?maxAge=2592000)](https://github.com/David-Desmaisons/Vue.D3.sunburst/issues)
[![Npm version](https://img.shields.io/npm/v/vue-d3-sunburst.svg?maxAge=2592000)](https://www.npmjs.com/package/vue-d3-sunburst)
[![MIT License](https://img.shields.io/github/license/David-Desmaisons/Vue.D3.sunburst.svg)](https://github.com/David-Desmaisons/Vue.D3.sunburst/blob/master/LICENSE)

## Usage

```HTML
<sunburst :data="tree"></sunburst>
```

```javascript
import { sunburst } from 'vue-d3-sunburst'

export default {
  components: {
    sunburst
  },
  data() {
    return { 
      tree:  {
      "name": "flare",
        "children": [
          {
            "name": "analytics",
            "children": [
              {
                "name": "cluster",
                "children": [
                  { "name": "AgglomerativeCluster", "size": 3938 },
                  { "name": "CommunityStructure", "size": 3812 },
                  { "name": "HierarchicalCluster", "size": 6714 },
                  { "name": "MergeEdge", "size": 743 }
                ]
              },
              {
                "name": "graph",
                "children": [
                  { "name": "BetweennessCentrality", "size": 3534 },
                  { "name": "LinkDistance", "size": 5731 },
                  { "name": "MaxFlowMinCut", "size": 7840 },
                  { "name": "ShortestPaths", "size": 5914 },
                  { "name": "SpanningTree", "size": 3416 }
                ]
              },
              {
                "name": "optimization",
                "children": [
                  { "name": "AspectRatioBanker", "size": 7074 }
                ]
              }
            ]
          }
        ]
      }
    }
  }
}
```

## API

### sunburst 

#### props 

- `data` ***Object*** (*required*) 

   Sunburst data where children property is a array containing children. 

- `color-scheme` ***String*** (*optional*) `default: 'schemeCategory10'` 

   D3 color scheme to be used. 

- `get-color-for-node` ***Function*** (*optional*) `default: 'getCategoryColor'` 

   Function used to map an item and its color. (nodeD3: Object) => color: String 

- `min-angle-displayed` ***Number*** (*optional*) `default: 0.005` 

   Minimal arc angle to be displayed (in radian). 

- `arc-identification` ***Function*** (*optional*) `default: 'recursiveName'` 

   Function used to identify an arc, will be used during graph updates. (nodeD3: Object) => id: String 

## Installation

```
npm install vue-d3-sunburst
```

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Run your unit tests

```
npm run test:unit
```

### Update the API section of README.md with generated documentation

```
npm run doc:build
```
