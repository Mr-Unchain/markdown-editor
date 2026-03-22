import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { SuggestionOptions } from '@tiptap/suggestion'
import type { SlashCommandItem } from '$lib/types/slash-command'

export interface SlashCommandOptions {
  suggestion: Partial<SuggestionOptions<SlashCommandItem>>
}

/** スラッシュコマンドエクステンション（@tiptap/suggestion ベース） */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.action(editor, range)
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
