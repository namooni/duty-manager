import type {useDutyMetadataEditor} from '@/hooks/duties/useDutyMetadataEditor';
import * as U from '@/components/ui';
export function DutyMetadataDialog({editor}: {editor: ReturnType<typeof useDutyMetadataEditor>}) {
  if (!editor.original) return null;
  return (
    <U.Modal title="基本情報を編集" busy={editor.busy} onClose={editor.close}>
      {editor.error && <U.Alert role="alert">{editor.error}</U.Alert>}
      <U.Form
        onSubmit={event => {
          event.preventDefault();
          void editor.save();
        }}
      >
        <U.Field>
          <U.Text>当番の名前</U.Text>
          <U.Input
            required
            autoFocus
            maxLength={100}
            value={editor.name}
            onChange={event => editor.setName(event.target.value)}
          />
        </U.Field>
        <U.Field>
          <U.Text>説明（任意）</U.Text>
          <U.Textarea
            maxLength={1000}
            value={editor.description}
            onChange={event => editor.setDescription(event.target.value)}
          />
        </U.Field>
        <U.Muted>開催日と担当者は変わりません。</U.Muted>
        <U.Row style={{justifyContent: 'flex-end'}}>
          <U.Button disabled={editor.busy} onClick={editor.close}>
            キャンセル
          </U.Button>
          <U.Button type="submit" variant="primary" disabled={editor.busy}>
            {editor.busy ? '保存中…' : '保存する'}
          </U.Button>
        </U.Row>
      </U.Form>
    </U.Modal>
  );
}
