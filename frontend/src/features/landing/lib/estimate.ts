import { CLIMATE_SURCHARGE, UNITS, type LandingUnit } from "../content/units"

export type Recommendation =
  { kind: "empty" } | { kind: "fit"; unit: LandingUnit } | { kind: "overflow" }

/** m³ → cỡ kho nhỏ nhất chứa vừa (S ≤ 2, M ≤ 6, L ≤ 12, XL ≤ 20 theo BR-09). */
export function recommendUnit(volumeM3: number): Recommendation {
  if (!(volumeM3 > 0)) return { kind: "empty" }
  const unit = UNITS.find((u) => volumeM3 <= u.volumeM3)
  return unit ? { kind: "fit", unit } : { kind: "overflow" }
}

export function monthlyPrice(
  unit: LandingUnit,
  options: { climate: boolean }
): number {
  return Math.round(
    unit.pricePerMonth * (options.climate ? 1 + CLIMATE_SURCHARGE : 1)
  )
}
