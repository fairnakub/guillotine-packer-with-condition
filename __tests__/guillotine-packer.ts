import { packer, SortStrategy, SplitStrategy, SelectionStrategy } from '../src/guillotine-packer'
import { Item } from '../src/types'

test('pack item requiring rotation', () => {
  const bin = {
    binHeight: 30,
    binWidth: 40,
    binWeightLimit: 30
  }
  const items = [
    {
      name: 'test',
      count: 20
    } as Item
  ]

  const itemConfig = [{ name: 'test', maxCount: 3, width: 30, height: 40, weight: 10 }]

  const result = packer({
    bin,
    items,
    itemConfig
  })

  expect(result).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "bin": 1,
      "count": 1,
      "height": 30,
      "name": "test",
      "otherDetail": Object {},
      "weight": 10,
      "width": 40,
      "x": 0,
      "y": 0,
    },
  ],
]
`)
})

test('pack multiple bins', () => {
  const items = [
    { name: '1', count: 1 },
    { name: '2', count: 1 },
    { name: '3', count: 1 },
    { name: '4', count: 1 },
    { name: '5', count: 1 }
  ]

  const itemConfig = [
    { name: '1', width: 4, height: 3, weight: 1, maxCount: 1 },
    { name: '2', width: 4, height: 3, weight: 1, maxCount: 1 },
    { name: '3', width: 4, height: 3, weight: 1, maxCount: 1 },
    { name: '4', width: 4, height: 3, weight: 1, maxCount: 1 },
    { name: '5', width: 4, height: 3, weight: 1, maxCount: 1 }
  ]

  const bin = {
    binHeight: 4,
    binWidth: 8
  }

  const result = packer(
    {
      bin,
      items,
      itemConfig
    },
    {
      kerfSize: 0,
      sortStrategy: SortStrategy.Area,
      splitStrategy: SplitStrategy.ShortAxisSplit,
      selectionStrategy: SelectionStrategy.BEST_AREA_FIT
    }
  )

  expect(result).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "bin": 1,
      "count": 1,
      "height": 4,
      "name": "1",
      "otherDetail": Object {},
      "weight": 1,
      "width": 3,
      "x": 0,
      "y": 0,
    },
    Object {
      "bin": 1,
      "count": 1,
      "height": 4,
      "name": "2",
      "otherDetail": Object {},
      "weight": 1,
      "width": 3,
      "x": 3,
      "y": 0,
    },
  ],
  Array [
    Object {
      "bin": 2,
      "count": 1,
      "height": 4,
      "name": "3",
      "otherDetail": Object {},
      "weight": 1,
      "width": 3,
      "x": 0,
      "y": 0,
    },
    Object {
      "bin": 2,
      "count": 1,
      "height": 4,
      "name": "4",
      "otherDetail": Object {},
      "weight": 1,
      "width": 3,
      "x": 3,
      "y": 0,
    },
  ],
  Array [
    Object {
      "bin": 3,
      "count": 1,
      "height": 4,
      "name": "5",
      "otherDetail": Object {},
      "weight": 1,
      "width": 3,
      "x": 0,
      "y": 0,
    },
  ],
]
`)
})

test('should rotate items if it results in more efficent packing', () => {
  const bin = {
    binHeight: 40,
    binWidth: 80,
    binWeightLimit: 100
  }

  const items = [
    {
      name: '40x20',
      count: 1
    },
    {
      name: '40x20',

      count: 1
    }
  ]

  const itemConfig = [
    {
      name: '40x20',
      count: 1,
      width: 40,
      height: 20,
      maxCount: 1,
      weight: 1
    },
    {
      name: '40x20',
      count: 1,
      width: 40,
      height: 20,
      maxCount: 1,
      weight: 1
    }
  ]

  const result = packer(
    {
      bin,
      items,
      itemConfig
    },
    {
      kerfSize: 0,
      sortStrategy: SortStrategy.Area,
      splitStrategy: SplitStrategy.ShortAxisSplit,
      selectionStrategy: SelectionStrategy.BEST_AREA_FIT
    }
  )
  expect(result).toHaveLength(1)
})

test('should not rotate items if allow rotation is disabled', () => {
  const bin = { binHeight: 40, binWidth: 80 }
  const items = [
    {
      name: '1',
      count: 1
    },
    {
      name: '2',
      count: 1
    }
  ]
  const itemConfig = [
    {
      name: '1',
      count: 1,
      width: 40,
      height: 20,
      maxCount: 1,
      weight: 1
    },
    {
      name: '2',
      count: 1,
      width: 40,
      height: 20,
      maxCount: 1,
      weight: 1
    }
  ]
  const result = packer(
    {
      bin,
      items,
      itemConfig
    },
    {
      kerfSize: 2,
      sortStrategy: SortStrategy.Area,
      splitStrategy: SplitStrategy.ShortAxisSplit,
      selectionStrategy: SelectionStrategy.BEST_AREA_FIT,
      allowRotation: false
    }
  )
  expect(result).toHaveLength(2)
})

test('create kerfs if provided', () => {
  const bin = { binHeight: 30, binWidth: 30 }
  const items = [
    {
      name: 'test',
      count: 1
    },
    {
      name: 'kerfed offcut',
      count: 1
    }
  ]
  const itemConfig = [
    {
      name: 'test',
      count: 1,
      width: 20,
      height: 20,
      maxCount: 1,
      weight: 1
    },
    {
      name: 'kerfed offcut',
      count: 1,
      width: 5,
      height: 5,
      maxCount: 1,
      weight: 1
    }
  ]
  const result = packer(
    {
      bin,
      items,
      itemConfig
    },
    { kerfSize: 2 }
  )
  expect(result).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "bin": 1,
      "count": 1,
      "height": 20,
      "name": "test",
      "otherDetail": Object {},
      "weight": 1,
      "width": 20,
      "x": 0,
      "y": 0,
    },
    Object {
      "bin": 1,
      "count": 1,
      "height": 5,
      "name": "kerfed offcut",
      "otherDetail": Object {},
      "weight": 1,
      "width": 5,
      "x": 0,
      "y": 22,
    },
  ],
]
`)
})

test('throw error if item too large for bin', () => {
  const bin = { binHeight: 30, binWidth: 30 }
  const items = [{ name: '1', count: 1 }]
  const itemConfig = [{ name: '1', width: 40, height: 40, weight: 1, maxCount: 1 }]
  const invalidItem = () =>
    packer({
      bin,
      items,
      itemConfig
    })
  expect(invalidItem).toThrowError('exceeds bin dimensions')
})

test('pack multiple bins with weightLimit', () => {
  console.log('pack multiple bins with weightLimit')
  const items = [
    {
      name: 'เสารั้ว หน้า 3" x 150',
      weight: 80,
      width: 90,
      height: 150,
      price: 67.5,
      itemCountPerLoad: 80,
      maxCount: 2,
      representedColor: '#AADDAE',
      count: 6
    }
  ]
  const itemConfig = [
    {
      name: '1',
      width: 4,
      height: 3,
      weight: 2,
      maxCount: 2
    },
    {
      name: '2',
      width: 4,
      height: 3,
      weight: 4,
      maxCount: 3
    },
    {
      name: 'เสารั้ว หน้า 3" x 150',
      weight: 80, // TODO
      width: 90,
      height: 150,
      price: 45 * 1.5,
      itemCountPerLoad: 80,
      maxCount: 2,
      representedColor: '#AADDAE'
    }
  ]

  const bin = {
    binHeight: 500,
    binWidth: 240,
    binWeightLimit: 320
  }

  const result = packer(
    {
      bin,
      items,
      itemConfig
    },
    {
      kerfSize: 0,
      sortStrategy: SortStrategy.Area,
      splitStrategy: SplitStrategy.ShortAxisSplit,
      selectionStrategy: SelectionStrategy.BEST_AREA_FIT,
      allowWeightLimitSplit: true
    }
  )

  expect(result).toMatchInlineSnapshot(`
Array [
  Array [
    Object {
      "bin": 1,
      "count": 2,
      "height": 90,
      "name": "เสารั้ว หน้า 3\\" x 150",
      "otherDetail": Object {
        "itemCountPerLoad": 80,
        "maxCount": 2,
        "price": 67.5,
        "representedColor": "#AADDAE",
        "weight": 80,
      },
      "weight": 160,
      "width": 150,
      "x": 0,
      "y": 0,
    },
    Object {
      "bin": 1,
      "count": 2,
      "height": 90,
      "name": "เสารั้ว หน้า 3\\" x 150",
      "otherDetail": Object {
        "itemCountPerLoad": 80,
        "maxCount": 2,
        "price": 67.5,
        "representedColor": "#AADDAE",
        "weight": 80,
      },
      "weight": 160,
      "width": 150,
      "x": 0,
      "y": 90,
    },
  ],
  Array [
    Object {
      "bin": 2,
      "count": 2,
      "height": 90,
      "name": "เสารั้ว หน้า 3\\" x 150",
      "otherDetail": Object {
        "itemCountPerLoad": 80,
        "maxCount": 2,
        "price": 67.5,
        "representedColor": "#AADDAE",
        "weight": 80,
      },
      "weight": 160,
      "width": 150,
      "x": 0,
      "y": 0,
    },
  ],
]
`)
})
