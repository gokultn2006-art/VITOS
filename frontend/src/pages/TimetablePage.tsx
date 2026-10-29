import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, FileText, AlertTriangle, CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import { TABLE_COLUMNS, DAYS_5, DEFAULT_SLOT_LABEL } from '../utils/vitSlotMaster';
import { parseVitCourseRegistrationText, convertCoursesToGridMap } from '../utils/vitParser';
import type { ParsedCourseItem, GridCell } from '../utils/vitParser';
import { DEFAULT_VIT_REGISTRATION_DATA } from '../data/mockData';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { timetableService } from '../services/api';

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();

  // Per-user localStorage key — isolates each student's timetable completely
  const storageKey = user?.regNo ? `vitos_timetable_${user.regNo}` : 'vitos_timetable_default';

  const getSavedText = (): string => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved;
      // Only demo student Chris starts with demo registered data
      if (user?.regNo === '22BCE1024') return DEFAULT_VIT_REGISTRATION_DATA;
      // All new or other users start with fresh, empty timetable slots
      return '';
    } catch {
      return '';
    }
  };

  const [rawText, setRawText] = useState<string>(getSavedText);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourseItem[]>(() => parseVitCourseRegistrationText(getSavedText()));
  const [gridMap, setGridMap] = useState<Map<string, GridCell>>(() => convertCoursesToGridMap(parseVitCourseRegistrationText(getSavedText())));
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [clashCount, setClashCount] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  const handleParseAndLoad = useCallback((textToParse: string) => {
    const parsed = parseVitCourseRegistrationText(textToParse);
    setParsedCourses(parsed);
    const map = convertCoursesToGridMap(parsed);
    setGridMap(map);

    let clashes = 0;
    map.forEach((cell) => {
      if (cell.courses.length > 1) clashes++;
    });
    setClashCount(clashes);
  }, []);

  // When the logged-in user changes (e.g. switch accounts), reload their timetable
  useEffect(() => {
    const saved = getSavedText();
    setRawText(saved);
    handleParseAndLoad(saved);
  }, [storageKey, handleParseAndLoad]);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save to this student's own localStorage slot
    try { localStorage.setItem(storageKey, rawText); } catch {}
    const parsed = parseVitCourseRegistrationText(rawText);
    handleParseAndLoad(rawText);
    setIsImportModalOpen(false);

    // Sync to backend database so Slot Class Finder and schedule services see this student's timetable
    if (parsed.length > 0) {
      try {
        const payloadCourses = parsed.map((c) => ({
          courseCode: c.courseCode,
          courseTitle: c.courseName,
          slotCombination: c.slotString,
          venue: c.venue,
          faculty: c.faculty,
          credits: c.courseType === 'lab' ? 1.5 : 3.0,
        }));
        await timetableService.registerTimetable(payloadCourses);
      } catch (err) {
        console.warn('Backend timetable sync notice:', err);
      }
    }

    setNotification(`Successfully parsed and registered ${parsed.length} courses into your timetable!`);
  };

  const handleClearTimetable = () => {
    try { localStorage.removeItem(storageKey); } catch {}
    setParsedCourses([]);
    setGridMap(new Map());
    setClashCount(0);
    setRawText('');
    setNotification('Your timetable has been completely cleared.');
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </span>
          <button onClick={() => setNotification(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-[#FFBA08] mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#FFBA08]" />
            <span>Official VIT FFCS Timetable Matrix</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Student Weekly Timetable</h1>
          <p className="text-xs md:text-sm text-stone-200 mt-1">
            Parse VTOP registration slips and view courses mapped directly to theory and lab slots.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import VTOP Registration Slip
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 border border-white/20"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleClearTimetable}
          >
            Reset Timetable
          </Button>
        </div>
      </div>

      {/* Clash Warning Banner */}
      {clashCount > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>⚠ TIMETABLE CLASH DETECTED ({clashCount} Conflict Cell(s) Flagged)</span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700">Both courses rendered in conflicting cell</span>
        </div>
      )}

      {/* Fresh Slot Guidance Banner */}
      {parsedCourses.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#03071E]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#DC2F02] shrink-0" />
            <div>
              <p className="font-bold text-[#03071E]">Fresh Student Timetable Matrix</p>
              <p className="text-stone-600">You have no courses scheduled yet. Import your VTOP course registration slip to load your personalized slots.</p>
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsImportModalOpen(true)}>
            Import VTOP Slip
          </Button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-semibold text-stone-700">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#9D0208]" />
            <span>Active Courses: <strong>{parsedCourses.length}</strong></span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#9D0208] text-white">
            Theory Block (Slots A-G, TA-TG)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#370617] text-white">
            Lab Block (Slots L1-L60)
          </span>
        </div>
      </div>

      {/* Reference Image 2 Exact Timetable Grid */}
      <Card className="p-0 overflow-hidden border-2 border-slate-400 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[1250px]">
            {/* Header 1: THEORY HOURS */}
            <thead>
              <tr className="bg-[#C5CAE9] text-[#1A237E]">
                <th className="p-3 border border-slate-400 font-extrabold uppercase text-center w-28 bg-[#C5CAE9] text-xs">
                  THEORY HOURS
                </th>
                {TABLE_COLUMNS.map((col) => {
                  if (col.isLunch) {
                    return (
                      <th key={col.index} rowSpan={2} className="p-1 border border-slate-400 text-center font-bold bg-[#B0BEC5] text-slate-800 w-10 text-[11px] leading-tight select-none">
                        L<br/>U<br/>N<br/>C<br/>H
                      </th>
                    );
                  }
                  return (
                    <th key={col.index} className="p-2 border border-slate-400 text-center font-bold text-[10px] leading-snug">
                      {col.theoryTime ? (
                        <>
                          <div>{col.theoryTime.split(' to ')[0]}</div>
                          <div className="text-[9px] font-normal opacity-80">to</div>
                          <div>{col.theoryTime.split(' to ')[1]}</div>
                        </>
                      ) : (
                        ''
                      )}
                    </th>
                  );
                })}
              </tr>

              {/* Header 2: LAB HOURS */}
              <tr className="bg-[#9BC2F7] text-[#0D47A1]">
                <th className="p-3 border border-slate-400 font-extrabold uppercase text-center w-28 text-xs">
                  LAB HOURS
                </th>
                {TABLE_COLUMNS.filter(c => !c.isLunch).map((col) => (
                  <th key={col.index} className="p-2 border border-slate-400 text-center font-bold text-[10px] leading-snug">
                    {col.labTime ? (
                      <>
                        <div>{col.labTime.split(' to ')[0]}</div>
                        <div className="text-[9px] font-normal opacity-80">to</div>
                        <div>{col.labTime.split(' to ')[1]}</div>
                      </>
                    ) : (
                      ''
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Grid Body: MON to FRI */}
            <tbody>
              {DAYS_5.map((day) => {
                const defaultLabels = DEFAULT_SLOT_LABEL[day];

                return (
                  <tr key={day} className="h-20">
                    {/* Day Corner Label */}
                    <td className="p-3 border border-slate-400 font-extrabold text-center text-slate-800 bg-[#E0E0E0] text-sm tracking-wider">
                      {day}
                    </td>

                    {/* Morning Periods 0 to 5 */}
                    {[0, 1, 2, 3, 4, 5].map((pIdx) => {
                      const cellKey = `${day}_${pIdx}`;
                      const cell = gridMap.get(cellKey);
                      const defaultLabel = defaultLabels[pIdx];
                      const isExtramuralCell = day === 'WED' && (pIdx === 4 || pIdx === 5);

                      return (
                        <td
                          key={pIdx}
                          className={`p-2 border border-slate-400 text-center align-middle transition-colors relative ${
                            !isExtramuralCell && cell && cell.courses.length > 0
                              ? cell.hasClash
                                ? 'bg-amber-100 border-2 border-amber-500'
                                : cell.courses[0].courseType === 'lab'
                                ? 'bg-[#370617] text-white shadow-xs'
                                : 'bg-[#9D0208] text-white shadow-xs'
                              : 'bg-amber-50/70 text-[#03071E] font-semibold'
                          }`}
                        >
                          {!isExtramuralCell && cell && cell.courses.length > 0 ? (
                            <div className="space-y-1">
                              {cell.courses.map((c, i) => (
                                <div key={i} className="p-1 rounded text-left text-white leading-tight">
                                  <div className="flex items-center justify-between font-bold text-[11px]">
                                    <span>{c.courseCode}</span>
                                    <span className="text-[9px] bg-white/25 px-1 rounded">{c.slotCode}</span>
                                  </div>
                                  <div className="text-[9px] font-semibold truncate mt-0.5" title={c.courseName}>
                                    {c.courseName}
                                  </div>
                                  <div className="text-[9px] font-mono opacity-90 mt-0.5">{c.venue}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className={defaultLabel === 'Extramural' ? 'font-bold text-red-600 text-xs' : 'text-xs text-stone-700 font-medium'}>
                              {defaultLabel}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Dedicated LUNCH Separator Cell (Guaranteed COMPLETELY FREE of any course) */}
                    <td className="p-1 border border-slate-400 text-center font-bold bg-[#B0BEC5] text-slate-800 text-[10px] leading-tight select-none">
                      L<br/>U<br/>N<br/>C<br/>H
                    </td>

                    {/* Afternoon Periods 6 to 11 */}
                    {[6, 7, 8, 9, 10, 11].map((pIdx) => {
                      const cellKey = `${day}_${pIdx}`;
                      const cell = gridMap.get(cellKey);
                      const defaultLabel = defaultLabels[pIdx];

                      return (
                        <td
                          key={pIdx}
                          className={`p-2 border border-slate-400 text-center align-middle transition-colors relative ${
                            cell && cell.courses.length > 0
                              ? cell.hasClash
                                ? 'bg-amber-100 border-2 border-amber-500'
                                : cell.courses[0].courseType === 'lab'
                                ? 'bg-[#370617] text-white shadow-xs'
                                : 'bg-[#9D0208] text-white shadow-xs'
                              : 'bg-amber-50/70 text-[#03071E] font-semibold'
                          }`}
                        >
                          {cell && cell.courses.length > 0 ? (
                            <div className="space-y-1">
                              {cell.courses.map((c, i) => (
                                <div key={i} className="p-1 rounded text-left text-white leading-tight">
                                  <div className="flex items-center justify-between font-bold text-[11px]">
                                    <span>{c.courseCode}</span>
                                    <span className="text-[9px] bg-white/25 px-1 rounded">{c.slotCode}</span>
                                  </div>
                                  <div className="text-[9px] font-semibold truncate mt-0.5" title={c.courseName}>
                                    {c.courseName}
                                  </div>
                                  <div className="text-[9px] font-mono opacity-90 mt-0.5">{c.venue}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className={defaultLabel === 'Extramural' ? 'font-bold text-red-600 text-xs' : 'text-xs text-stone-700 font-medium'}>
                              {defaultLabel}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Import Modal for VTOP Copy-Pasted Text */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import VTOP Course Registration Slip">
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[#03071E] leading-relaxed">
            <p className="font-bold mb-1 flex items-center gap-1.5 text-sm text-[#9D0208]">
              <Sparkles className="w-4.5 h-4.5 text-[#9D0208]" />
              <span>Paste Raw VTOP Registration Slip</span>
            </p>
            <p className="text-xs text-stone-700">
              Copy and paste your course list directly from VTOP. The parser will automatically extract active courses, split <code>+</code> slot codes (e.g. <code>C2+TC2+TCC2</code>), group lab blocks (e.g. <code>L19+L20</code>), ignore NIL courses, enforce Wednesday Extramural hours, and map them to the timetable.
            </p>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Registration Data Text</label>
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208]"
              placeholder="Paste VTOP course list here..."
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-slate-500 text-xs">
              Detected Active Courses: <strong className="text-slate-800">{parseVitCourseRegistrationText(rawText).length}</strong>
            </span>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsImportModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" icon={<CheckCircle2 className="w-4 h-4" />}>
                Construct Timetable
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
