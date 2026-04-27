import { ModeSelector } from '@/components/story/ModeSelector'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            新しいスライドを作成
          </h2>
          <p className="text-muted-foreground">
            素材ドキュメントとモードを選んで、AIと一緒にスライドを作成しましょう。
            <br />
            ストーリー構成から図の生成・スタイル調整まで対話的に行えます。
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">
            モードを選択してください
          </h3>
          <ModeSelector />
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            データはセッション中のみ保持されます。
            <br />
            ページをリロードするとデータは初期化されます。
          </p>
        </div>
      </div>
    </div>
  )
}
