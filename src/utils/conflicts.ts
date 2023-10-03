import type { ConflictBlock } from "../models/mergebot";
import * as monaco from 'monaco-editor';

export const getConflictBlockDecorations = (conflictBlocks: Array<ConflictBlock>,
  ourClassName = 'conflicts-ours',
  baseClassName = 'conflicts-base',
  theirsClassName = 'conflicts-theirs') => {
  const decorations: monaco.editor.IModelDeltaDecoration[] = [];
  conflictBlocks.forEach((block) => {
    if(block.ourMarkerLineNo > 0 && block.baseMarkerLineNo > 0 && block.theirMarkerLineNo > 0 && block.endMarkerLineNo>0) {
      // 3-way conflicts
      decorations.push({
        range: new monaco.Range(
          block.ourMarkerLineNo,
          1,
          block.baseMarkerLineNo,
          1
        ),
        options: {
          className: ourClassName,
          isWholeLine: true,
          linesDecorationsClassName: ourClassName,
          marginClassName: ourClassName,
          minimap: {
            color: '#ADD8E6',
            position: monaco.editor.MinimapPosition.Inline,
          }
        },
      });

      decorations.push({
        range: new monaco.Range(
          block.baseMarkerLineNo,
          1,
          block.theirMarkerLineNo,
          1
        ),
        options: {
          className: baseClassName,
          isWholeLine: true,
          linesDecorationsClassName: baseClassName,
          marginClassName: baseClassName,
          minimap: {
            color: '#F5F5F5',
            position: monaco.editor.MinimapPosition.Inline,
          }
        },
      });

      decorations.push({
        range: new monaco.Range(
          block.theirMarkerLineNo,
          1,
          block.endMarkerLineNo,
          1
        ),
        options: {
          className: theirsClassName,
          isWholeLine: true,
          linesDecorationsClassName: theirsClassName,
          marginClassName: theirsClassName,
          minimap: {
            color: '#F06292',
            position: monaco.editor.MinimapPosition.Inline,
          }
        },
      });
    } else if (block.ourMarkerLineNo > 0 && block.theirMarkerLineNo > 0 && block.endMarkerLineNo>0) {
      // traditional 2-way conflicts
      decorations.push({
        range: new monaco.Range(
          block.ourMarkerLineNo,
          1,
          block.theirMarkerLineNo,
          1
        ),
        options: {
          className: ourClassName,
          isWholeLine: true,
          linesDecorationsClassName: ourClassName,
          marginClassName: ourClassName,
        },
      });

      decorations.push({
        range: new monaco.Range(
          block.theirMarkerLineNo,
          1,
          block.endMarkerLineNo,
          1
        ),
        options: {
          className: theirsClassName,
          isWholeLine: true,
          linesDecorationsClassName: theirsClassName,
          marginClassName: theirsClassName,
        },
      });
    }
  });

  return decorations;
};

export const findConflictBlocks = (content: Array<string>) => {
  const conflictBlocks: Array<ConflictBlock> = [];

  let ourMarkerLineNo = -1;
  let baseMarkerLineNo = -1;
  let theirMarkerLineNo = -1;
  let endMarkerLineNo = -1;
  for (let i = 0; i < content.length; i++) {
    const line = content[i];
    if (line.startsWith('<<<<<<<')) {
      ourMarkerLineNo = i + 1;
    } else if (line.startsWith('|||||||') && ourMarkerLineNo > 0) {
      baseMarkerLineNo = i + 1;
    } else if (line.startsWith('=======') && ourMarkerLineNo > 0) {
      theirMarkerLineNo = i + 1;
    } else if (line.startsWith('>>>>>>>') && theirMarkerLineNo > 0) {
      endMarkerLineNo = i + 1;

      conflictBlocks.push({
        ourMarkerLineNo,
        baseMarkerLineNo,
        theirMarkerLineNo,
        endMarkerLineNo,
      });

      ourMarkerLineNo = -1;
      baseMarkerLineNo = -1;
      theirMarkerLineNo = -1;
      endMarkerLineNo = -1;
    }
  }
  return conflictBlocks;
};
