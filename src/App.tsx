import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SURVEY_ITEMS, SURVEY_ANSWERS, SURVEY_CATEGORIES, SurveyItem } from "./data/items";
import { 
  ClipboardCheck, 
  Copy, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  BookOpen, 
  Check, 
  Loader2, 
  BarChart3, 
  Lock,
  Compass,
  Building,
  Sparkles,
  RefreshCw
} from "lucide-react";

// Standard Fisher-Yates shuffle to randomize questions safely
function shuffleItems(items: SurveyItem[]): SurveyItem[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [step, setStep] = useState<"CODE_ENTRY" | "SURVEY" | "SUBMITTING" | "SUCCESS">("CODE_ENTRY");
  const [code, setCode] = useState<string>("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [randomizedItems, setRandomizedItems] = useState<SurveyItem[]>([]);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [highlightUnanswered, setHighlightUnanswered] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Submission response data
  const [submissionResult, setSubmissionResult] = useState<{
    sent: boolean;
    recipient: string;
    scores: Record<string, number>;
    timestamp: string;
    draft?: {
      subject: string;
      text: string;
      html: string;
    };
  } | null>(null);

  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);

  // Initialize random item sequence on start click
  const handleStartSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setCodeError("Bitte geben Sie einen gültigen Teilnahme-Code ein.");
      return;
    }
    if (cleanCode.length < 3) {
      setCodeError("Der Teilnahme-Code muss mindestens 3 Zeichen lang sein.");
      return;
    }
    setCodeError(null);
    
    // Seed and randomize
    const queue = shuffleItems(SURVEY_ITEMS);
    setRandomizedItems(queue);
    
    // Reset responses
    setRatings({});
    setHighlightUnanswered(false);
    setApiError(null);
    setStep("SURVEY");
  };

  // Check unanswered items count
  const unansweredCount = useMemo(() => {
    return SURVEY_ITEMS.length - Object.keys(ratings).length;
  }, [ratings]);

  const completionPercentage = useMemo(() => {
    return Math.round((Object.keys(ratings).length / SURVEY_ITEMS.length) * 100);
  }, [ratings]);

  // Handle choice selection for an item
  const handleSelectRating = (itemId: number, val: number) => {
    setRatings(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  // Submit to the Express backend API
  const handleSubmitSurvey = async () => {
    if (unansweredCount > 0) {
      setHighlightUnanswered(true);
      // Scroll to first unanswered item
      const firstUnanswered = randomizedItems.find(item => ratings[item.id] === undefined);
      if (firstUnanswered) {
        document.getElementById(`item-card-${firstUnanswered.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
      return;
    }

    setStep("SUBMITTING");
    setApiError(null);

    // Format payload
    const payload = {
      code: code.trim().toUpperCase(),
      responses: Object.entries(ratings).map(([idStr, val]) => ({
        itemId: parseInt(idStr),
        value: val
      }))
    };

    try {
      const response = await fetch("/api/submit-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Unerwarteter Fehler bei der Übermittlung.");
      }

      const responseData = await response.json();
      setSubmissionResult(responseData);
      setStep("SUCCESS");
    } catch (err: any) {
      console.error(err);
      setApiError(err?.message || "Verbindung zum Server fehlgeschlagen. Bitte prüfen Sie Ihre Verbindung.");
      setStep("SURVEY");
    }
  };

  // Copy email body helper (Fallback sandbox mode)
  const handleCopyEmailBody = () => {
    if (submissionResult?.draft?.text) {
      navigator.clipboard.writeText(submissionResult.draft.text).then(() => {
        setCopiedDraft(true);
        setTimeout(() => setCopiedDraft(false), 3000);
      });
    }
  };

  // Helper to map category to icons and descriptive labels
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Selbstgesteuert":
        return <GraduationCap className="h-5 w-5 text-indigo-600" />;
      case "Produktiv":
        return <BookOpen className="h-5 w-5 text-emerald-600" />;
      case "Aktivierend":
        return <Sparkles className="h-5 w-5 text-amber-600" />;
      case "Situativ":
        return <Compass className="h-5 w-5 text-blue-600" />;
      case "Sozial":
        return <Building className="h-5 w-5 text-rose-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div id="survey-app-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* 1. Header with exclusive SVG Logo, minimal code display on right */}
      <header id="main-header" className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 shadow-xs shrink-0 sticky top-0 z-40">
        <div className="flex items-center">
          <svg id="Ebene_1" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto select-none" viewBox="0 0 2000 2229.3">
            <path fill="#0a4a6e" d="M1789.9,1815.5H618.2L1925.9,442.5c72.9-74.8,94.1-184.9,54.1-281.6C1939.5,63.2,1845,0,1739.3,0H499.7c-12.8,0-37.5,0-37.5,0,44.4,56,71,130.2,71,206.9s-26.6,151-71,206.9c10.6,0,24.7,0,37.5,0h882L74,1786.9c-72.8,74.7-94.1,184.9-54.1,281.6,40.4,97.7,134.9,160.9,240.8,160.9h1529.1c114.2,0,206.9-92.7,206.9-206.9s-92.7-206.9-206.9-206.9Z"/>
            <path fill="#0a4a6e" d="M410.7,206.9c0,56.2-22.6,107.2-59.2,144.2-37.2,37.6-88.8,60.9-145.9,60.9C92.2,412.1.4,320.2.4,206.9S92.2,1.8,205.6,1.8s108.7,23.3,145.8,61c36.7,37,59.3,87.9,59.3,144.1Z"/>
          </svg>
        </div>
        
        <div className="flex items-center space-x-6">
          {code && (
            <span className="font-mono text-sm font-bold text-brand bg-brand-light px-3 py-1 border border-brand/20 rounded-lg uppercase">
              #{code.toUpperCase()}
            </span>
          )}
        </div>
      </header>

      {/* 2. Simple Sticky Progress Bar under Header */}
      <div className="w-full h-1.5 bg-slate-100 shrink-0 sticky top-20 z-40">
        <div 
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${step === "CODE_ENTRY" ? 0 : completionPercentage}%` }}
        ></div>
      </div>

      {/* 3. Main Center Frame without Sidebar */}
      <div className="flex-1 flex flex-col">
        
        {/* Central interactive stage */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 flex flex-col justify-start">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CODE ENTRY */}
            {step === "CODE_ENTRY" && (
              <motion.div
                key="code-entry-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-2xl w-full mx-auto my-auto py-8"
              >
                <div id="welcome-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10">
                  
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center bg-brand-light text-brand rounded-2xl p-4 mb-5 border border-brand/10">
                      <Lock className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Selbsteinschätzung</h2>
                    <p className="text-brand font-semibold text-sm sm:text-base mt-2 uppercase tracking-wide">
                      Lernen möglich machen
                    </p>
                    
                    <div className="text-left space-y-4 text-slate-600 text-xs sm:text-sm mt-6 leading-relaxed">
                      <p>
                        Die folgende Selbsteinschätzung ist die Grundlage für unsere weitere Arbeit im Rahmen des Workshops «Lernen möglich machen».
                      </p>
                      <p>
                        Diese Selbsteinschätzung kennt keine richtigen und falschen Antworten. Sie dient dazu, Ihre individuellen Ressourcen- und Entwicklungsfelder in den Bereichen Teilnehmerautonomie, selbstorganisiertes Lernen und selbstgesteuertes Lernen sichtbar zu machen.
                        Bitte bewerten Sie die folgenden 23 Aussagen mit einer Auswahl von «trifft überhaupt nicht zu» bis «trifft vollständig zu». Bewerten Sie die Aussagen so, wie Sie sie verstehen.
                      </p>
                      <p>
                        Ihre individuellen Ergebnisse werden für Ihre Kolleginnen und Kollegen nicht publiziert und haben keinerlei qualifizierenden Charakter. Die Angabe des Codes dient lediglich dazu, Ihnen nach der Umfrage Ihre individuelle Auswertung zugänglich zu machen.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleStartSurvey} className="space-y-4 max-w-sm mx-auto">
                    <div>
                      <label htmlFor="participation-code" className="block text-xs font-bold text-slate-500 mb-2.5 text-center">
                        Bitte geben Sie Ihren Teilnahme-Code ein
                      </label>
                      <div className="relative">
                        <input
                          id="participation-code"
                          type="text"
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value);
                            if (codeError) setCodeError(null);
                          }}
                          className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-center font-mono text-lg uppercase tracking-widest text-slate-900 focus:bg-white focus:ring-4 focus:ring-brand-light focus:border-brand transition-all outline-hidden block font-bold"
                          autoFocus
                        />
                      </div>
                      {codeError && (
                        <p id="code-error-msg" className="text-xs text-red-600 mt-2.5 flex items-center justify-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {codeError}
                        </p>
                      )}
                    </div>

                    <button
                      id="btn-start-survey"
                      type="submit"
                      className="w-full bg-brand hover:bg-brand-hover active:scale-[0.98] transition-all text-white font-semibold py-3.5 px-4 rounded-xl shadow-md shadow-brand/10 flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      Starten
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-1 text-[11px] text-slate-400 text-center">
                    <span>Zustellung an: <strong>allenspach@zweitsprache.ch</strong></span>
                    <span>Anonyme & vertrauliche Datenübermittlung</span>
                  </div>

                </div>
              </motion.div>
            )}

            {/* STEP 2: SURVEY FORM */}
            {step === "SURVEY" && (
              <motion.div
                key="survey-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-3xl w-full mx-auto"
              >
                {/* Floating summary bar for quick status feedback */}
                {highlightUnanswered && unansweredCount > 0 && (
                  <div id="unanswered-warning" className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 animate-bounce">
                    <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    <span>Sie haben noch {unansweredCount} unbeantwortete Frage{unansweredCount > 1 ? "n" : ""}. Bitte bewerten Sie jedes Item vor dem Absenden.</span>
                  </div>
                )}

                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* Randomized items container */}
                <div className="space-y-6">
                  {randomizedItems.map((item, index) => {
                    const currentResponse = ratings[item.id];
                    const isAnswered = currentResponse !== undefined;
                    const isHighlighting = highlightUnanswered && !isAnswered;

                    return (
                      <div
                        key={item.id}
                        id={`item-card-${item.id}`}
                        className={`bg-white border rounded-2xl p-6 md:p-8 transition-all shadow-xs ${
                          isAnswered 
                            ? "border-slate-200 ring-4 ring-blue-50/50 bg-white" 
                            : isHighlighting
                              ? "border-red-300 bg-red-50/10 ring-4 ring-red-100" 
                              : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              {index + 1} von {SURVEY_ITEMS.length}
                            </span>
                          </div>
                          
                          {isAnswered && (
                            <span className="text-xs text-brand font-semibold flex items-center gap-1 bg-brand-light px-2.5 py-0.5 rounded-full">
                              <Check className="h-3.5 w-3.5" /> Ausgefüllt
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl md:text-2xl font-medium text-slate-900 leading-snug">
                          {item.text}
                        </h3>

                        {/* Scale Options using the Professional Polish design style */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {SURVEY_ANSWERS.map((ans) => {
                            const isSelected = currentResponse === ans.value;
                            return (
                              <button
                                key={ans.value}
                                id={`item-${item.id}-ans-${ans.value}`}
                                onClick={() => handleSelectRating(item.id, ans.value)}
                                className={`flex items-center justify-center text-center w-full p-4 border-2 rounded-xl transition-all group cursor-pointer ${
                                  isSelected
                                    ? "border-brand bg-brand-light/60 shadow-md ring-4 ring-brand/10"
                                    : "border-slate-200 bg-white hover:border-brand/40 hover:bg-slate-50/50"
                                }`}
                              >
                                <span className={`text-sm tracking-tight ${
                                  isSelected ? "font-bold text-brand" : "font-medium text-slate-700"
                                }`}>
                                  {ans.text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom submit action strip */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex justify-center w-full">
                  <button
                    id="btn-submit-survey-bottom"
                    onClick={handleSubmitSurvey}
                    disabled={unansweredCount > 0}
                    className={`w-full py-4 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all ${
                      unansweredCount > 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-brand text-white hover:bg-brand-hover shadow-md hover:shadow active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    Selbsteinschätzung abschliessen
                  </button>
                </div>

              </motion.div>
            )}

            {/* STEP 3: SUBMITTING LOADING STATE */}
            {step === "SUBMITTING" && (
              <motion.div
                key="submitting-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-md w-full mx-auto text-center py-12"
              >
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center">
                  <Loader2 className="h-10 w-10 text-brand animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Auswertung läuft...</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Ihre Daten werden nach Kategorien gewichtet, strukturiert und per E-Mail an <strong>allenspach@zweitsprache.ch</strong> zugestellt. Bitte schliessen Sie das Fenster nicht.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS & DETAILED REPORT */}
            {step === "SUCCESS" && submissionResult && (
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-2xl mx-auto py-4"
              >
                <div id="success-header-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-brand"></div>
                  
                  <div className="inline-flex items-center justify-center bg-brand-light text-brand rounded-full p-4 mb-4 border border-brand/20 shadow-xs">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Vielen Dank für Ihre Teilnahme!</h2>
                  <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                    Ihre Selbstevaluation zur DaZ-Gesamtkompetenz wurde registriert. Die detaillierten Resultate wurden verarbeitet.
                  </p>

                  {submissionResult.sent ? (
                    <div className="mt-5 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-full font-semibold">
                      <Check className="h-4 w-4 text-emerald-600" />
                      E-Mail erfolgreich zugestellt an {submissionResult.recipient}
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-brand-light border border-brand/20 text-brand text-xs px-4 py-2.5 rounded-full font-semibold">
                        <Sparkles className="h-4 w-4 text-brand" />
                        Ergebnisse lokal protokolliert und gesichert!
                      </span>
                      <p className="text-[10px] text-slate-400 max-w-sm mt-1">
                        (Weil der SMTP-E-Mail-Server in der Testumgebung nicht hinterlegt ist, kopieren Sie den Entwurf unten, um ihn direkt zuzustellen.)
                      </p>
                    </div>
                  )}
                </div>

                {/* Scoring Dashboard */}
                <div id="score-dashboard" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-slate-950 border-b border-slate-100 pb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-brand" />
                    Auswertung pro Kompetenzkategorie
                  </h3>

                  <div className="mt-6 space-y-6">
                    {Object.entries(SURVEY_CATEGORIES).map(([catName, info]) => {
                      const score = submissionResult.scores[catName] || 0;
                      const percent = Math.round((score / info.maxPoints) * 100);

                      // Professional colors matching value metrics
                      let barColorClass = "bg-brand";
                      let textColorClass = "text-brand";
                      if (percent < 33) {
                        barColorClass = "bg-rose-500";
                        textColorClass = "text-rose-600";
                      } else if (percent < 66) {
                        barColorClass = "bg-amber-500";
                        textColorClass = "text-amber-600";
                      } else {
                        barColorClass = "bg-emerald-500";
                        textColorClass = "text-emerald-600";
                      }

                      return (
                        <div key={catName} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(catName)}
                              <span className="font-semibold text-slate-800 text-xs sm:text-sm">{catName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded font-mono font-bold text-slate-600">
                                {score} / {info.maxPoints} pts
                              </span>
                              <span className={`text-sm font-black font-semibold ${textColorClass}`}>{percent}%</span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-3 rounded-full ${barColorClass}`}
                            ></motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Draft copy helper */}
                {submissionResult.draft && (
                  <div id="email-draft-visualizer" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">E-Mail-Entwurf für die Fachstelle</h3>
                        <p className="text-[11px] text-slate-500">Falls Sie die E-Mail manuell versenden möchten.</p>
                      </div>
                      
                      <button
                        id="btn-copy-draft"
                        onClick={handleCopyEmailBody}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          copiedDraft 
                            ? "bg-slate-950 text-white" 
                            : "bg-brand text-white hover:bg-brand-hover shadow-xs"
                        }`}
                      >
                        {copiedDraft ? (
                          <>
                            <ClipboardCheck className="h-4 w-4" /> Kopiert!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" /> Text kopieren
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Empfänger</span>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 font-mono text-xs text-slate-800">
                          {submissionResult.recipient}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Betreff</span>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3 font-mono text-xs text-slate-800">
                          {submissionResult.draft.subject}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">E-Mail-Inhalt</span>
                        <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 overflow-x-auto max-h-60 leading-relaxed">
                          {submissionResult.draft.text}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Back Link */}
                <div className="text-center pt-2">
                  <button
                    id="btn-restart-app"
                    onClick={() => {
                      setStep("CODE_ENTRY");
                      setCode("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover transition-colors uppercase tracking-widest cursor-pointer bg-transparent border-none outline-hidden"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Neue Analyse starten
                  </button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </main>
      </div>

      {/* 4. Footer with Copyright */}
      <footer id="main-footer" className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-400 mt-auto shrink-0 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Zweitsprache Kompetenz-Umfrage | Schulleitungs-Portal.</p>
          <p className="font-medium text-slate-500">Zustellung an allenspach@zweitsprache.ch</p>
        </div>
      </footer>

    </div>
  );
}
