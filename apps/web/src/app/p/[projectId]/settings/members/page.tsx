import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function MembersPage() {
  return (
    <Card>
      <CardTitle>ロール / メンバー</CardTitle>
      <CardDescription className="mt-2">MVP では見た目のみ実装（権限編集は未接続）</CardDescription>
      <div className="mt-4 grid max-w-xl grid-cols-3 gap-2 text-sm">
        <p className="font-medium">名前</p>
        <p className="font-medium">ロール</p>
        <p className="font-medium">状態</p>
        <p>本部長 佐藤</p>
        <p>決裁者</p>
        <p>有効</p>
        <p>PM 高橋</p>
        <p>編集者</p>
        <p>有効</p>
      </div>
    </Card>
  );
}
