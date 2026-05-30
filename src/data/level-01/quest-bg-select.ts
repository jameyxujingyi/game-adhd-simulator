export type BgColorId = 'light-green' | 'light-blue' | 'light-orange'

export const BG_COLORS: { id: BgColorId; label: string }[] = [
  { id: 'light-green', label: '浅绿' },
  { id: 'light-blue', label: '浅蓝' },
  { id: 'light-orange', label: '浅橙' },
]

export const BG_SELECT_FEEDBACK_1 = '不对，另外一个颜色好像更好看'

export const BG_SELECT_FEEDBACK_2 = '咦再试试看另一个颜色吧'

export const BG_SELECT_FEEDBACK_3 = '好吧，我觉得还是最开始的颜色更好看'

export const BG_SELECT_SUCCESS = '已成功选择背景颜色！'
