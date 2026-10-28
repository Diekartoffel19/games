// Französische Verben-Datenbank mit deutscher Übersetzung und Konjugationen
const VERBS_DATABASE = [
  // --- VERBES EN -ER ---
  {
    infinitive: "parler",
    german: "sprechen",
    group: "-er",
    type: "regular",
    present: { je: "parle", tu: "parles", il: "parle", nous: "parlons", vous: "parlez", ils: "parlent" },
    sample: "Je parle français avec mes amis.",
    sampleDe: "Ich spreche Französisch mit meinen Freunden.",
    notes: "Regelmässiges -er Verb. Endungen: -e, -es, -e, -ons, -ez, -ent (stumm außer -ons, -ez)."
  },
  {
    infinitive: "habiter",
    german: "wohnen",
    group: "-er",
    type: "regular",
    present: { je: "habite", tu: "habites", il: "habite", nous: "habitons", vous: "habitez", ils: "habitent" },
    sample: "J'habite à Paris.",
    sampleDe: "Ich wohne in Paris.",
    notes: "Stummes 'h': Apostroph bei 'je' -> j'habite. Liaison bei nous habitons [z]."
  },
  {
    infinitive: "aimer",
    german: "lieben / mögen",
    group: "-er",
    type: "regular",
    present: { je: "aime", tu: "aimes", il: "aime", nous: "aimons", vous: "aimez", ils: "aiment" },
    sample: "J'aime la musique et les voyages.",
    sampleDe: "Ich liebe Musik und Reisen.",
    notes: "Beginnt mit Vokal: j'aime, n'aime pas."
  },
  {
    infinitive: "écouter",
    german: "hören / zuhören",
    group: "-er",
    type: "regular",
    present: { je: "écoute", tu: "écoutes", il: "écoute", nous: "écoutons", vous: "écoutez", ils: "écoutent" },
    sample: "Nous écoutons le professeur.",
    sampleDe: "Wir hören dem Lehrer zu.",
    notes: "Beginnt mit Vokal: j'écoute."
  },
  {
    infinitive: "travailler",
    german: "arbeiten",
    group: "-er",
    type: "regular",
    present: { je: "travaille", tu: "travailles", il: "travaille", nous: "travaillons", vous: "travaillez", ils: "travaillent" },
    sample: "Ils travaillent à la maison.",
    sampleDe: "Sie arbeiten zu Hause.",
    notes: "Regelmässig. Aussprache: -ille wie kurzes 'j'."
  },
  {
    infinitive: "regarder",
    german: "anschauen / ansehen",
    group: "-er",
    type: "regular",
    present: { je: "regarde", tu: "regardes", il: "regarde", nous: "regardons", vous: "regardez", ils: "regardent" },
    sample: "Tu regardes un bon film.",
    sampleDe: "Du schaust einen guten Film an.",
    notes: "Regelmässiges -er Verb."
  },
  {
    infinitive: "jouer",
    german: "spielen",
    group: "-er",
    type: "regular",
    present: { je: "joue", tu: "joues", il: "joue", nous: "jouons", vous: "jouez", ils: "jouent" },
    sample: "Nous jouons au football.",
    sampleDe: "Wir spielen Fussball.",
    notes: "jouer à (Sport/Spiel), jouer de (Musikinstrument)."
  },
  {
    infinitive: "chercher",
    german: "suchen",
    group: "-er",
    type: "regular",
    present: { je: "cherche", tu: "cherches", il: "cherche", nous: "cherchons", vous: "cherchez", ils: "cherchent" },
    sample: "Je cherche mes clés.",
    sampleDe: "Ich suche meine Schlüssel.",
    notes: "Direktes Objekt: chercher qc (ohne 'nach'!)."
  },
  {
    infinitive: "trouver",
    german: "finden",
    group: "-er",
    type: "regular",
    present: { je: "trouve", tu: "trouves", il: "trouve", nous: "trouvons", vous: "trouvez", ils: "trouvent" },
    sample: "Vous trouvez la solution.",
    sampleDe: "Ihr findet die Lösung.",
    notes: "Regelmässiges -er Verb."
  },
  {
    infinitive: "donner",
    german: "geben",
    group: "-er",
    type: "regular",
    present: { je: "donne", tu: "donnes", il: "donne", nous: "donnons", vous: "donnez", ils: "donnent" },
    sample: "Elle donne un cadeau à son ami.",
    sampleDe: "Sie gibt ihrem Freund ein Geschenk.",
    notes: "Regelmässiges -er Verb."
  },
  {
    infinitive: "manger",
    german: "essen",
    group: "-er",
    type: "spelling-change",
    present: { je: "mange", tu: "manges", il: "mange", nous: "mangeons", vous: "mangez", ils: "mangent" },
    sample: "Nous mangeons une pizza.",
    sampleDe: "Wir essen eine Pizza.",
    notes: "Achtung bei nous: 'mangeons' mit stummem 'e', damit das 'g' weich ausgesprochen wird."
  },
  {
    infinitive: "commencer",
    german: "anfangen / beginnen",
    group: "-er",
    type: "spelling-change",
    present: { je: "commence", tu: "commences", il: "commence", nous: "commençons", vous: "commencez", ils: "commencent" },
    sample: "Nous commençons le travail à 8h.",
    sampleDe: "Wir beginnen die Arbeit um 8 Uhr.",
    notes: "Achtung bei nous: 'commençons' mit Çedille (ç), damit das 'c' weich [s] bleibt."
  },
  {
    infinitive: "acheter",
    german: "kaufen",
    group: "-er",
    type: "spelling-change",
    present: { je: "achète", tu: "achètes", il: "achète", nous: "achetons", vous: "achetez", ils: "achètent" },
    sample: "J'achète du pain.",
    sampleDe: "Ich kaufe Brot.",
    notes: "Stammwechsel zu è vor stummer Endung (je/tu/il/ils achètent, aber nous achetons)."
  },
  {
    infinitive: "appeler",
    german: "rufen / heißen",
    group: "-er",
    type: "spelling-change",
    present: { je: "appelle", tu: "appelles", il: "appelle", nous: "appelons", vous: "appelez", ils: "appellent" },
    sample: "Comment tu t'appelles ?",
    sampleDe: "Wie heisst du?",
    notes: "Doppel-l vor stummer Endung: j'appelle, ils appellent, aber nous appelons."
  },
  {
    infinitive: "aller",
    german: "gehen / fahren",
    group: "-er",
    type: "irregular",
    present: { je: "vais", tu: "vas", il: "va", nous: "allons", vous: "allez", ils: "vont" },
    sample: "Je vais à l'école tous les jours.",
    sampleDe: "Ich gehe jeden Tag zur Schule.",
    notes: "SEHR UNREGELMÄSSIG! Wichtigstes Hilfsverb für das Futur proche (aller + Infinitiv)!"
  },

  // --- VERBES EN -IR ---
  {
    infinitive: "finir",
    german: "beenden / fertig machen",
    group: "-ir",
    type: "regular-iss",
    present: { je: "finis", tu: "finis", il: "finit", nous: "finissons", vous: "finissez", ils: "finissent" },
    sample: "Tu finis tes devoirs à l'heure.",
    sampleDe: "Du machst deine Hausaufgaben rechtzeitig fertig.",
    notes: "Typ 1 (Stammerweiterung -iss- im Plural): Endungen: -is, -is, -it, -issons, -issez, -issent."
  },
  {
    infinitive: "choisir",
    german: "auswählen / wählen",
    group: "-ir",
    type: "regular-iss",
    present: { je: "choisis", tu: "choisis", il: "choisit", nous: "choisissons", vous: "choisissez", ils: "choisissent" },
    sample: "Nous choisissons le menu du jour.",
    sampleDe: "Wir wählen das Tagesmenü aus.",
    notes: "Typ 1 mit -iss-: nous choisissons, vous choisissez, ils choisissent."
  },
  {
    infinitive: "réussir",
    german: "gelingen / Erfolg haben / bestehen",
    group: "-ir",
    type: "regular-iss",
    present: { je: "réussis", tu: "réussis", il: "réussit", nous: "réussissons", vous: "réussissez", ils: "réussissent" },
    sample: "Il réussit son examen de français.",
    sampleDe: "Er besteht seine Französischprüfung.",
    notes: "Typ 1 mit -iss-: réussir à faire qc."
  },
  {
    infinitive: "réfléchir",
    german: "nachdenken / überlegen",
    group: "-ir",
    type: "regular-iss",
    present: { je: "réfléchis", tu: "réfléchis", il: "réfléchit", nous: "réfléchissons", vous: "réfléchissez", ils: "réfléchissent" },
    sample: "Je réfléchis avant de répondre.",
    sampleDe: "Ich überlege, bevor ich antworte.",
    notes: "Typ 1 mit -iss-: réfléchir à qc."
  },
  {
    infinitive: "grandir",
    german: "wachsen / groß werden",
    group: "-ir",
    type: "regular-iss",
    present: { je: "grandis", tu: "grandis", il: "grandit", nous: "grandissons", vous: "grandissez", ils: "grandissent" },
    sample: "Les enfants grandissent vite.",
    sampleDe: "Die Kinder wachsen schnell.",
    notes: "Typ 1 mit -iss-."
  },
  {
    infinitive: "remplir",
    german: "füllen / ausfüllen",
    group: "-ir",
    type: "regular-iss",
    present: { je: "remplis", tu: "remplis", il: "remplit", nous: "remplissons", vous: "remplissez", ils: "remplissent" },
    sample: "Vous remplissez le formulaire.",
    sampleDe: "Sie füllen das Formular aus.",
    notes: "Typ 1 mit -iss-."
  },
  {
    infinitive: "partir",
    german: "abfahren / weggehen",
    group: "-ir",
    type: "irregular-no-iss",
    present: { je: "pars", tu: "pars", il: "part", nous: "partons", vous: "partez", ils: "partent" },
    sample: "Le train part à dix heures.",
    sampleDe: "Der Zug fährt um zehn Uhr ab.",
    notes: "Typ 2 (ohne -iss-): Stamm im Singular verkürzt (par-), im Plural normal (part-)."
  },
  {
    infinitive: "sortir",
    german: "hinausgehen / ausgehen",
    group: "-ir",
    type: "irregular-no-iss",
    present: { je: "sors", tu: "sors", il: "sort", nous: "sortons", vous: "sortez", ils: "sortent" },
    sample: "Nous sortons ce soir.",
    sampleDe: "Wir gehen heute Abend aus.",
    notes: "Typ 2 (wie partir): je sors, tu sors, il sort, nous sortons."
  },
  {
    infinitive: "dormir",
    german: "schlafen",
    group: "-ir",
    type: "irregular-no-iss",
    present: { je: "dors", tu: "dors", il: "dort", nous: "dormons", vous: "dormez", ils: "dorment" },
    sample: "Tu dors bien la nuit ?",
    sampleDe: "Schläfst du gut in der Nacht?",
    notes: "Typ 2 (wie partir): je dors, tu dors, il dort, nous dormons."
  },
  {
    infinitive: "servir",
    german: "bedienen / servieren / dienen",
    group: "-ir",
    type: "irregular-no-iss",
    present: { je: "sers", tu: "sers", il: "sert", nous: "servons", vous: "servez", ils: "servent" },
    sample: "Le serveur sert les clients.",
    sampleDe: "Der Kellner bedient die Gäste.",
    notes: "Typ 2: je sers, nous servons."
  },
  {
    infinitive: "sentir",
    german: "fühlen / riechen",
    group: "-ir",
    type: "irregular-no-iss",
    present: { je: "sens", tu: "sens", il: "sent", nous: "sentons", vous: "sentez", ils: "sentent" },
    sample: "Cette fleur sent très bon.",
    sampleDe: "Diese Blume riecht sehr gut.",
    notes: "Typ 2: je sens, tu sens, il sent, nous sentons."
  },
  {
    infinitive: "ouvrir",
    german: "öffnen / aufmachen",
    group: "-ir",
    type: "irregular-er-endings",
    present: { je: "ouvre", tu: "ouvres", il: "ouvre", nous: "ouvrons", vous: "ouvrez", ils: "ouvrent" },
    sample: "J'ouvre la fenêtre.",
    sampleDe: "Ich öffne das Fenster.",
    notes: "Sonderfall: Konjugiert wie ein -er Verb (-e, -es, -e, -ons, -ez, -ent)!"
  },
  {
    infinitive: "offrir",
    german: "anbieten / schenken",
    group: "-ir",
    type: "irregular-er-endings",
    present: { je: "offre", tu: "offres", il: "offre", nous: "offrons", vous: "offrez", ils: "offrent" },
    sample: "Il offre un livre à sa sœur.",
    sampleDe: "Er schenkt seiner Schwester ein Buch.",
    notes: "Wie ouvrir: Endungen wie -er Verben (j'offre, tu offres...)."
  },
  {
    infinitive: "découvrir",
    german: "entdecken",
    group: "-ir",
    type: "irregular-er-endings",
    present: { je: "découvre", tu: "découvres", il: "découvre", nous: "découvrons", vous: "découvrez", ils: "découvrent" },
    sample: "Nous découvrons une nouvelle ville.",
    sampleDe: "Wir entdecken eine neue Stadt.",
    notes: "Wie ouvrir: je découvre, tu découvres..."
  },
  {
    infinitive: "venir",
    german: "kommen",
    group: "-ir",
    type: "irregular",
    present: { je: "viens", tu: "viens", il: "vient", nous: "venons", vous: "venez", ils: "viennent" },
    sample: "Tu viens avec nous au cinéma ?",
    sampleDe: "Kommst du mit uns ins Kino?",
    notes: "Unregelmässig: Stammwechsel vien- / ven- / vienn-."
  },
  {
    infinitive: "tenir",
    german: "halten / festhalten",
    group: "-ir",
    type: "irregular",
    present: { je: "tiens", tu: "tiens", il: "tient", nous: "tenons", vous: "tenez", ils: "tiennent" },
    sample: "Je tiens la porte pour toi.",
    sampleDe: "Ich halte die Tür für dich.",
    notes: "Konjugiert exakt wie venir (tien- / ten- / tienn-)."
  },

  // --- VERBES EN -RE ---
  {
    infinitive: "attendre",
    german: "warten / erwarten",
    group: "-re",
    type: "regular",
    present: { je: "attends", tu: "attends", il: "attend", nous: "attendons", vous: "attendez", ils: "attendent" },
    sample: "J'attends le bus depuis 10 minutes.",
    sampleDe: "Ich warte seit 10 Minuten auf den Bus.",
    notes: "Regelmässiges -re Verb. Endungen: -s, -s, - (keine Endung!), -ons, -ez, -ent."
  },
  {
    infinitive: "vendre",
    german: "verkaufen",
    group: "-re",
    type: "regular",
    present: { je: "vends", tu: "vends", il: "vend", nous: "vendons", vous: "vendez", ils: "vendent" },
    sample: "Il vend sa vieille voiture.",
    sampleDe: "Er verkauft sein altes Auto.",
    notes: "Regelmässiges -re Verb: je vends, il vend, nous vendons."
  },
  {
    infinitive: "entendre",
    german: "hören / verstehen",
    group: "-re",
    type: "regular",
    present: { je: "entends", tu: "entends", il: "entend", nous: "entendons", vous: "entendez", ils: "entendent" },
    sample: "J'entends de la musique dehors.",
    sampleDe: "Ich höre draussen Musik.",
    notes: "Regelmässiges -re Verb: j'entends."
  },
  {
    infinitive: "répondre",
    german: "antworten",
    group: "-re",
    type: "regular",
    present: { je: "réponds", tu: "réponds", il: "répond", nous: "répondons", vous: "répondez", ils: "répondent" },
    sample: "Tu réponds à ma question ?",
    sampleDe: "Antwortest du auf meine Frage?",
    notes: "répondre à qn/qc. Regelmässig auf -re."
  },
  {
    infinitive: "descendre",
    german: "aussteigen / hinabsteigen",
    group: "-re",
    type: "regular",
    present: { je: "descends", tu: "descends", il: "descend", nous: "descendons", vous: "descendez", ils: "descendent" },
    sample: "Nous descendons à la prochaine gare.",
    sampleDe: "Wir steigen am nächsten Bahnhof aus.",
    notes: "Regelmässiges -re Verb."
  },
  {
    infinitive: "perdre",
    german: "verlieren",
    group: "-re",
    type: "regular",
    present: { je: "perds", tu: "perds", il: "perd", nous: "perdons", vous: "perdez", ils: "perdent" },
    sample: "Ne perds pas patience !",
    sampleDe: "Verliere nicht die Geduld!",
    notes: "Regelmässiges -re Verb: je perds, il perd."
  },
  {
    infinitive: "rendre",
    german: "zurückgeben / machen (adjektivisch)",
    group: "-re",
    type: "regular",
    present: { je: "rends", tu: "rends", il: "rend", nous: "rendons", vous: "rendez", ils: "rendent" },
    sample: "Je rends le livre à la bibliothèque.",
    sampleDe: "Ich gebe das Buch in die Bibliothek zurück.",
    notes: "Regelmässiges -re Verb."
  },
  {
    infinitive: "prendre",
    german: "nehmen",
    group: "-re",
    type: "irregular",
    present: { je: "prends", tu: "prends", il: "prend", nous: "prenons", vous: "prenez", ils: "prennent" },
    sample: "Je prends un café le matin.",
    sampleDe: "Ich nehme morgens einen Kaffee.",
    notes: "Unregelmässig: Singular mit 'd', Plural nous/vous nur ein 'n' ohne d, ils mit Doppel-n (prennent)!"
  },
  {
    infinitive: "comprendre",
    german: "verstehen / begreifen",
    group: "-re",
    type: "irregular",
    present: { je: "comprends", tu: "comprends", il: "comprend", nous: "comprenons", vous: "comprenez", ils: "comprennent" },
    sample: "Vous comprenez cette règle ?",
    sampleDe: "Versteht ihr diese Regel?",
    notes: "Konjugiert wie prendre (comprenons, comprennent)."
  },
  {
    infinitive: "apprendre",
    german: "lernen / erfahren",
    group: "-re",
    type: "irregular",
    present: { je: "apprends", tu: "apprends", il: "apprend", nous: "apprenons", vous: "apprenez", ils: "apprennent" },
    sample: "J'apprends le français avec plaisir.",
    sampleDe: "Ich lerne mit Freude Französisch.",
    notes: "Konjugiert wie prendre (j'apprends, apprenons, apprennent)."
  },
  {
    infinitive: "mettre",
    german: "setzen / stellen / legen / anziehen",
    group: "-re",
    type: "irregular",
    present: { je: "mets", tu: "mets", il: "met", nous: "mettons", vous: "mettez", ils: "mettent" },
    sample: "Il met son manteau chaud.",
    sampleDe: "Er zieht seinen warmen Mantel an.",
    notes: "Singular nur ein 't' (je mets, il met), Plural zwei 't' (nous mettons)."
  },
  {
    infinitive: "promettre",
    german: "versprechen",
    group: "-re",
    type: "irregular",
    present: { je: "promets", tu: "promets", il: "promet", nous: "promettons", vous: "promettez", ils: "promettent" },
    sample: "Je promets d'être à l'heure.",
    sampleDe: "Ich verspreche, pünktlich zu sein.",
    notes: "Konjugiert wie mettre."
  },
  {
    infinitive: "faire",
    german: "machen / tun",
    group: "-re",
    type: "irregular",
    present: { je: "fais", tu: "fais", il: "fait", nous: "faisons", vous: "faites", ils: "font" },
    sample: "Nous faisons du sport ensemble.",
    sampleDe: "Wir machen zusammen Sport.",
    notes: "Besonders: vous faites (nicht faisez!), ils font (nicht faisent!)."
  },
  {
    infinitive: "dire",
    german: "sagen",
    group: "-re",
    type: "irregular",
    present: { je: "dis", tu: "dis", il: "dit", nous: "disons", vous: "dites", ils: "disent" },
    sample: "Qu'est-ce que vous dites ?",
    sampleDe: "Was sagen Sie?",
    notes: "Besonders: vous dites (nicht disez!)."
  },
  {
    infinitive: "lire",
    german: "lesen",
    group: "-re",
    type: "irregular",
    present: { je: "lis", tu: "lis", il: "lit", nous: "lisons", vous: "lisez", ils: "lisent" },
    sample: "Elle lit un roman passionnant.",
    sampleDe: "Sie liest einen spannenden Roman.",
    notes: "Stamm im Plural mit 's': lis-ons, lis-ez, lis-ent."
  },
  {
    infinitive: "écrire",
    german: "schreiben",
    group: "-re",
    type: "irregular",
    present: { je: "écris", tu: "écris", il: "écrit", nous: "écrivons", vous: "écrivez", ils: "écrivent" },
    sample: "J'écris un message à Lucas.",
    sampleDe: "Ich schreibe eine Nachricht an Lucas.",
    notes: "Stamm im Plural mit 'v': écriv-ons, écriv-ez, écriv-ent."
  },
  {
    infinitive: "boire",
    german: "trinken",
    group: "-re",
    type: "irregular",
    present: { je: "bois", tu: "bois", il: "boit", nous: "buvons", vous: "buvez", ils: "boivent" },
    sample: "Tu bois de l'eau fraîche.",
    sampleDe: "Du trinkst frisches Wasser.",
    notes: "Drei Stämme: boi- (Singular), buv- (nous/vous), boiv- (ils boivent)."
  },
  {
    infinitive: "vivre",
    german: "leben",
    group: "-re",
    type: "irregular",
    present: { je: "vis", tu: "vis", il: "vit", nous: "vivons", vous: "vivez", ils: "vivent" },
    sample: "Ils vivent en Suisse.",
    sampleDe: "Sie leben in der Schweiz.",
    notes: "Singular vi-, Plural viv-."
  },
  {
    infinitive: "connaître",
    german: "kennen",
    group: "-re",
    type: "irregular",
    present: { je: "connais", tu: "connais", il: "connaît", nous: "connaissons", vous: "connaissez", ils: "connaissent" },
    sample: "Je connais bien cette ville.",
    sampleDe: "Ich kenne diese Stadt gut.",
    notes: "Zirkumflex nur bei 'il connaît'. Plural mit Doppel-s (connaissons)."
  },

  // --- VERBES EN -OIR ---
  {
    infinitive: "avoir",
    german: "haben",
    group: "-oir",
    type: "irregular",
    present: { je: "ai", tu: "as", il: "a", nous: "avons", vous: "avez", ils: "ont" },
    sample: "J'ai quinze ans.",
    sampleDe: "Ich bin fünfzehn Jahre alt.",
    notes: "FUNDAMENTALES HILFSVERB! Völlig unregelmässig: j'ai, tu as, il a, nous avons, vous avez, ils ont."
  },
  {
    infinitive: "savoir",
    german: "wissen / können (erlernte Fähigkeit)",
    group: "-oir",
    type: "irregular",
    present: { je: "sais", tu: "sais", il: "sait", nous: "savons", vous: "savez", ils: "savent" },
    sample: "Je sais nager et faire du vélo.",
    sampleDe: "Ich kann schwimmen und Fahrrad fahren.",
    notes: "Singular sai-, Plural sav-. Bedeutet 'wissen' oder können im Sinne einer Fähigkeit."
  },
  {
    infinitive: "pouvoir",
    german: "können / dürfen (Möglichkeit/Erlaubnis)",
    group: "-oir",
    type: "irregular",
    present: { je: "peux", tu: "peux", il: "peut", nous: "pouvons", vous: "pouvez", ils: "peuvent" },
    sample: "Tu peux m'aider, s'il te plaît ?",
    sampleDe: "Kannst du mir bitte helfen?",
    notes: "Endungen im Singular -x, -x, -t! Stammwechsel: peu- / pouv- / peuv-."
  },
  {
    infinitive: "vouloir",
    german: "wollen / möchten",
    group: "-oir",
    type: "irregular",
    present: { je: "veux", tu: "veux", il: "veut", nous: "voulons", vous: "voulez", ils: "veulent" },
    sample: "Nous voulons voyager en France.",
    sampleDe: "Wir wollen nach Frankreich reisen.",
    notes: "Endungen im Singular -x, -x, -t (wie pouvoir)! Stammwechsel: veu- / voul- / veul-."
  },
  {
    infinitive: "devoir",
    german: "müssen / sollen",
    group: "-oir",
    type: "irregular",
    present: { je: "dois", tu: "dois", il: "doit", nous: "devons", vous: "devez", ils: "doivent" },
    sample: "Je dois faire mes devoirs maintenant.",
    sampleDe: "Ich muss jetzt meine Hausaufgaben machen.",
    notes: "Stammwechsel: doi- / dev- / doiv-. Endungen: -s, -s, -t, -ons, -ez, -ent."
  },
  {
    infinitive: "voir",
    german: "sehen",
    group: "-oir",
    type: "irregular",
    present: { je: "vois", tu: "vois", il: "voit", nous: "voyons", vous: "voyez", ils: "voient" },
    sample: "Je vois la tour Eiffel au loin.",
    sampleDe: "Ich sehe den Eiffelturm in der Ferne.",
    notes: "Singular voi-, Plural mit 'y' (voyons, voyez), 3. Plural wieder voi- (voient)."
  },
  {
    infinitive: "recevoir",
    german: "bekommen / erhalten / empfangen",
    group: "-oir",
    type: "irregular",
    present: { je: "reçois", tu: "reçois", il: "reçoit", nous: "recevons", vous: "recevez", ils: "reçoivent" },
    sample: "Elle reçoit une lettre de son ami.",
    sampleDe: "Sie erhält einen Brief von ihrem Freund.",
    notes: "Çedille vor o (reçois, reçoit, reçoivent)! nous recevons (normales c vor e)."
  },
  {
    infinitive: "apercevoir",
    german: "bemerken / erblicken",
    group: "-oir",
    type: "irregular",
    present: { je: "aperçois", tu: "aperçois", il: "aperçoit", nous: "apercevons", vous: "apercevez", ils: "aperçoivent" },
    sample: "J'aperçois le sommet de la montagne.",
    sampleDe: "Ich erblicke den Gipfel des Berges.",
    notes: "Konjugiert wie recevoir (mit Çedille vor o)."
  },
  {
    infinitive: "falloir",
    german: "müssen / nötig sein / brauchen",
    group: "-oir",
    type: "impersonal",
    present: { je: "-", tu: "-", il: "faut", nous: "-", vous: "-", ils: "-" },
    sample: "Il faut apprendre la grammaire.",
    sampleDe: "Man muss die Grammatik lernen.",
    notes: "Unpersönliches Verb: existiert nur in der 3. Person Singular ('il faut')!"
  },
  {
    infinitive: "pleuvoir",
    german: "regnen",
    group: "-oir",
    type: "impersonal",
    present: { je: "-", tu: "-", il: "pleut", nous: "-", vous: "-", ils: "-" },
    sample: "Il pleut aujourd'hui.",
    sampleDe: "Es regnet heute.",
    notes: "Unpersönliches Wetterverb: existiert nur in der 3. Person Singular ('il pleut')!"
  }
];

// Hilfsfunktion: Konjugation von aller für Futur proche
const ALLER_CONJUGATION = {
  je: "vais",
  tu: "vas",
  il: "va",
  elle: "va",
  on: "va",
  nous: "allons",
  vous: "allez",
  ils: "vont",
  elles: "vont"
};

// Pronomenanzeige mit schöner Formatierung
const PRONOUNS = [
  { key: "je", label: "je / j'", de: "ich" },
  { key: "tu", label: "tu", de: "du" },
  { key: "il", label: "il / elle / on", de: "er / sie / man" },
  { key: "nous", label: "nous", de: "wir" },
  { key: "vous", label: "vous", de: "ihr / Sie" },
  { key: "ils", label: "ils / elles", de: "sie (Plural)" }
];
