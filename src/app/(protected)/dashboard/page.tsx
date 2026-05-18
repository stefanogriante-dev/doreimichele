import { getSessionUser } from '@/lib/auth'
import { CalendarDays, Bell, Music } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getSessionUser()

  const guide = [
    {
      icon: CalendarDays,
      color: 'bg-sky-100 text-sky-600',
      titolo: 'Calendario',
      testo: 'Qui trovi tutte le prove, le celebrazioni e gli eventi. Per ogni appuntamento puoi indicare se ci sarai: tocca ✅ Ci sono, ❌ Non ci sono oppure ❓ Forse. All\'interno di ogni evento puoi anche trovare spartiti o testi da scaricare.',
    },
    {
      icon: Bell,
      color: 'bg-amber-100 text-amber-600',
      titolo: 'Avvisi',
      testo: 'Comunicazioni importanti dal direttore e dagli organizzatori. Quando c\'è un avviso nuovo vedrai un pallino rosso sull\'icona. Aprilo per leggerlo e il contatore sparirà.',
    },
    {
      icon: Music,
      color: 'bg-purple-100 text-purple-600',
      titolo: 'Notifiche',
      testo: 'Se hai dato il permesso per le notifiche, riceverai un avviso push ogni volta che viene pubblicata una comunicazione — anche a schermo spento.',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ciao, {user?.full_name.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">Corale di San Michele · Cantù</p>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-4">Benvenuto/a in <span className="font-semibold text-gray-700">DoReMiChele</span>, la tua app per restare aggiornato sulle attività della corale.</p>
        <div className="space-y-3">
          {guide.map(({ icon: Icon, color, titolo, testo }) => (
            <div key={titolo} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-0.5">{titolo}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{testo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
