'use client'

import { Undo2, Redo2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

export function DesignHistoryControls({ canUndo, canRedo, onUndo, onRedo, onReset }: {
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void; onReset: () => void
}) {
  return <div role="group" aria-label="Design history" className="flex flex-wrap gap-2">
    <Button type="button" variant="outline" disabled={!canUndo} onClick={onUndo}><Undo2 />Undo</Button>
    <Button type="button" variant="outline" disabled={!canRedo} onClick={onRedo}><Redo2 />Redo</Button>
    <AlertDialog>
      <AlertDialogTrigger asChild><Button type="button" variant="outline"><RotateCcw />Reset entire design</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Reset your entire design?</AlertDialogTitle><AlertDialogDescription>This restores the jacket’s default colors and options and removes text and artwork from all four views. You can undo the reset. Your saved draft stays unchanged until you save again.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onReset}>Reset design</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
}
