import { SplitStrategy } from './split-strategies'
import { SelectionStrategy } from './selection-strategies'
import { SortStrategy, SortDirection } from './sort-strategies'
import createDebug from 'debug'
const debug = createDebug('guillotine-packer')
import { Bin, PackedItem, PackStrategy } from './pack-strategy'
import { Item, ItemConfig } from './types'
import { cartesian } from './util'

type PackerInputs = { bin: Bin; items: Item[]; itemConfig: ItemConfig[] }
type PackerConfig = {
  selectionStrategy?: SelectionStrategy
  splitStrategy?: SplitStrategy
  sortStrategy?: SortStrategy
  kerfSize?: number
  allowRotation?: boolean
  allowWeightLimitSplit?: boolean // Take into account weight of items when calculating
}

type PackerResult = PackedItem[][] | null

function Packer(
  { bin, items, itemConfig }: PackerInputs,
  {
    selectionStrategy,
    splitStrategy,
    sortStrategy,
    kerfSize = 0,
    allowRotation = true,
    allowWeightLimitSplit = false
  }: PackerConfig = {}
) {
  function enumToArray<T>(enumVariable: T) {
    return Object.values(enumVariable)
      .filter(value => parseInt(value, 10) >= 0)
      .map(value => value as keyof T)
  }

  const selectionStrategies =
    selectionStrategy !== undefined ? [selectionStrategy] : enumToArray(SelectionStrategy)

  const splitStrategies = splitStrategy !== undefined ? [splitStrategy] : enumToArray(SplitStrategy)
  const sortStrategies = sortStrategy !== undefined ? [sortStrategy] : enumToArray(SortStrategy)

  const allStrategies = cartesian(selectionStrategies, splitStrategies, sortStrategies, [
    SortDirection.ASC,
    SortDirection.DESC
  ])

  return allStrategies
    .map(([selectionStrategy, splitStrategy, sortStrategy, sortOrder]) =>
      PackStrategy({
        bin,
        items,
        itemConfig,
        splitStrategy,
        selectionStrategy,
        sortStrategy,
        sortOrder,
        kerfSize,
        allowRotation,
        allowWeightLimitSplit
      })
    )
    .reduce((bestCompressed, packResult) => {
      const { splitStrategy, sortStrategy, selectionStrategy, sortOrder, packedItems } = packResult
      debug(
        `Result for split strategy: ${splitStrategy}, selection strategy: ${selectionStrategy}, sortStrategy: ${sortStrategy}, sortOrder: ${sortOrder} - ${packedItems.length} bin(s)`
      )
      if (!bestCompressed || packedItems.length < bestCompressed.length) {
        return packedItems
      } else {
        return bestCompressed
      }
    }, null as PackerResult)
}

export { SplitStrategy, SelectionStrategy, SortStrategy, Packer as packer }
