"use client";

import dynamic from "next/dynamic";
import { Component, type ErrorInfo, type ReactNode } from "react";
import type { ReviewerBioBlock } from "@/lib/types";
import styles from "./reviewer-profile.module.css";

const ClientOnlyBlockNote = dynamic(() => import("./blocknote-content"), {
  ssr: false,
  loading: () => <div className={styles.editorLoading} role="status">소개를 불러오고 있어요.</div>,
});

export function DynamicBlockNote(props: {
  initialContent: ReviewerBioBlock[];
  editable?: boolean;
  onChange?: (blocks: ReviewerBioBlock[]) => void;
}) {
  return (
    <BlockNoteErrorBoundary editable={props.editable !== false}>
      <ClientOnlyBlockNote {...props} />
    </BlockNoteErrorBoundary>
  );
}

class BlockNoteErrorBoundary extends Component<{ children: ReactNode; editable: boolean }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // 공개 데이터 하나가 잘못되어도 나머지 리뷰어 페이지는 계속 보여줍니다.
  }

  render() {
    if (this.state.failed) {
      return <div className={styles.editorFailure} role="alert">{this.props.editable ? "편집기를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요." : "소개를 안전하게 표시할 수 없어요."}</div>;
    }
    return this.props.children;
  }
}
