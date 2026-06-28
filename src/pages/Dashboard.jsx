import { useEffect, useState } from 'react';
import { Users, ShieldCheck, CalendarClock, Layers } from 'lucide-react';
import StatCard from '../components/ui/StatCard.jsx';
import Card from '../components/ui/Card.jsx';
import { invoke } from '../lib/ipc.js';
import { formatNumber } from '../lib/format.js';

export default function Dashboard() {
  const [usersCount, setUsersCount] = useState(null);
  const [license, setLicense] = useState(null);

  useEffect(() => {
    invoke('users:list').then((rows) => setUsersCount(rows.length));
    invoke('license:status').then(setLicense);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">نظرة عامة</h1>
        <p className="mt-1 text-sm text-ink-mute">
          هذه صفحة افتراضية في القالب الأساسي — هتتبدّل بداشبورد كل نظام عند البناء عليه.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="عدد المستخدمين"
          value={usersCount === null ? '—' : formatNumber(usersCount)}
          icon={<Users size={20} />}
        />
        <StatCard
          label="أيام متبقية على الترخيص"
          value={license?.daysLeft === null || license?.daysLeft === undefined ? '∞' : formatNumber(license.daysLeft)}
          icon={<CalendarClock size={20} />}
        />
        <StatCard label="حالة الترخيص" value={license?.activated ? 'مفعّل' : '—'} icon={<ShieldCheck size={20} />} />
        <StatCard label="الموديولات المثبّتة" value="Auth" icon={<Layers size={20} />} />
      </div>

      <Card accent>
        <h2 className="font-display text-base font-semibold text-ink">الخطوات التالية لبناء نظام كامل</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-ink-soft">
          <li>غيّر اسم المنتج في <span className="tnum font-mono text-xs">electron/product.config.js</span> (مثلاً clinic).</li>
          <li>أضف موديول جديد في <span className="tnum font-mono text-xs">electron/ipc/</span> وسجّله في <span className="tnum font-mono text-xs">main.js</span>.</li>
          <li>أضف صفحاته في <span className="tnum font-mono text-xs">src/pages/</span> ولينك في <span className="tnum font-mono text-xs">Sidebar.jsx</span>.</li>
          <li>غيّر لون النظام عبر <span className="tnum font-mono text-xs">data-brand</span> في index.html.</li>
        </ol>
      </Card>
    </div>
  );
}
