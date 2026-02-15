import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { membersDefaults } from "@/lib/mock/data";

export default function MembersPage() {
  return (
    <Card>
      <CardTitle>ロール / メンバー</CardTitle>
      <CardDescription className="mt-2">MVP では見た目のみ実装（権限編集は未接続）</CardDescription>
      <div className="mt-4 grid max-w-xl grid-cols-3 gap-2 text-sm">
        <p className="font-medium">名前</p>
        <p className="font-medium">ロール</p>
        <p className="font-medium">状態</p>
        {membersDefaults.map((member) => (
          <div key={member.name} className="contents">
            <p>{member.name}</p>
            <p>{member.role}</p>
            <p>{member.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
