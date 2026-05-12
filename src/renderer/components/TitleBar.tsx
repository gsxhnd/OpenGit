import { useAppStore } from "../store";
import { Button } from "./ui/button";
import styles from "./TitleBar.module.scss";

export function TitleBar() {
  const { repoPath, repoStatus, doFetch, doPull, doPush } = useAppStore();

  const repoName = repoPath ? repoPath.split("/").pop() : "OpenGit";

  return (
    <header className={styles.header}>
      {/* Left: macOS traffic lights spacer + app name */}
      <div className={styles.leftSection}>
        <div className={styles.trafficLightSpacer} />
        <span className={styles.repoName}>{repoName}</span>
        {repoStatus?.status.currentBranch && (
          <span className={styles.branchBadge}>
            {repoStatus.status.currentBranch}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      {repoPath && (
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={() => doFetch()}>
            Fetch1
          </Button>
          <Button variant="ghost" size="sm" onClick={() => doPull()}>
            Pull
          </Button>
          <Button variant="ghost" size="sm" onClick={() => doPush()}>
            Push
          </Button>
        </div>
      )}
    </header>
  );
}
