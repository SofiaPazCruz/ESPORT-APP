import React, { useState } from 'react';
import { Tournament, Participant } from '../types/tournament';
import { UniversityBrandConfig } from '../data/universityBrand';
import { GamerPassModal } from '../components/GamerPassModal';
import { WelcomeEmailModal } from '../components/WelcomeEmailModal';
import { 
  Users, 
  Search, 
  Download, 
  Trash2, 
  IdCard, 
  UserPlus, 
  Gamepad2, 
  GraduationCap, 
  QrCode,
  School,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface RosterWindowProps {
  tournaments: Tournament[];
  participants: Participant[];
  brandConfig: UniversityBrandConfig;
  onDeleteParticipant: (id: number) => void;
  onClearAll: () => void;
  onGoToRegistration: () => void;
  onMarkEmailSent?: (participantId: number) => void;
}

export const RosterWindow: React.FC<RosterWindowProps> = ({
  tournaments,
  participants,
  brandConfig,
  onDeleteParticipant,
  onClearAll,
  onGoToRegistration,
  onMarkEmailSent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTournament, setFilterTournament] = useState<number | 'ALL'>('ALL');
  const [activeModalParticipant, setActiveModalParticipant] = useState<Participant | null>(null);
  const [activeEmailParticipant, setActiveEmailParticipant] = useState<Participant | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const filteredParticipants = participants.filter(p => {
    const matchesTournament = filterTournament === 'ALL' || p.tournamentId === filterTournament;
    const matchesSearch = 
      p.gamertag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.checkInCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.studentId && p.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.faculty && p.faculty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.tournamentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTournament && matchesSearch;
  });

  const handleExportJson = () => {
    if (participants.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(participants, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `padron_jugadores_fit_uat_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* WINDOW TITLE BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Directorio Universitario
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#002f6c] mt-1 flex items-center gap-2.5">
            <Users className="w-8 h-8 text-[#002f6c]" />
            <span>Padrón de Jugadores ({participants.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
            Consulta la lista completa de estudiantes inscritos en los torneos de videojuegos de la FIT UAT, genera sus pases o gestiona las plazas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onGoToRegistration}
            className="px-4 py-2.5 rounded-2xl bg-[#002f6c] hover:bg-[#002454] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Inscribir Jugador</span>
          </button>

          {participants.length > 0 && (
            <>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-[#002f6c]" />
                <span>Exportar JSON</span>
              </button>
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Vaciar Padrón</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH */}
      {participants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Gamertag, Matrícula, Carrera o Código de Check-in..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#002f6c]"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              aria-label="Filtrar por torneo"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#002f6c]"
            >
              <option value="ALL">Todos los Torneos ({participants.length})</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* PARTICIPANTS TABLE / EMPTY STATE */}
      {participants.length === 0 ? (
        <div className="py-16 px-4 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Base de datos limpia (0 jugadores)</span>
            </div>
            <h3 className="text-lg font-bold font-heading text-slate-900">
              No hay jugadores inscritos en este momento
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Todos los datos simulados y los registros ingresados anteriormente fueron eliminados. La plataforma está limpia como para usar por primera vez.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onGoToRegistration}
              className="px-5 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#002454] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>Inscribir Nuevo Jugador</span>
            </button>
            <button
              onClick={onClearAll}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
              title="Asegura que todos los contadores de plazas de torneos estén sincronizados en 0"
            >
              Restablecer Torneos a Cero
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5 font-bold">Jugador</th>
                  <th className="py-3.5 px-5 font-bold">Carrera / Matrícula</th>
                  <th className="py-3.5 px-5 font-bold">Torneo</th>
                  <th className="py-3.5 px-5 font-bold">Plataforma</th>
                  <th className="py-3.5 px-5 font-bold">Código Check-In</th>
                  <th className="py-3.5 px-5 font-bold text-center">Seed</th>
                  <th className="py-3.5 px-5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No se encontraron jugadores que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatarUrl}
                            alt={p.gamertag}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 object-cover shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm font-heading">{p.gamertag}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{p.email}</span>
                              {p.emailSent ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200" title={`Correo enviado${p.emailSentAt ? ` a las ${p.emailSentAt}` : ''}`}>
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Enviado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-blue-50 text-[#002f6c] text-[9px] font-bold border border-blue-200" title="Pendiente de enviar correo">
                                  Por enviar
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {p.faculty || 'Ingeniería FIT UAT'}
                        </div>
                        <div className="text-[11px] text-[#002f6c] font-semibold">
                          {p.studentId ? `Matrícula: ${p.studentId}` : 'Sin Matrícula'}
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 truncate max-w-[170px]">{p.tournamentName}</div>
                        <div className="text-[11px] text-[#ed1c24] font-semibold">{p.gameName}</div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-600 font-medium">{p.platform}</td>

                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                          {p.checkInCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-red-100 text-[#ed1c24] font-bold border border-red-200">
                          #{p.seedNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveEmailParticipant(p)}
                            className="p-2 rounded-xl text-[#002f6c] hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                            title="Ver / Enviar Correo de Bienvenida"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveModalParticipant(p)}
                            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                            title="Ver Pase Oficial del Jugador"
                          >
                            <IdCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteParticipant(p.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeModalParticipant && (
        <GamerPassModal
          participant={activeModalParticipant}
          tournament={tournaments.find(t => t.id === activeModalParticipant.tournamentId)}
          brandConfig={brandConfig}
          onClose={() => setActiveModalParticipant(null)}
          onRegisterAnother={() => setActiveModalParticipant(null)}
        />
      )}

      {activeEmailParticipant && (
        <WelcomeEmailModal
          isOpen={Boolean(activeEmailParticipant)}
          participant={activeEmailParticipant}
          tournament={tournaments.find(t => t.id === activeEmailParticipant.tournamentId)}
          brandConfig={brandConfig}
          onClose={() => setActiveEmailParticipant(null)}
          onMarkEmailSent={onMarkEmailSent}
        />
      )}

      {/* Confirmation Modal to Empty Roster & Reset Tournaments */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  ¿Vaciar todo el padrón de jugadores?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta acción eliminará todos los registros y restablecerá los torneos.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
              Se eliminarán todos los participantes registrados tanto simulados como manuales. Las plazas de los 5 torneos oficiales de videojuegos se restablecerán a 0 y las llaves se reiniciarán limpias.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setIsClearConfirmOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Vaciar y Reiniciar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
