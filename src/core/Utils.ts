export function delay(n: number): Promise<void> {
  return new Promise((resolve: () => void, _) => {
    setTimeout(resolve, n);
  });
}
