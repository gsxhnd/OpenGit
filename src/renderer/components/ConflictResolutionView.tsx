import { motion } from 'motion/react'
import { useAppStore } from '../store'
import { Button } from './ui/button'

export function ConflictResolutionView() {
  const { conflictFiles, resolveConflict, abortMerge, repoStatus } = useAppStore()

  if (!repoStatus?.status.mergeHead) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border bg-destructive/10 p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-2">Merge Conflict</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {conflictFiles.length} file(s) have conflicts. Resolve them to complete the merge.
          </p>
          <div className="space-y-2">
            {conflictFiles.map((file) => (
              <div key={file} className="flex items-center justify-between gap-2 p-2 bg-background rounded text-xs">
                <span className="font-mono">{file}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => resolveConflict(file, 'ours')}
                  >
                    Keep Ours
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => resolveConflict(file, 'theirs')}
                  >
                    Keep Theirs
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 px-3"
          onClick={abortMerge}
        >
          Abort Merge
        </Button>
      </div>
    </motion.div>
  )
}
