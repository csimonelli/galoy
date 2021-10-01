export const CachedRouteKeyGenerator = (): CachedRouteKeyGenerator => {
  const generate = ({
    paymentHash,
    milliSats,
  }: {
    paymentHash: PaymentHash
    milliSats: MilliSatoshis
  }): CachedRouteLookupKey =>
    JSON.stringify({
      id: paymentHash,
      mtokens: milliSats.toString(),
    }) as CachedRouteLookupKey

  return {
    generate,
  }
}
