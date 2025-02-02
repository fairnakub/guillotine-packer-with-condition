export type Rectangle = {
  width: number
  height: number
  x: number
  y: number
  bin: number
  id: string
  splitFrom?: string
  disabled?: boolean
}

export interface Item {
  name: string
  count: number
  [others: string]: any
}
export interface ItemWithOnlyWithAndHeight extends Partial<Item> {
  width: number
  height: number
  [others: string]: any
}
export interface OtherItemDetail {
  [others: string]: any
}

export interface ItemConfig {
  name: string
  width: number
  height: number
  weight: number
  maxCount: number
}

export enum StackAdditionResult {
  CountExceeded,
  Overweight,
  StackUpdated
}

export interface BinWeightDetail {
  binId: number
  weightLimit: number
  currentBinWeight: number
  remainingBinWeight: number
}
