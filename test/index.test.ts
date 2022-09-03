import { test,expect } from 'vitest'
import onlyRandomArray from '../src'

test('main',()=>{
  const random = onlyRandomArray([1, 2, 3, 4]);

	let current;
	let previous;
	let index = 100;
	while (index--) {
		current = random();
    expect(current).not.toBe(previous)
		previous = current;
	}
})

