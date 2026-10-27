# 構成と拡張方針

## 次の実装に向けた設計

[設計文書インデックス](README.md)、[共通業務ポリシー](policies/duty-policy.md)、
[UIポリシー](../client/docs/policies/ui-policy.md)、[サーバー設計](../server/docs/README.md) を参照してください。
目標構造は未実装です。この文書の以下の節は現在の構成を説明します。

## 現在

- client/src/pages, components: 表示とイベント接続
- client/src/hooks/duties: APIの調整、フォーム状態、検証、表示対象の集計
- client/src/repositories: DTO↔Domainマッピングとデータ収集
- client/src/apis: AxiosによるHTTP通信・共通エラー処理
- client/src/stores: Zustandによる画面状態（選択・期間・通知・処理状態）
- client/src/router: Hash RouterとCommonLayout + Outlet
- client/docs: クライアント構造・API契約・デザインシステム
- server/engine/rotation/AssignmentEngine: 副作用のない周期・順番計算
- server/service: 機能別の検証・トランザクション・計算調整
- server/repository: 機能別インターフェースとJDBC実装、MyBatisとの組み合わせ
- server/mapper + resources/mapper: MyBatisによる配当・履歴の結合検索
- [サーバー構造](../server/docs/architecture/server-structure.md) / [データアクセス](../server/docs/architecture/data-access.md)
- Flyway: DBスキーマの履歴

確定処理は対象のduties行をロックします。
同じ当番の確定・代理変更・除外登録を直列化し、DBのユニーク制約でも重複を防ぎます。
確定前にサーバーで再計算し、プレビューのハッシュと照合します。

## AWS（未作成）

候補構成：

- 静的フロント：S3 + CloudFront
- /api：同一オリジンでALB + ECS Fargateへ転送
- DB：非公開サブネットのRDS for MySQL
- 設定・秘密情報：Secrets Manager
- ログ：CloudWatch
- デプロイ認証：GitHub Actions OIDC、長期アクセスキーは使用しない

CIはビルドとテスト、成果物の保存までです。
CDはAWSのアカウント、リージョン、ドメイン、社内アクセス方式、予算を決めてから追加します。

## メール・Pepper（未実装）

将来は「通知予定」と「チャネル別配信結果」をDBに持たせます。
業務ID・対象期間・通知種別・チャネルを冪等キーとして、再実行時の二重送信を防ぐ想定です。
開催日変更時は未送信の通知を更新し、既送信なら必要に応じて訂正通知を作ります。
Pepper側はサーバーから配信内容を取得し、読み上げと表示を担当します。
ネットワークから直接ロボットを操作する構成は前提にしていません。
