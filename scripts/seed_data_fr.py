# -*- coding: utf-8 -*-
"""Authoritative source for the 200 French seed words (A1/A2 common vocab).
Run:  python scripts/seed_data_fr.py   -> writes data/french.seed.json
Format per line:  word|translation|exampleSentence|difficulty
(romanization is null for French, per schema.)
"""
import json
import os

LINES = """\
bonjour|hello|Bonjour, comment ça va ?|beginner
bonsoir|good evening|Bonsoir, à demain !|beginner
salut|hi|Salut, ça va ?|beginner
merci|thank you|Merci beaucoup !|beginner
oui|yes|Oui, je veux bien.|beginner
non|no|Non, merci.|beginner
s'il vous plaît|please|Un café, s'il vous plaît.|beginner
pardon|excuse me, sorry|Pardon, où est la gare ?|beginner
homme|man|L'homme marche dans la rue.|beginner
femme|woman|La femme sourit.|beginner
enfant|child|L'enfant joue au parc.|beginner
ami|friend|Mon ami habite à Paris.|beginner
famille|family|Ma famille est grande.|beginner
père|father|Mon père travaille ici.|beginner
mère|mother|Ma mère cuisine bien.|beginner
frère|brother|Mon frère est étudiant.|beginner
sœur|sister|Ma sœur lit un livre.|beginner
maison|house|La maison est grande.|beginner
école|school|L'école est près d'ici.|beginner
travail|work|Le travail commence à neuf heures.|beginner
temps|time, weather|Le temps passe vite.|beginner
jour|day|Quel jour sommes-nous ?|beginner
aujourd'hui|today|Aujourd'hui, il fait beau.|beginner
demain|tomorrow|À demain !|beginner
hier|yesterday|Hier, j'ai vu un film.|beginner
matin|morning|Le matin, je bois du café.|beginner
soir|evening|Le soir, je lis.|beginner
nuit|night|Bonne nuit !|beginner
semaine|week|La semaine prochaine, je pars.|beginner
mois|month|En mars, il pleut souvent.|beginner
année|year|Cette année est belle.|beginner
eau|water|Je bois de l'eau.|beginner
pain|bread|Je mange du pain.|beginner
lait|milk|Le lait est frais.|beginner
café|coffee|Un café, s'il vous plaît.|beginner
thé|tea|Je prends un thé chaud.|beginner
pomme|apple|Je mange une pomme.|beginner
argent|money|Je n'ai pas d'argent.|beginner
livre|book|Je lis un livre.|beginner
professeur|teacher|Le professeur explique bien.|beginner
étudiant|student|L'étudiant étudie le français.|beginner
nom|name|Quel est ton nom ?|beginner
âge|age|Quel âge as-tu ?|beginner
téléphone|phone|Je réponds au téléphone.|beginner
photo|photo|Je prends une photo.|beginner
film|movie|Le film est drôle.|beginner
musique|music|J'écoute de la musique.|beginner
chanson|song|La chanson est belle.|beginner
sport|sport|Je fais du sport.|beginner
voyage|trip, travel|Bon voyage !|beginner
être|to be|Je suis content.|beginner
avoir|to have|J'ai deux frères.|beginner
aller|to go|Je vais à l'école.|beginner
venir|to come|Tu viens avec moi ?|beginner
manger|to eat|Je mange une pomme.|beginner
boire|to drink|Je bois de l'eau.|beginner
voir|to see|Je vois mes amis.|beginner
lire|to read|Je lis un journal.|beginner
écrire|to write|J'écris une lettre.|beginner
parler|to speak|Je parle français.|beginner
étudier|to study|J'étudie le coréen.|beginner
travailler|to work|Je travaille à Séoul.|beginner
acheter|to buy|J'achète du pain.|beginner
rencontrer|to meet|Je rencontre mes amis.|beginner
aimer|to like, to love|J'aime la musique.|beginner
dormir|to sleep|Je dors huit heures.|beginner
se lever|to get up|Je me lève à sept heures.|beginner
bon|good|C'est un bon film.|beginner
mauvais|bad|Le temps est mauvais.|beginner
grand|big, tall|La maison est grande.|beginner
petit|small|Le chat est petit.|beginner
chaud|hot, warm|Le café est chaud.|beginner
froid|cold|L'hiver est froid.|beginner
facile|easy|Cet exercice est facile.|beginner
difficile|difficult|Le français est difficile.|beginner
intéressant|interesting|Ce livre est intéressant.|beginner
délicieux|delicious|Ce gâteau est délicieux.|beginner
occupé|busy|Je suis occupé aujourd'hui.|beginner
heureux|happy|Je suis heureux.|beginner
un|one, a|Un café, s'il vous plaît.|beginner
deux|two|J'ai deux chats.|beginner
trois|three|Ils sont trois.|beginner
dix|ten|Il est dix heures.|beginner
cent|hundred|Ça coûte cent euros.|beginner
beau|beautiful|Il fait beau.|beginner
nouveau|new|J'ai un nouveau vélo.|beginner
vieux|old|Ce bâtiment est vieux.|beginner
jeune|young|Elle est jeune.|beginner
long|long|La rue est longue.|beginner
court|short|Le film est court.|beginner
vite|quickly|Viens vite !|beginner
lentement|slowly|Parle lentement, s'il te plaît.|beginner
souvent|often|Je le vois souvent.|beginner
parfois|sometimes|Parfois, je reste à la maison.|beginner
toujours|always|Il sourit toujours.|beginner
jamais|never|Je ne fume jamais.|beginner
déjà|already|Il est déjà midi.|beginner
encore|still, again|Encore un café ?|beginner
ensemble|together|On y va ensemble.|beginner
seul|alone|Il voyage seul.|beginner
décider|to decide|Je dois décider vite.|intermediate
expliquer|to explain|Le professeur explique la leçon.|intermediate
préparer|to prepare|Je prépare l'examen.|intermediate
commencer|to start, to begin|Le cours commence à dix heures.|intermediate
finir|to finish|Le film finit à minuit.|intermediate
avoir besoin de|to need|J'ai besoin d'aide.|intermediate
possible|possible|C'est possible demain.|intermediate
impossible|impossible|C'est impossible ce soir.|intermediate
expérience|experience|J'ai une grande expérience.|intermediate
occasion|opportunity, occasion|C'est une bonne occasion.|intermediate
promesse|promise|Je tiens ma promesse.|intermediate
souci|worry|Ne te fais pas de souci.|intermediate
effort|effort|Fais un effort !|intermediate
projet|plan, project|Quel est ton projet ?|intermediate
problème|problem|Je résous le problème.|intermediate
moyen|means, way|Il y a un bon moyen.|intermediate
raison|reason|Tu as raison.|intermediate
résultat|result|Le résultat est bon.|intermediate
question|question|J'ai une question.|intermediate
réponse|answer|Donne-moi ta réponse.|intermediate
numéro de téléphone|phone number|Donne-moi ton numéro.|intermediate
adresse|address|Écris ton adresse ici.|intermediate
passe-temps|hobby, pastime|Quel est ton passe-temps ?|intermediate
rêve|dream|Mon rêve est grand.|intermediate
santé|health|La santé est importante.|intermediate
sécurité|safety, security|La sécurité d'abord.|intermediate
liberté|freedom|La liberté est précieuse.|intermediate
paix|peace|Nous voulons la paix.|intermediate
parce que|because|Je reste parce qu'il pleut.|intermediate
mais|but|Il pleut, mais je sors.|intermediate
et|and|Je mange et je bois.|intermediate
donc|so, therefore|Il pleut, donc je prends un parapluie.|intermediate
si|if| S'il pleut, je reste.|intermediate
cher|expensive|Ce sac est cher.|intermediate
bon marché|cheap|Ce chapeau est bon marché.|intermediate
près|near|L'école est près d'ici.|intermediate
loin|far|La gare est loin.|intermediate
calme|calm|Le parc est calme.|intermediate
bruyant|noisy|La rue est bruyante.|intermediate
gentil|kind|Il est très gentil.|intermediate
célèbre|famous|Cet acteur est célèbre.|intermediate
pratique|convenient, practical|Le métro est pratique.|intermediate
dangereux|dangerous|La route est dangereuse.|intermediate
différent|different|Nos avis sont différents.|intermediate
pareil|same|Moi aussi, pareil.|intermediate
gagner|to win|Nous gagnons le match.|intermediate
perdre|to lose|Ne perds pas espoir.|intermediate
rater|to miss|J'ai raté le bus.|intermediate
réussir|to succeed, to pass|Je réussis mon examen.|intermediate
attendre|to wait|Attends-moi ici.|intermediate
choisir|to choose|Je choisis le rouge.|intermediate
payer|to pay|Je paie en espèces.|intermediate
inviter|to invite|J'invite mes amis.|intermediate
fêter|to celebrate|On fête ton anniversaire.|intermediate
ranger|to tidy up|Je range ma chambre.|intermediate
laver|to wash|Je lave les légumes.|intermediate
conduire|to drive|Je conduis prudemment.|intermediate
marcher|to walk|Je marche dans le parc.|intermediate
courir|to run|Je cours chaque matin.|intermediate
rire|to laugh|Nous rions ensemble.|intermediate
environnement|environment|Protégeons l'environnement.|advanced
économie|economy|L'économie se redresse.|advanced
société|society|La société change vite.|advanced
culture|culture|J'apprends la culture française.|advanced
histoire|history, story|J'étudie l'histoire.|advanced
politique|politics, policy|Il s'intéresse à la politique.|advanced
éducation|education|L'éducation est essentielle.|advanced
développement|development|Le développement durable compte.|advanced
influence|influence|Il a une grande influence.|advanced
résoudre|to solve|Je résous ce problème.|advanced
augmenter|to increase|Les prix augmentent.|advanced
diminuer|to decrease|Le bruit diminue le soir.|advanced
maintenir|to maintain|Je maintiens ma forme.|advanced
participer|to participate|Je participe à l'événement.|advanced
exiger|to demand|Ils exigent une réponse.|advanced
affirmer|to claim, to assert|Il affirme son innocence.|advanced
critiquer|to criticize|Il critique le projet.|advanced
approuver|to approve|J'approuve ton idée.|advanced
s'opposer|to oppose, to object|Je m'oppose à ce plan.|advanced
espérer|to hope|J'espère te voir bientôt.|advanced
décevoir|to disappoint|Ce résultat me déçoit.|advanced
satisfaire|to satisfy|Ce service me satisfait.|advanced
échouer|to fail|On peut échouer et recommencer.|advanced
surmonter|to overcome|Je surmonte mes peurs.|advanced
admettre|to admit|J'admets mon erreur.|advanced
respecter|to respect|Respecte les autres.|advanced
tenir compte de|to take into account|Je tiens compte de ton avis.|advanced
comprendre|to understand|Je comprends ton choix.|advanced
responsabilité|responsibility|C'est ma responsabilité.|advanced
devoir|duty|Je fais mon devoir.|advanced
droit|right|Défends tes droits.|advanced
égalité|equality|L'égalité est importante.|advanced
justice|justice|Je crois en la justice.|advanced
vérité|truth|Dis toujours la vérité.|advanced
mensonge|lie|Ne dis pas de mensonges.|advanced
rumeur|rumor|Ne crois pas les rumeurs.|advanced
tradition|tradition|On garde la tradition.|advanced
avenir|future|L'avenir est prometteur.|advanced
passé|past|N'oublie pas le passé.|advanced
présent|present|Vivons dans le présent.|advanced"""

def main() -> None:
    cards = []
    seen = set()
    for i, line in enumerate(LINES.strip().splitlines(), 1):
        parts = line.split("|")
        assert len(parts) == 4, f"line {i}: {line!r}"
        word, translation, example, difficulty = parts
        word = word.strip()
        assert difficulty in ("beginner", "intermediate", "advanced"), f"line {i}"
        assert word not in seen, f"duplicate word line {i}: {word}"
        seen.add(word)
        cards.append(
            {
                "language": "french",
                "word": word,
                "translation": translation,
                "exampleSentence": example.strip(),
                "romanization": None,
                "difficulty": difficulty,
            }
        )
    print(f"French cards: {len(cards)}")
    assert len(cards) == 200, f"expected 200, got {len(cards)}"
    os.makedirs("data", exist_ok=True)
    with open("data/french.seed.json", "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=1)
    print("wrote data/french.seed.json")

if __name__ == "__main__":
    main()
