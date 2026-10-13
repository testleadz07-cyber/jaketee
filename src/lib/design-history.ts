export interface DesignHistory<T> {
  past: T[]
  present: T
  future: T[]
  groupStart?: T
}

export type DesignHistoryAction<T> =
  | { type: 'change'; update: (current: T) => T }
  | { type: 'restore'; value: T }
  | { type: 'begin' | 'end' | 'undo' | 'redo' }

const same = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b)
const remember = <T,>(past: T[], value: T) => [...past, value].slice(-100)

export function designHistoryReducer<T>(state: DesignHistory<T>, action: DesignHistoryAction<T>): DesignHistory<T> {
  if (action.type === 'restore') return { past: [], present: action.value, future: [] }
  if (action.type === 'begin') return state.groupStart === undefined ? { ...state, groupStart: state.present } : state
  if (action.type === 'change') {
    const present = action.update(state.present)
    if (same(present, state.present)) return state
    return { ...state, present, past: state.groupStart === undefined ? remember(state.past, state.present) : state.past, future: [] }
  }
  const committed = state.groupStart === undefined ? state : {
    past: same(state.groupStart, state.present) ? state.past : remember(state.past, state.groupStart),
    present: state.present, future: state.future,
  }
  if (action.type === 'end') return committed
  if (action.type === 'undo' && committed.past.length) return {
    past: committed.past.slice(0, -1), present: committed.past[committed.past.length - 1], future: [committed.present, ...committed.future],
  }
  if (action.type === 'redo' && committed.future.length) return {
    past: remember(committed.past, committed.present), present: committed.future[0], future: committed.future.slice(1),
  }
  return committed
}
