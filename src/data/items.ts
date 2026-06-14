export interface SurveyItem {
  id: number;
  text: string;
  category: string;
}

export const SURVEY_CATEGORIES = {
  "Selbstgesteuert": {
    code: "SG",
    maxPoints: 15 // 5 items * 3 max points
  },
  "Produktiv": {
    code: "PR",
    maxPoints: 12 // 4 items * 3 max points
  },
  "Aktivierend": {
    code: "AK",
    maxPoints: 12 // 4 items * 3 max points
  },
  "Situativ": {
    code: "SI",
    maxPoints: 15 // 5 items * 3 max points
  },
  "Sozial": {
    code: "SO",
    maxPoints: 15 // 5 items * 3 max points
  }
};

export const SURVEY_ITEMS: SurveyItem[] = [
  // 1. Selbstgesteuert (5 items)
  {
    id: 1,
    text: "In meinem Kurs haben Lernende die Möglichkeit, Wissen und Lernwege selbst zu bestimmen.",
    category: "Selbstgesteuert"
  },
  {
    id: 2,
    text: "In meinem Kurs überprüfen Lernende ihre Lernergebnisse selbst.",
    category: "Selbstgesteuert"
  },
  {
    id: 3,
    text: "In meinem Kurs gestalten Lernende Ziele, Prozesse und Lernbedingungen mit.",
    category: "Selbstgesteuert"
  },
  {
    id: 4,
    text: "In meinem Kurs werden Lernende darin unterstützt, die Verantwortung für ihr Lernen selbst zu übernehmen.",
    category: "Selbstgesteuert"
  },
  {
    id: 5,
    text: "In meinem Kurs bin ich als Lehrende/Lehrender prozessverantwortlich und schaffe die Bedingungen für das gelingende Selbstlernen der Lernenden.",
    category: "Selbstgesteuert"
  },

  // 2. Produktiv (4 items)
  {
    id: 6,
    text: "In meinem Kurs werden Vorerfahrung und Vorwissen der Lernenden eingebunden.",
    category: "Produktiv"
  },
  {
    id: 7,
    text: "In meinem Kurs wird Lernenden Raum für Neugier und Entdeckungen geboten (Entdeckungsarbeit).",
    category: "Produktiv"
  },
  {
    id: 8,
    text: "In meinem Kurs nehmen Lernende unterschiedliche Perspektiven ein.",
    category: "Produktiv"
  },
  {
    id: 9,
    text: "In meinem Kurs erhalten Lernende die Möglichkeit, eigene Sichtweisen zu hinterfragen.",
    category: "Produktiv"
  },

  // 3. Aktivierend (4 items)
  {
    id: 10,
    text: "In meinem Kurs bearbeiten Lernende konkrete Arbeitsaufträge.",
    category: "Aktivierend"
  },
  {
    id: 11,
    text: "In meinem Kurs wird Lernenden ermöglicht, Lösungswege selbst zu planen, durchzuführen und zu überprüfen.",
    category: "Aktivierend"
  },
  {
    id: 12,
    text: "In meinem Kurs entwickeln Lernende selbst Initiativen.",
    category: "Aktivierend"
  },
  {
    id: 13,
    text: "In meinem Kurs wird Lernenden ermöglicht, praxis- und erlebnisorientiert zu arbeiten.",
    category: "Aktivierend"
  },

  // 4. Situativ (5 items)
  {
    id: 14,
    text: "In meinem Kurs nutzen und reflektieren Lernende die Hier-und-jetzt-Situation.",
    category: "Situativ"
  },
  {
    id: 15,
    text: "In meinem Kurs nimmt die Methode Bezug auf die Situation der Lerngruppe und ist auf die Situation der Lernenden und der Lerngruppe abgestimmt.",
    category: "Situativ"
  },
  {
    id: 16,
    text: "In meinem Kurs erarbeiten Lernende Lösungen anhand von Praxisbeispielen.",
    category: "Situativ"
  },
  {
    id: 17,
    text: "In meinem Kurs übertragen Lernende Musterlösungen in die eigene Praxis.",
    category: "Situativ"
  },
  {
    id: 18,
    text: "In meinem Kurs werden Lernenden Empfehlungen für den Praxistransfer geboten.",
    category: "Situativ"
  },

  // 5. Sozial (5 items)
  {
    id: 19,
    text: "In meinem Kurs erleben Lernende Wertschätzung.",
    category: "Sozial"
  },
  {
    id: 20,
    text: "In meinem Kurs erhalten Lernende Zeit und Raum für ihre Fragen und Feedback.",
    category: "Sozial"
  },
  {
    id: 21,
    text: "In meinem Kurs nehme ich Emotionen wahr.",
    category: "Sozial"
  },
  {
    id: 22,
    text: "In meinem Kurs üben Lernende konstruktive Formen der Kommunikation.",
    category: "Sozial"
  },
  {
    id: 23,
    text: "In meinem Kurs werden Lernende bei der kooperativen Erarbeitung von Lösungen gefördert.",
    category: "Sozial"
  }
];

export const SURVEY_ANSWERS = [
  { value: 0, text: "trifft überhaupt nicht zu" },
  { value: 1, text: "trifft eher nicht zu" },
  { value: 2, text: "trifft eher zu" },
  { value: 3, text: "trifft vollständig zu" }
];
