"use client";

import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, type PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { ko } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import type { ReviewerBioBlock } from "@/lib/types";
import styles from "./reviewer-profile.module.css";

const reviewerSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: defaultBlockSpecs.heading,
    bulletListItem: defaultBlockSpecs.bulletListItem,
    numberedListItem: defaultBlockSpecs.numberedListItem,
    checkListItem: defaultBlockSpecs.checkListItem,
    quote: defaultBlockSpecs.quote,
    codeBlock: defaultBlockSpecs.codeBlock,
    divider: defaultBlockSpecs.divider,
    toggleListItem: defaultBlockSpecs.toggleListItem,
  },
  inlineContentSpecs: {
    text: defaultInlineContentSpecs.text,
    // BlockNote 0.54의 타입은 link를 필수로 선언하지만, 런타임 API는 공식 문서처럼 전달한 spec만 등록합니다.
  } as unknown as typeof defaultInlineContentSpecs,
});

export default function ReviewerBlockNote({
  initialContent,
  editable = true,
  onChange,
}: {
  initialContent: ReviewerBioBlock[];
  editable?: boolean;
  onChange?: (blocks: ReviewerBioBlock[]) => void;
}) {
  const editor = useCreateBlockNote({
    schema: reviewerSchema,
    initialContent: initialContent.length ? initialContent as unknown as PartialBlock<typeof reviewerSchema.blockSchema>[] : undefined,
    dictionary: ko,
  });

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme="light"
      linkToolbar={false}
      onChange={onChange ? () => onChange(editor.document as unknown as ReviewerBioBlock[]) : undefined}
      className={editable ? styles.blockEditor : styles.blockReader}
      aria-label={editable ? "리뷰어 소개 편집기" : "리뷰어 소개"}
    />
  );
}
