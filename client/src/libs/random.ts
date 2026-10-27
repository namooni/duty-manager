export function createRotationSeed() {
  return (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647) + 1;
}
