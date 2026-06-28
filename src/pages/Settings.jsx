import { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { invoke } from '../lib/ipc.js';
import { useAuth } from '../store/auth.js';
import { formatDate } from '../lib/format.js';

export default function Settings() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [license, setLicense] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    invoke('license:status').then(setLicense);
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setMsg(null);
    const res = await invoke('auth:changePassword', { userId: user.id, oldPassword, newPassword });
    if (!res.ok) {
      setMsg({
        type: 'error',
        text: { wrong_old_password: 'كلمة المرور الحالية غير صحيحة', weak_password: '٦ أحرف على الأقل' }[
          res.reason
        ] || 'حدث خطأ',
      });
      return;
    }
    setUser({ mustChangePassword: false });
    setOldPassword('');
    setNewPassword('');
    setMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">الإعدادات والترخيص</h1>
      </div>

      <Card accent>
        <div className="mb-4 flex items-center gap-2 text-ink">
          <ShieldCheck size={18} className="text-brand" />
          <h2 className="font-display text-base font-semibold">حالة الترخيص</h2>
        </div>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-ink-mute">الحالة</dt>
          <dd><Badge variant={license?.activated ? 'success' : 'danger'}>{license?.activated ? 'مفعّل' : 'غير مفعّل'}</Badge></dd>

          <dt className="text-ink-mute">العميل</dt>
          <dd className="text-ink">{license?.client || '—'}</dd>

          <dt className="text-ink-mute">المنتج</dt>
          <dd className="tnum text-ink">{license?.product || '—'}</dd>

          <dt className="text-ink-mute">تاريخ الانتهاء</dt>
          <dd className="text-ink">{license?.expiresAt ? formatDate(license.expiresAt) : 'دائم'}</dd>

          <dt className="text-ink-mute">كود هذا الجهاز</dt>
          <dd className="tnum text-ink">{license?.machineId}</dd>
        </dl>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2 text-ink">
          <KeyRound size={18} className="text-brand" />
          <h2 className="font-display text-base font-semibold">تغيير كلمة المرور</h2>
        </div>
        {user?.mustChangePassword && (
          <p className="mb-4 rounded bg-amber-100 px-3 py-2 text-sm text-amber-500">
            لازم تغيّر كلمة المرور الافتراضية قبل ما تكمل استخدام النظام.
          </p>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="كلمة المرور الحالية"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="٦ أحرف على الأقل"
            error={msg?.type === 'error' ? msg.text : null}
          />
          {msg?.type === 'success' && <p className="text-sm text-brand-700">{msg.text}</p>}
          <Button type="submit" disabled={!oldPassword || newPassword.length < 6}>
            حفظ كلمة المرور
          </Button>
        </form>
      </Card>
    </div>
  );
}
