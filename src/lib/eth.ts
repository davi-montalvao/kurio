import Decimal from 'decimal.js'

const down = Decimal.ROUND_DOWN

export function addEth(left: string, right: string, digits: number) {
  return new Decimal(left).plus(right).toDecimalPlaces(digits, down).toFixed(digits)
}

export function lineTotalEth(price: string, quantity: number) {
  return new Decimal(price).times(quantity).toDecimalPlaces(2, down).toFixed(2)
}

export function quoteFromLines(lineTotals: string[], coupon: boolean, feeEth: string) {
  const subtotal = lineTotals.reduce((total, value) => total.plus(value), new Decimal(0))
  const discount = coupon ? subtotal.times('0.1').toDecimalPlaces(3, down) : new Decimal(0)
  const fee = lineTotals.length > 0 ? new Decimal(feeEth) : new Decimal(0)
  const total = subtotal.minus(discount).plus(fee)

  return {
    subtotalEth: subtotal.toDecimalPlaces(2, down).toFixed(2),
    discountEth: discount.toDecimalPlaces(2, down).toFixed(2),
    feeEth: fee.toDecimalPlaces(3, down).toFixed(3),
    totalEth: total.toDecimalPlaces(3, down).toFixed(3),
  }
}

export function compareEth(left: string, right: string) {
  return new Decimal(left).comparedTo(right) ?? 0
}

export function ethToCents(value: string) {
  return new Decimal(value).times(100).toDecimalPlaces(0, down).toNumber()
}

export function centsToEth(cents: number) {
  return new Decimal(cents).div(100).toFixed(2)
}
