export function formatEth(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return `${whole},${(fraction + '00').slice(0, 2)}`
}
