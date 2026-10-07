"""Consolidate voila/data word resources into vocab-app/vocab.json"""
import json, os, pathlib

BASE = pathlib.Path(__file__).resolve().parent
VOILA_DATA = BASE.parent / "voila" / "data"
OUT = BASE / "vocab.json"

def load(name):
    p = VOILA_DATA / name
    if not p.exists():
        print(f"skip missing {name}")
        return []
    return json.loads(p.read_text(encoding="utf-8"))

vocab = []
seen = set()

# ---- Paris districts: theme keywords first, gloss keywords second ----
DISTRICTS = [
    ("montmartre", ("greet", "polit", "introduc", "family", "famille", "people", "person",
                    "describ", "appearance", "looks", "personality", "feelings", "feeling",
                    "emotion", "friend", "identity", "nationality", "meeting", "visits",
                    "invitations", "salutation")),
    ("cafe", ("food", "drink", "meal", "restaurant", "caf", "kitchen", "cook", "eat",
              "taste", "flavour", "flavor", "recipe", "shopping for food", "nourriture",
              "repas", "boisson")),
    ("champs", ("shop", "cloth", "colour", "color", "fashion", "money", "price", "number",
                "quantit", "pay", "clothes", "vêtement", "couleur", "nombre", "magasin")),
    ("gare", ("travel", "transport", "direction", "places", "city", "street", "hotel",
              "station", "weather", "season", "nature", "time", "days", "month", "hour",
              "date", "voyage", "ville", "temps", "météo", "saison", "vacances", "holiday",
              "trip", "airport", "ticket")),
    ("ile", ("house", "home", "furniture", "rent", "housework", "household", "room",
             "body", "health", "doctor", "medical", "daily", "routine", "sleep",
             "maison", "corps", "santé", "sante", "quotidien", "vie")),
    ("latin", ("work", "job", "school", "educat", "media", "opinion", "culture",
               "tradition", "news", "societ", "hobby", "sport", "leisure", "phone",
               "message", "technolog", "science", "complaint", "problem", "sense",
               "travail", "école", "ecole", "loisir", "opinion", "média", "media")),
]
# gloss (fr/en) keywords for words whose theme is just a part of speech
GLOSS = {
    "cafe": ("eat", "drink", "bread", "cheese", "wine", "coffee", "café", "cafe",
             "restaurant", "cook", "kitchen", "meal", "breakfast", "lunch", "dinner",
             "fruit", "meat", "fish", "cake", "thirst", "hunger", "manger", "boire",
             "pain", "fromage", "restaurant", "cuisine"),
    "gare": ("train", "métro", "metro", "bus", "taxi", "plane", "street", "road",
             "bridge", "hotel", "ticket", "map", "travel", "trip", "airport",
             "station", "rain", "sun", "snow", "wind", "sky", "cloud", "weather",
             "pluie", "soleil", "neige", "rue", "gare", "billet", "voyage"),
    "champs": ("shop", "store", "money", "price", "pay", "buy", "sell", "shirt",
               "dress", "shoe", "cloth", "pocket", "cheap", "expensive",
               "magasin", "prix", "acheter", "vendre", "argent"),
    "montmartre": ("friend", "love", "man", "woman", "child", "hello", "goodbye",
                   "thank", "please", "sorry", "happy", "sad", "smile", "ami",
                   "amour", "merci", "bonjour", "homme", "femme", "enfant"),
    "ile": ("house", "maison", "room", "bed", "door", "window", "sleep", "bath",
            "sick", "doctor", "hospital", "pain", "health", "lit", "porte",
            "fenêtre", "dormir", "malade", "médecin"),
    "latin": ("work", "school", "book", "study", "music", "film", "phone",
              "computer", "game", "sport", "art", "letter", "idea", "question",
              "travail", "école", "livre", "musique", "sport", "idée"),
}

def classify(theme, fr, en):
    t = (theme or "").lower()
    for did, kws in DISTRICTS:
        if any(k in t for k in kws):
            return did
    g = ((fr or "") + " " + (en or "")).lower()
    for did, kws in GLOSS.items():
        if any(k in g for k in kws):
            return did
    return None  # overheard words: dealt evenly across districts below

def add(fr, en, ex="", exEn="", level="A1", source="", theme=""):
    fr = (fr or "").strip()
    en = (en or "").strip()
    if not fr or not en:
        return
    key = (fr.lower(), en.lower())
    if key in seen:
        return
    seen.add(key)
    vocab.append({
        "fr": fr,
        "en": en,
        "ex": (ex or "").strip(),
        "exEn": (exEn or "").strip(),
        "level": level,
        "source": source,
        "theme": theme,
        "district": classify(theme, fr, en),
    })

# course.json: [{id, level, title, words:[{fr,en,ex,exEn}]}]
for e in load("course.json"):
    lvl = e.get("level", "A1")
    title = e.get("title", "")
    for w in e.get("words", []):
        add(w.get("fr"), w.get("en"), w.get("ex"), w.get("exEn"), lvl, "Course", title)

# cosmopolite a1/a2/b1: same shape
for fname, src in [("cosmopolite-a1.json", "Cosmopolite A1"),
                   ("cosmopolite-a2.json", "Cosmopolite A2"),
                   ("cosmopolite-b1.json", "Cosmopolite B1")]:
    for e in load(fname):
        lvl = e.get("level", src.split()[-1])
        title = e.get("title", "")
        for w in e.get("words", []):
            add(w.get("fr"), w.get("en"), w.get("ex"), w.get("exEn"), lvl, src, title)

# delf a1/a2: [{n, theme, items:[{fr,en,ex}]}]
for fname, lvl, src in [("delf-a1.json", "A1", "DELF A1"),
                        ("delf-a2.json", "A2", "DELF A2")]:
    for e in load(fname):
        theme = e.get("theme", "")
        for w in e.get("items", []):
            add(w.get("fr"), w.get("en"), w.get("ex"), "", lvl, src, theme)

# delf b1: [{n, theme, items:[...]}] -> B1
for e in load("delf-b1.json"):
    theme = e.get("theme", "")
    for w in e.get("items", []):
        add(w.get("fr"), w.get("en"), w.get("ex"), "", "B1", "DELF B1", theme)

# Deal "overheard" words (no theme match) by LEVEL so districts form a
# difficulty curve: Montmartre stays easy A1, Quartier Latin turns B1-hard.
# Sorted for stable rebuilds.
DEAL = {
    "A1": ["montmartre", "cafe", "champs"],
    "A2": ["cafe", "champs", "gare", "ile"],
    "B1": ["gare", "ile", "latin"],
}
left = sorted([w for w in vocab if not w["district"]], key=lambda w: w["fr"].lower())
from collections import defaultdict
di = defaultdict(int)
for w in left:
    lane = DEAL.get(w["level"], [d for d, _ in DISTRICTS])
    w["district"] = lane[di[w["level"]] % len(lane)]
    di[w["level"]] += 1

OUT.write_text(json.dumps(vocab, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"Wrote {len(vocab)} words -> {OUT}")
# stats
from collections import Counter
print(Counter(v["level"] for v in vocab))
print(Counter(v["source"] for v in vocab))
print(Counter(v["district"] for v in vocab))
