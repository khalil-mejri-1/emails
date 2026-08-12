import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:7000/api/accounts';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [status, setStatus] = useState('suspended');
  const [daysToWait, setDaysToWait] = useState(7);
  const [hoursToWait, setHoursToWait] = useState(0);
  const [minutesToWait, setMinutesToWait] = useState(0);

  // 1. جلب الحسابات عند تحميل الصفحة
  useEffect(() => {
    fetchAccounts();
  }, []);

  // 2. تحديث العداد كل ثانية
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!email || !ownerName) return;

    const accountData = {
      email,
      ownerName,
      status,
      daysToWait: status === 'suspended' ? Number(daysToWait) : 0,
      hoursToWait: status === 'suspended' ? Number(hoursToWait) : 0,
      minutesToWait: status === 'suspended' ? Number(minutesToWait) : 0,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      if (response.ok) {
        const savedAccount = await response.json();
        setAccounts([savedAccount, ...accounts]);
        resetForm();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du compte:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAccounts(accounts.filter((acc) => (acc._id || acc.id) !== id));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const resetForm = () => {
    setEmail('');
    setOwnerName('');
    setStatus('suspended');
    setDaysToWait(7);
    setHoursToWait(0);
    setMinutesToWait(0);
  };

  const getTotalDurationMs = (days, hours, minutes) => {
    return (
      (Number(days) * 24 * 60 * 60 +
        Number(hours) * 60 * 60 +
        Number(minutes) * 60) *
      1000
    );
  };

  const getReturnDate = (acc) => {
    const totalMs = getTotalDurationMs(
      acc.daysToWait,
      acc.hoursToWait,
      acc.minutesToWait
    );
    return new Date(new Date(acc.blockedAt).getTime() + totalMs);
  };

  const getRemainingTimeDetails = (acc) => {
    if (acc.status === 'active') {
      return {
        isReady: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progress: 100,
        borderColor: 'border-emerald-500/50 hover:border-emerald-500/80',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        barColor: 'bg-emerald-500',
      };
    }

    const returnDate = getReturnDate(acc);
    const diffMs = returnDate - new Date();

    if (diffMs <= 0) {
      return {
        isReady: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        progress: 100,
        borderColor: 'border-emerald-500/50 hover:border-emerald-500/80',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        barColor: 'bg-emerald-500',
      };
    }

    const totalMs = getTotalDurationMs(
      acc.daysToWait,
      acc.hoursToWait,
      acc.minutesToWait
    );

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const progress = Math.max(
      0,
      Math.min(100, ((totalMs - diffMs) / totalMs) * 100)
    );

    const isLessThanOneDay = diffMs <= 24 * 60 * 60 * 1000;

    return {
      isReady: false,
      days,
      hours,
      minutes,
      seconds,
      progress,
      borderColor: isLessThanOneDay
        ? 'border-amber-500/50 hover:border-amber-500/80'
        : 'border-rose-500/50 hover:border-rose-500/80',
      badgeColor: isLessThanOneDay
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      barColor: isLessThanOneDay ? 'bg-amber-500' : 'bg-rose-500',
    };
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-4 sm:p-8 font-sans dir-ltr">
      {/* Header الأصلي */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-800/60">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
            Suivi des comptes AntiGravity
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestion et suivi de la période de suspension des comptes Gmail
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          <span className="text-xl">+</span> Ajouter un compte
        </button>
      </div>

      {/* Grid Accounts - بطاقات مدمجة وأكثر أناقة */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Chargement des comptes depuis la base de données...
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const id = acc._id || acc.id;
            const {
              isReady,
              days,
              hours,
              minutes,
              seconds,
              progress,
              borderColor,
              badgeColor,
              barColor,
            } = getRemainingTimeDetails(acc);

            const returnDate = getReturnDate(acc);

            return (
              <div
                key={id}
                className={`relative bg-slate-900/60 border ${borderColor} rounded-xl p-3.5 backdrop-blur-md shadow-md flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-center mb-3 gap-2">
                    <button
                      onClick={() => handleDelete(id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 text-sm rounded-lg hover:bg-slate-800/50"
                      title="Supprimer le compte"
                    >
                      ✕
                    </button>

                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium border ${badgeColor} tracking-wide`}
                    >
                      {acc.status === 'active'
                        ? 'Actif (En fonctionnement)'
                        : isReady
                          ? 'Prêt à l\'emploi'
                          : `Temps restant: ${days}j ${hours}h ${minutes}m ${seconds}s`}
                    </span>
                  </div>

                  {/* Account Information */}
                  <div className="space-y-1 mb-3 text-right">
                    <h3
                      className="font-semibold text-sm text-slate-100 truncate"
                      title={acc.email}
                    >
                      {acc.email}
                    </h3>
                    <div className="flex items-center justify-end text-xs text-slate-400 gap-1.5">
                      <span className="text-slate-300 font-medium">{acc.ownerName}</span>
                      <span>:Téléphone  📱</span>
                    </div>
                  </div>
                </div>

                {/* Return Date & Progress Bar */}
                {acc.status === 'suspended' && (
                  <div className="pt-2.5 border-t border-slate-800/80">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
                      <span className="text-indigo-300 font-medium">
                        {returnDate.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>:Date de retour prévue</span>
                    </div>

                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden p-[1px]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {accounts.length === 0 && (
            <div className="col-span-full text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
              <p className="text-slate-500 text-sm">Aucun compte enregistré pour le moment.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal الأصلي */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-100">Ajouter un nouveau compte</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Adresse e-mail (Gmail)
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemple@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nom du propriétaire / Téléphone
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Téléphone Mohamed"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Statut du compte
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="suspended">Suspendu (En attente de réactivation)</option>
                  <option value="active">Actif (Fonctionne actuellement)</option>
                </select>
              </div>

              {status === 'suspended' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Durée restante de suspension
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-xs text-slate-400 mb-1 block">Jours</span>
                      <input
                        type="number"
                        min="0"
                        value={daysToWait}
                        onChange={(e) => setDaysToWait(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 mb-1 block">Heures</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={hoursToWait}
                        onChange={(e) => setHoursToWait(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 mb-1 block">Minutes</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutesToWait}
                        onChange={(e) => setMinutesToWait(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-colors"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;