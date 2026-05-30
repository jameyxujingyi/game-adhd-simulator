export type ClickableComponentId =
  | 'content-box-1'
  | 'content-box-2'
  | 'image-box'
  | 'todo-content-box-1'
  | 'todo-content-box-2'
  | 'todo-image-box'
  | 'todo-select-font'
  | 'todo-select-bg-color'
  | 'phone'
  | 'water-puddle'
  | 'mop'
  | 'spray-bottle'
  | 'potted-plant'
  | 'exit-button'

export const TODO_ITEMS: { id: ClickableComponentId; label: string }[] = [
  { id: 'todo-content-box-1', label: '内容框1' },
  { id: 'todo-content-box-2', label: '内容框2' },
  { id: 'todo-image-box', label: '图片框' },
  { id: 'todo-select-font', label: '选择字体' },
  { id: 'todo-select-bg-color', label: '选择背景颜色' },
]

export function areAllTodosComplete(completedTodos: ClickableComponentId[]): boolean {
  return TODO_ITEMS.every((item) => completedTodos.includes(item.id))
}
