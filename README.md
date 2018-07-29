# VueD3Sunburst

## Usage

```HTML
<sunburst :text="hello"></sunburst>
```

```javascript
import { sunburst } from 'VueD3Sunburst'

export default {
  components: {
    sunburst
  }
}
```

## API

### sunburst 

#### props 

- `data` ***Object*** (*required*) 

   Sunburst data where children property is a array containing children. 

- `colors` ***Array|Function*** (*optional*) 

   Array or function used to map an item and its color. 

- `default-color` ***String*** (*optional*) `default: '#7b615c'` 

   Default sunburst color if colors is not provided. 

- `min-angle-displayed` ***Number*** (*optional*) `default: 0.005` 

   Minimal arc angle to be displayed (in radian). 

## Installation

```
npm install VueD3Sunburst
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
