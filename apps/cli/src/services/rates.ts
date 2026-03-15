export async function getUsdToRubRate(): Promise<number> {
  // Mock implementation with a small artificial delay
  await new Promise((resolve) => setTimeout(resolve, 50));
  return 95;
}

export async function getGoldPricePerGramRub(): Promise<number> {
  // Mock implementation with a small artificial delay
  await new Promise((resolve) => setTimeout(resolve, 50));
  return 7000;
}

