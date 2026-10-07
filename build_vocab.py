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

OUT.write_text(json.dumps(vocab, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"Wrote {len(vocab)} words -> {OUT}")
# stats
from collections import Counter
print(Counter(v["level"] for v in vocab))
print(Counter(v["source"] for v in vocab))
