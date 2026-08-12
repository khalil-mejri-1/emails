import { useState, useEffect } from 'react';

const API_URL = 'https://emails-zeta-rust.vercel.app/api/accounts';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // حالة التعديل والتعرف على الحساب المختار
  const [editingAccountId, setEditingAccountId] = useState(null);

  // حالة نافذة تأكيد الحذف
  const [accountToDelete, setAccountToDelete] = useState(null);

  // Form States
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Sections enablement
  const [enableGemini, setEnableGemini] = useState(true);
  const [enableGpt, setEnableGpt] = useState(true);

  // Duration Mode
  const [durationMode, setDurationMode] = useState('unified');

  // Unified Duration
  const [unifiedStatus, setUnifiedStatus] = useState('suspended');
  const [unifiedDays, setUnifiedDays] = useState(7);
  const [unifiedHours, setUnifiedHours] = useState(0);
  const [unifiedMinutes, setUnifiedMinutes] = useState(0);

  // Custom Gemini Duration
  const [geminiStatus, setGeminiStatus] = useState('suspended');
  const [geminiDays, setGeminiDays] = useState(7);
  const [geminiHours, setGeminiHours] = useState(0);
  const [geminiMinutes, setGeminiMinutes] = useState(0);

  // Custom GPT Duration
  const [gptStatus, setGptStatus] = useState('suspended');
  const [gptDays, setGptDays] = useState(7);
  const [gptHours, setGptHours] = useState(0);
  const [gptMinutes, setGptMinutes] = useState(0);

  useEffect(() => {
    fetchAccounts();
  }, []);

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

  // فتح نموذج إضافة جديد
  const handleOpenAddModal = () => {
    resetForm();
    setEditingAccountId(null);
    setIsModalOpen(true);
  };

  // فتح نموذج تعديل حساب قائم
  const handleOpenEditModal = (acc) => {
    setEditingAccountId(acc._id || acc.id);
    setEmail(acc.email || '');
    setOwnerName(acc.ownerName || '');

    const hasGemini = acc.gemini?.enabled ?? false;
    const hasGpt = acc.gpt?.enabled ?? false;
    setEnableGemini(hasGemini);
    setEnableGpt(hasGpt);

    setDurationMode('custom'); // استخدام الوضع المخصص لملء البيانات بدقة

    if (acc.gemini) {
      setGeminiStatus(acc.gemini.status || 'suspended');
      setGeminiDays(acc.gemini.daysToWait || 0);
      setGeminiHours(acc.gemini.hoursToWait || 0);
      setGeminiMinutes(acc.gemini.minutesToWait || 0);
    }

    if (acc.gpt) {
      setGptStatus(acc.gpt.status || 'suspended');
      setGptDays(acc.gpt.daysToWait || 0);
      setGptHours(acc.gpt.hoursToWait || 0);
      setGptMinutes(acc.gpt.minutesToWait || 0);
    }

    setIsModalOpen(true);
  };

  // حفظ الحساب (إضافة أو تعديل)
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!email || !ownerName || (!enableGemini && !enableGpt)) return;

    const accountData = {
      email,
      ownerName,
      gemini: {
        enabled: enableGemini,
        status: durationMode === 'unified' ? unifiedStatus : geminiStatus,
        daysToWait: durationMode === 'unified' ? Number(unifiedDays) : Number(geminiDays),
        hoursToWait: durationMode === 'unified' ? Number(unifiedHours) : Number(geminiHours),
        minutesToWait: durationMode === 'unified' ? Number(unifiedMinutes) : Number(geminiMinutes),
      },
      gpt: {
        enabled: enableGpt,
        status: durationMode === 'unified' ? unifiedStatus : gptStatus,
        daysToWait: durationMode === 'unified' ? Number(unifiedDays) : Number(gptDays),
        hoursToWait: durationMode === 'unified' ? Number(unifiedHours) : Number(gptHours),
        minutesToWait: durationMode === 'unified' ? Number(unifiedMinutes) : Number(gptMinutes),
      },
    };

    try {
      const isEditing = Boolean(editingAccountId);
      const url = isEditing ? `${API_URL}/${editingAccountId}` : API_URL;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      if (response.ok) {
        const savedAccount = await response.json();
        if (isEditing) {
          setAccounts(accounts.map((acc) => ((acc._id || acc.id) === editingAccountId ? savedAccount : acc)));
        } else {
          setAccounts([savedAccount, ...accounts]);
        }
        resetForm();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du compte:", error);
    }
  };

  // تأكيد الحذف النهائي
  const confirmDelete = async () => {
    if (!accountToDelete) return;
    const id = accountToDelete._id || accountToDelete.id;

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAccounts(accounts.filter((acc) => (acc._id || acc.id) !== id));
        setAccountToDelete(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const resetForm = () => {
    setEditingAccountId(null);
    setEmail('');
    setOwnerName('');
    setEnableGemini(true);
    setEnableGpt(true);
    setDurationMode('unified');
    setUnifiedStatus('suspended');
    setUnifiedDays(7);
    setUnifiedHours(0);
    setUnifiedMinutes(0);
    setGeminiStatus('suspended');
    setGeminiDays(7);
    setGeminiHours(0);
    setGeminiMinutes(0);
    setGptStatus('suspended');
    setGptDays(7);
    setGptHours(0);
    setGptMinutes(0);
  };

  const getTotalDurationMs = (days, hours, minutes) => {
    return (Number(days) * 24 * 60 * 60 + Number(hours) * 60 * 60 + Number(minutes) * 60) * 1000;
  };

  const getModelDetails = (modelData) => {
    if (!modelData || !modelData.enabled) return null;

    if (modelData.status === 'active') {
      return {
        isReady: true,
        text: 'Actif',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        progress: 100,
        barColor: 'bg-emerald-500',
      };
    }

    const totalMs = getTotalDurationMs(modelData.daysToWait, modelData.hoursToWait, modelData.minutesToWait);
    const returnDate = new Date(new Date(modelData.blockedAt).getTime() + totalMs);
    const diffMs = returnDate - new Date();

    if (diffMs <= 0) {
      return {
        isReady: true,
        text: 'Prêt',
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        progress: 100,
        barColor: 'bg-emerald-500',
      };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const progress = Math.max(0, Math.min(100, ((totalMs - diffMs) / totalMs) * 100));
    const isLessThanOneDay = diffMs <= 24 * 60 * 60 * 1000;

    return {
      isReady: false,
      text: `${days}j ${hours}h ${minutes}m ${seconds}s`,
      badgeColor: isLessThanOneDay
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      progress,
      barColor: isLessThanOneDay ? 'bg-amber-500' : 'bg-rose-500',
      returnDateFormatted: returnDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-4 sm:p-8 font-sans dir-ltr">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-800/60">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
            Suivi des comptes AntiGravity
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gestion et suivi multi-modèles (Gemini & ChatGPT)</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          <span className="text-xl">+</span> Ajouter un compte
        </button>
      </div>

      {/* Grid Accounts */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Chargement des comptes depuis la base de données...
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const id = acc._id || acc.id;
            const geminiInfo = getModelDetails(acc.gemini);
            const gptInfo = getModelDetails(acc.gpt);

            return (
              <div
                key={id}
                className="relative bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 backdrop-blur-md shadow-md flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-xl"
              >
                <div>
                  {/* Top: Email & Action Buttons (Edit / Delete) */}
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(acc)}
                        className="text-slate-400 hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-slate-800/50"
                        title="Modifier le compte"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setAccountToDelete(acc)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-lg hover:bg-slate-800/50"
                        title="Supprimer le compte"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-right truncate">
                      <h3 className="font-semibold text-sm text-slate-100 truncate" title={acc.email}>
                        {acc.email}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">📱 {acc.ownerName}</p>
                    </div>
                  </div>

                  {/* Model Sections */}
                  <div className="space-y-2 mt-3 pt-2 border-t border-slate-800/60">
                    {/* Gemini Row */}
                    {geminiInfo && (
                      <div className="bg-slate-950/40 rounded-lg p-2 border border-cyan-500/20">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className={`px-2 py-0.5 rounded font-medium border ${geminiInfo.badgeColor}`}>
                            {geminiInfo.text}
                          </span>
                          <span className="font-bold text-cyan-400">Gemini</span>
                        </div>
                        {!geminiInfo.isReady && (
                          <>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>{geminiInfo.returnDateFormatted}</span>
                              <span>:Retour prévu</span>
                            </div>
                            <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${geminiInfo.barColor}`}
                                style={{ width: `${geminiInfo.progress}%` }}
                              ></div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* GPT Row */}
                    {gptInfo && (
                      <div className="bg-slate-950/40 rounded-lg p-2 border border-emerald-500/20">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className={`px-2 py-0.5 rounded font-medium border ${gptInfo.badgeColor}`}>
                            {gptInfo.text}
                          </span>
                          <span className="font-bold text-emerald-400">ChatGPT</span>
                        </div>
                        {!gptInfo.isReady && (
                          <>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>{gptInfo.returnDateFormatted}</span>
                              <span>:Retour prévu</span>
                            </div>
                            <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${gptInfo.barColor}`}
                                style={{ width: `${gptInfo.progress}%` }}
                              ></div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editingAccountId ? 'Modifier le compte' : 'Ajouter un nouveau compte'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              {/* Account Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Adresse e-mail</label>
                  <input
                    type="text"
                    required
                    placeholder="exemple@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Propriétaire / Tél</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tél Mohamed"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Checkboxes: Choisir les modèles */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-300 mb-2 font-medium">Modèles à activer</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={enableGemini}
                      onChange={(e) => setEnableGemini(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Gemini</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      checked={enableGpt}
                      onChange={(e) => setEnableGpt(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>ChatGPT</span>
                  </label>
                </div>
              </div>

              {/* Select Duration Mode */}
              {(enableGemini || enableGpt) && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-3">
                  <label className="block text-slate-300 font-medium">Configuration du temps</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="radio"
                        name="durationMode"
                        value="unified"
                        checked={durationMode === 'unified'}
                        onChange={() => setDurationMode('unified')}
                      />
                      <span>Durée unifiée (Même durée)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="radio"
                        name="durationMode"
                        value="custom"
                        checked={durationMode === 'custom'}
                        onChange={() => setDurationMode('custom')}
                      />
                      <span>Durée séparée pour chaque modèle</span>
                    </label>
                  </div>

                  {/* Unified Duration Inputs */}
                  {durationMode === 'unified' && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Statut:</span>
                        <select
                          value={unifiedStatus}
                          onChange={(e) => setUnifiedStatus(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-100"
                        >
                          <option value="suspended">Suspendu</option>
                          <option value="active">Actif</option>
                        </select>
                      </div>
                      {unifiedStatus === 'suspended' && (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Jours</span>
                            <input
                              type="number"
                              min="0"
                              value={unifiedDays}
                              onChange={(e) => setUnifiedDays(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Heures</span>
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={unifiedHours}
                              onChange={(e) => setUnifiedHours(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Minutes</span>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={unifiedMinutes}
                              onChange={(e) => setUnifiedMinutes(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Duration Inputs */}
                  {durationMode === 'custom' && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-3">
                      {/* Custom Gemini */}
                      {enableGemini && (
                        <div className="p-2 bg-slate-900/50 rounded-lg border border-cyan-500/20 space-y-2">
                          <div className="flex justify-between items-center font-bold text-cyan-400">
                            <span>Gemini</span>
                            <select
                              value={geminiStatus}
                              onChange={(e) => setGeminiStatus(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-100 font-normal"
                            >
                              <option value="suspended">Suspendu</option>
                              <option value="active">Actif</option>
                            </select>
                          </div>
                          {geminiStatus === 'suspended' && (
                            <div className="grid grid-cols-3 gap-1.5">
                              <input
                                type="number"
                                placeholder="Jours"
                                value={geminiDays}
                                onChange={(e) => setGeminiDays(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center"
                              />
                              <input
                                type="number"
                                placeholder="Heures"
                                value={geminiHours}
                                onChange={(e) => setGeminiHours(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center"
                              />
                              <input
                                type="number"
                                placeholder="Minutes"
                                value={geminiMinutes}
                                onChange={(e) => setGeminiMinutes(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom GPT */}
                      {enableGpt && (
                        <div className="p-2 bg-slate-900/50 rounded-lg border border-emerald-500/20 space-y-2">
                          <div className="flex justify-between items-center font-bold text-emerald-400">
                            <span>ChatGPT</span>
                            <select
                              value={gptStatus}
                              onChange={(e) => setGptStatus(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-100 font-normal"
                            >
                              <option value="suspended">Suspendu</option>
                              <option value="active">Actif</option>
                            </select>
                          </div>
                          {gptStatus === 'suspended' && (
                            <div className="grid grid-cols-3 gap-1.5">
                              <input
                                type="number"
                                placeholder="Jours"
                                value={gptDays}
                                onChange={(e) => setGptDays(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center"
                              />
                              <input
                                type="number"
                                placeholder="Heures"
                                value={gptHours}
                                onChange={(e) => setGptHours(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center"
                              />
                              <input
                                type="number"
                                placeholder="Minutes"
                                value={gptMinutes}
                                onChange={(e) => setGptMinutes(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl transition-colors"
                >
                  {editingAccountId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl border border-rose-500/20">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Confirmer la suppression</h3>
              <p className="text-xs text-slate-400 mt-2">
                Êtes-vous sûr de vouloir supprimer le compte{' '}
                <span className="text-slate-200 font-semibold">{accountToDelete.email}</span> ? Cette action est
                irréversible.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 rounded-xl text-xs transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={() => setAccountToDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-xs transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;