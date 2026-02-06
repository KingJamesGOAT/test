// Fichier: src/lib/data/timelineData.ts

export interface LocalizedString {
  en: string;
  fr: string;
  es: string;
  de: string;
}

export interface TimelineEvent {
  year: number;
  name: LocalizedString;
  description: LocalizedString;
  details?: LocalizedString;
  type?: 'council' | 'saint' | 'pope';
}

// --- 1. CONCILES ---
export const COUNCILS: TimelineEvent[] = [
  {
    year: 325,
    name: { en: "Council of Nicaea I", fr: "Concile de Nicée I", es: "Concilio de Nicea I", de: "Konzil von Nicäa I" },
    description: {
      en: "Defined the divinity of Christ against Arianism.",
      fr: "A défini la divinité du Christ contre l'arianisme.",
      es: "Definió la divinidad de Cristo contra el arrianismo.",
      de: "Definierte die Gottheit Christi gegen den Arianismus."
    },
    type: 'council'
  },
  {
    year: 1545,
    name: { en: "Council of Trent", fr: "Concile de Trente", es: "Concilio de Trento", de: "Konzil von Trient" },
    description: {
      en: "Response to the Protestant Reformation.",
      fr: "Réponse à la Réforme protestante.",
      es: "Respuesta a la Reforma Protestante.",
      de: "Antwort auf die protestantische Reformation."
    },
    type: 'council'
  },
  {
    year: 1962,
    name: { en: "Vatican Council II", fr: "Concile Vatican II", es: "Concilio Vaticano II", de: "Zweites Vatikanisches Konzil" },
    description: {
      en: "Addressed the Church in the modern world.",
      fr: "A abordé l'Église dans le monde moderne.",
      es: "Abordó la Iglesia en el mundo moderno.",
      de: "Befasste sich mit der Kirche in der modernen Welt."
    },
    type: 'council'
  }
];

// --- 2. SAINTS ---
export const SAINTS: TimelineEvent[] = [
  {
    year: 67,
    name: { en: "St. Paul", fr: "Saint Paul", es: "San Pablo", de: "Hl. Paulus" },
    description: {
      en: "Apostle to the Gentiles.",
      fr: "Apôtre des Gentils.",
      es: "Apóstol de los gentiles.",
      de: "Apostel der Heiden."
    },
    type: 'saint'
  },
  {
    year: 1226,
    name: { en: "St. Francis of Assisi", fr: "Saint François d'Assise", es: "San Francisco de Asís", de: "Hl. Franz von Assisi" },
    description: {
      en: "Founder of the Franciscan Order.",
      fr: "Fondateur de l'Ordre franciscain.",
      es: "Fundador de la Orden Franciscana.",
      de: "Gründer des Franziskanerordens."
    },
    type: 'saint'
  }
];

// --- 3. PAPES ---
export const POPES: TimelineEvent[] = [
  {
    year: 30,
    name: { en: "St. Peter", fr: "Saint Pierre", es: "San Pedro", de: "Hl. Petrus" },
    description: {
      en: "The first Pope.",
      fr: "Le premier pape.",
      es: "El primer Papa.",
      de: "Der erste Papst."
    },
    type: 'pope'
  },
  {
    year: 1978,
    name: { en: "St. John Paul II", fr: "Saint Jean-Paul II", es: "San Juan Pablo II", de: "Hl. Johannes Paul II." },
    description: {
      en: "Key figure in ending communism.",
      fr: "Figure clé de la fin du communisme.",
      es: "Figura clave en el fin del comunismo.",
      de: "Schlüsselfigur beim Ende des Kommunismus."
    },
    type: 'pope'
  }
];