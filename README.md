# only random array

> Get consecutively unique elements from an array

## Install

```bash
# npm
npm install --save @elonehoo/only-random-array
# yarn
yarn add --save @elonehoo/only-random-array
# pnpm
pnpm install --save @elonehoo/only-random-array
```

## Usage

```ts
import onlyRandomArray from '@elonehoo/only-random-array'

const random = onlyRandomArray([1, 2, 3, 4])

console.log(random(), random(), random(), random())
```
