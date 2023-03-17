import debugLib from 'debug'
const debug = debugLib('guillotine-packer:pack-strategy')
import { Rectangle, Item, ItemConfig, OtherItemDetail, StackAdditionResult } from './types'
import { SelectionStrategy, GetSelectionImplementation } from './selection-strategies'
import { SortDirection, SortStrategy, GetSortImplementation } from './sort-strategies'
import { SplitStrategy, GetSplitImplementation } from './split-strategies'

export type Bin = {
  binHeight: number
  binWidth: number
  binWeightLimit?: number
}

export type PackStrategyOptions = {
  bin: Bin
  items: Item[]
  itemConfig: ItemConfig[]
  selectionStrategy: SelectionStrategy
  splitStrategy: SplitStrategy
  sortStrategy: SortStrategy
  sortOrder: SortDirection
  kerfSize: number
  allowRotation: boolean
  allowWeightLimitSplit: boolean
}

export type PackedItem = {
  otherDetail: OtherItemDetail
  name: string
  width: number
  height: number
  weight: number
  count: number
  x: number
  y: number
  bin: number
}

export function PackStrategy({
  bin,
  items,
  itemConfig,
  selectionStrategy,
  splitStrategy,
  sortStrategy,
  sortOrder,
  kerfSize,
  allowRotation,
  allowWeightLimitSplit
}: PackStrategyOptions) {
  debug(
    `Executing! split strategy: ${splitStrategy}, selection strategy: ${selectionStrategy}, sortStrategy: ${sortStrategy}, sortOrder: ${sortOrder}`
  )
  const { binWidth, binHeight, binWeightLimit } = bin
  let binCount = 0
  const freeRectangles: Rectangle[] = []

  const createBin = () => {
    binCount++
    debug(`creating bin ${binCount}`)
    freeRectangles.push({
      width: binWidth,
      height: binHeight,
      x: 0,
      y: 0,
      bin: binCount,
      id: 'root',
      disabled: false
    })
  }
  const splitter = GetSplitImplementation(splitStrategy, kerfSize)
  const selector = GetSelectionImplementation(selectionStrategy)
  const sorter = GetSortImplementation(sortStrategy, sortOrder)

  const sortedItems = sorter.sort(items)

  const rotateItem = (item: Item) => {
    return { ...item, height: item.width, width: item.height }
  }

  const splitRectangle = ({ rectangle, item }: { rectangle: Rectangle; item: Item }) => {
    return splitter.split(rectangle, item).filter(r => r.width > 0 && r.height > 0)
  }

  const packedItems: PackedItem[] = []

  const getSelectionOption = (item: Item) => {
    const rectangle = selector.select(freeRectangles, item)
    debug(`for item ${JSON.stringify(item)}, selected ${JSON.stringify(rectangle)}`)
    if (!rectangle) {
      return null
    }
    const splitRectangles = splitRectangle({ rectangle: rectangle, item })
    return {
      rectangle,
      splitRectangles,
      item
    }
  }

  const performStackAddition = (item: Item, binId: number): StackAdditionResult | null => {
    // IF THE item HAVE ALREADY BEEN ADDED TO THE packedItems
    const currentBinWeight = packedItems
      .filter(e => e.bin === binId)
      .reduce((acc, cur) => (acc += cur.weight), 0)
    const itemDetail = itemConfig.find(e => e.name === item.name)

    let result: StackAdditionResult | null = null
    if (itemDetail) {
      packedItems.forEach((e, index) => {
        if (!result) {
          if (e.name === item.name && e.bin === binId) {
            // CHECK IF THE loadCount OF THE item HAS BEEN EXCEEDED THE maxCount
            let count = e.count || 0
            if (
              (allowWeightLimitSplit &&
                currentBinWeight + (itemDetail?.weight || 0) <= (bin.binWeightLimit || 0)) ||
              !allowWeightLimitSplit
            ) {
              // CHECK IF THE WEIGHT AFTER ADDING EXCEEDS THE binWeight
              if (count + 1 <= (itemDetail?.maxCount || 0)) {
                e.count += 1
                e.weight += itemDetail.weight
                result = StackAdditionResult.StackUpdated
              } else {
                result = StackAdditionResult.CountExceeded
              }
            } else {
              result = StackAdditionResult.Overweight
            }
          }
        }
      })
    }
    return result
  }

  const selectRectangleOption = (item: Item) => {
    const targetItemConfig = itemConfig.find(e => e.name === item.name)
    const itemWithWidthAndHeight = {
      ...item,
      width: targetItemConfig?.width,
      height: targetItemConfig?.height
    }
    const originalOption = getSelectionOption(itemWithWidthAndHeight)
    let rotatedOption = null
    let rotatedItem
    if (allowRotation) {
      rotatedItem = rotateItem(itemWithWidthAndHeight)
      rotatedOption = getSelectionOption(rotatedItem)
    }

    if (originalOption === null && rotatedOption === null) {
      // IF NOT ENOUGH SPACE TO PLACE THE ITEM EVEN AFTER ROTATION, RETURN NULL
      debug(`No free rectangles found for`, item)
      return null
    } else if (originalOption === null) {
      debug(`Original item didn't fit, using rotated`, item)
      return rotatedOption // GUARANTEED TO HAVE VALUE
    } else if (rotatedOption === null) {
      debug(`Rotated item didn't fit, using original option`, item)
      return originalOption // GUARANTEED TO HAVE VALUE
    } else {
      const getBiggestSplitRectangle = ({ splitRectangles }: { splitRectangles: Rectangle[] }) =>
        Math.max(...splitRectangles.map(split => split.height * split.width))
      const originalMax = getBiggestSplitRectangle(originalOption)
      const rotatedMax = getBiggestSplitRectangle(rotatedOption)
      debug(`Original max area ${originalMax}, rotated max area ${rotatedMax}`)
      if (getBiggestSplitRectangle(originalOption) >= getBiggestSplitRectangle(rotatedOption)) {
        debug(`Going with original placement option`)
        return originalOption
      } else {
        debug(`Going with rotated placement option`)
        return rotatedOption
      }
    }
  }

  sortedItems.map((item, idx) => {
    debug('packing item', item)

    const targetItemConfig = itemConfig.find(e => e.name === item.name)
    for (let i = 0; i < item.count || 1; i += 1) {
      let stackAdditionResult = null
      if (allowWeightLimitSplit) {
        stackAdditionResult = performStackAddition(item, binCount)
        if (stackAdditionResult === StackAdditionResult.StackUpdated) {
          continue
        }

        if (stackAdditionResult === StackAdditionResult.CountExceeded) {
          // do nothing
        }
      }

      let selectedOption

      if (stackAdditionResult === StackAdditionResult.Overweight) {
        selectedOption = null
        freeRectangles.forEach(fr => {
          if (fr.bin === binCount) {
            fr.disabled = true
          }
        })
      } else {
        selectedOption = selectRectangleOption(item)
      }

      if (!selectedOption) {
        // IF CANNOT PLACE THE ITEM, CREATE A NEW BIN

        createBin()

        selectedOption = selectRectangleOption(item)
      }
      if (!selectedOption) {
        throw new Error(
          `item at index ${idx} with dimensions ${targetItemConfig?.width}x${targetItemConfig?.height} exceeds bin dimensions of ${binWidth}x${binHeight}`
        )
      }
      const { rectangle, splitRectangles } = selectedOption
      if (!targetItemConfig) {
        throw new Error(`item ${item.name}'s config is not found`)
      }
      debug('selected rectangle', rectangle)
      const { count, name, width, height, ...otherItemProps } = selectedOption.item
      const packedItem = {
        otherDetail: {
          ...otherItemProps
        },
        name,
        width,
        height,
        count: 1,
        weight: 1 * (targetItemConfig?.weight || 0),
        x: rectangle.x,
        y: rectangle.y,
        bin: rectangle.bin
      }
      debug('packed item', packedItem)
      debug('free rectangles pre split', freeRectangles)
      const rectIndex = freeRectangles.findIndex(r => r === rectangle)
      freeRectangles.splice(rectIndex, 1, ...splitRectangles)
      debug('free rectangles post split', freeRectangles)
      packedItems.push(packedItem)
    }
  })

  const organizedPackedItems = packedItems.reduce((bins, item) => {
    if (bins.length >= item.bin) {
      bins[item.bin - 1].push(item)
    } else {
      bins.push([item])
    }
    return bins
  }, [] as PackedItem[][])

  return {
    sortStrategy,
    sortOrder,
    packedItems: organizedPackedItems,
    splitStrategy,
    selectionStrategy
  }
}
