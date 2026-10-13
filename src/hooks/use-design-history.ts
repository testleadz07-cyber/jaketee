'use client'

import { useCallback, useReducer } from 'react'
import { designHistoryReducer, type DesignHistory } from '@/lib/design-history'
import type { JacketCustomization } from '@/types/jacket-customization'

interface DesignState { options: Record<string, string>; design: JacketCustomization }

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
    undo: () => dispatch({ type: 'undo' }), redo: () => dispatch({ type: 'redo' }),
    reset: () => dispatch({ type: 'change', update: () => ({ options: defaultOptions(), design: {} }) }),
  }
}
