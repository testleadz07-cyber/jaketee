'use client'

import { useCallback, useReducer } from 'react'
import { designHistoryReducer, type DesignHistory } from '@/lib/design-history'
import { JACKET_VIEWS, type JacketCustomization, type JacketView } from '@/types/jacket-customization'

interface DesignState { options: Record<string, string>; design: JacketCustomization }
export type DesignHistoryChange = { view: JacketView; label: string; option?: string }

function describeChange(before: DesignState, after: DesignState): DesignHistoryChange {
  const view = JACKET_VIEWS.find(side => JSON.stringify(before.design[side]) !== JSON.stringify(after.design[side]))
  const option = Object.keys({ ...before.options, ...after.options }).find(key => before.options[key] !== after.options[key])
  return { view: view || (option && /Sleeve|Cuff/i.test(option) ? 'leftSleeve' : 'front'), option,
    label: option ? `${option}: ${after.options[option] || 'default'}` : view ? 'Text and artwork restored' : 'Design settings restored' }
}

export function useDesignHistory(defaultOptions: () => Record<string, string>) {
  const [history, dispatch] = useReducer(designHistoryReducer<DesignState>, undefined, (): DesignHistory<DesignState> => ({ past: [], present: { options: defaultOptions(), design: {} }, future: [] }))
  const setOptions = useCallback((update: (current: Record<string, string>) => Record<string, string>) => {
    dispatch({ type: 'change', update: current => ({ ...current, options: update(current.options) }) })
  }, [])
  const setDesign = useCallback((design: JacketCustomization) => {
    dispatch({ type: 'change', update: current => ({ ...current, design }) })
  }, [])
  const restore = useCallback((options: Record<string, string>, design: JacketCustomization) => dispatch({ type: 'restore', value: { options, design } }), [])
  const beginInteraction = useCallback(() => dispatch({ type: 'begin' }), [])
  const endInteraction = useCallback(() => dispatch({ type: 'end' }), [])
  return {
    ...history.present, setOptions, setDesign, restore, beginInteraction, endInteraction,
    canUndo: history.past.length > 0 || (history.groupStart !== undefined && JSON.stringify(history.groupStart) !== JSON.stringify(history.present)),
    canRedo: history.future.length > 0,
    undo: (): DesignHistoryChange | undefined => {
      const target = history.groupStart && JSON.stringify(history.groupStart) !== JSON.stringify(history.present) ? history.groupStart : history.past.at(-1)
      if (!target) return
      const change = describeChange(history.present, target)
      dispatch({ type: 'undo' })
      return change
    },
    redo: (): DesignHistoryChange | undefined => {
      const target = history.future[0]
      if (!target) return
      const change = describeChange(history.present, target)
      dispatch({ type: 'redo' })
      return change
    },
    reset: () => dispatch({ type: 'change', update: () => ({ options: defaultOptions(), design: {} }) }),
  }
}
