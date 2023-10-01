import onlyRandom from '@elonehoo/only-random'

export default function onlyRandomArray<T>(array: readonly T[]): () => T {
  const random = onlyRandom(0, array.length - 1)
  return () => array[random()]
}
