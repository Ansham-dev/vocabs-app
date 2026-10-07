# -*- coding: utf-8 -*-
"""Authoritative source for the 200 Korean seed words (TOPIK I common vocab).
Run:  python scripts/seed_data_kr.py   -> writes data/korean.seed.json
Format per line:  word|translation|exampleSentence|romanization|difficulty
"""
import json
import os

LINES = """\
나|I, me|나는 학생이에요.|na|beginner
너|you|너는 어디에 있어?|neo|beginner
우리|we, our|우리 집은 서울에 있어요.|uri|beginner
사람|person|많은 사람이 와요.|saram|beginner
친구|friend|친구와 영화를 봐요.|chingu|beginner
가족|family|가족이 다섯 명이에요.|gajok|beginner
부모님|parents|부모님께 전화해요.|bumonim|beginner
아이|child|아이가 울어요.|ai|beginner
남자|man|남자가 와요.|namja|beginner
여자|woman|여자가 웃어요.|yeoja|beginner
선생님|teacher|선생님이 친절해요.|seonsaengnim|beginner
학생|student|저는 학생이에요.|haksaeng|beginner
집|house, home|집에 가요.|jip|beginner
학교|school|학교에 가요.|hakgyo|beginner
회사|company|회사에 다녀요.|hoesa|beginner
병원|hospital|병원에 가요.|byeongwon|beginner
은행|bank|은행에서 돈을 찾아요.|eunhaeng|beginner
우체국|post office|우체국에 가요.|ucheguk|beginner
식당|restaurant|식당에서 밥을 먹어요.|sikdang|beginner
카페|café|카페에서 커피를 마셔요.|kape|beginner
시장|market|시장에서 과일을 사요.|sijang|beginner
백화점|department store|백화점에 가요.|baekhwajeom|beginner
공원|park|공원에서 산책해요.|gongwon|beginner
도서관|library|도서관에서 공부해요.|doseogwan|beginner
영화관|cinema|영화관에서 영화를 봐요.|yeonghwagwan|beginner
나라|country|어느 나라 사람이에요?|nara|beginner
한국|Korea|한국에 살아요.|hanguk|beginner
서울|Seoul|서울은 커요.|seoul|beginner
언어|language|외국어를 배워요.|eoneo|beginner
한국어|Korean language|한국어를 공부해요.|hangugeo|beginner
이름|name|이름이 뭐예요?|ireum|beginner
나이|age|나이가 어떻게 돼요?|nai|beginner
시간|time|지금 몇 시예요?|sigan|beginner
오늘|today|오늘 날씨가 좋아요.|oneul|beginner
내일|tomorrow|내일 만나요.|naeil|beginner
어제|yesterday|어제 영화를 봤어요.|eoje|beginner
아침|morning|아침을 먹어요.|achim|beginner
점심|lunch|점심을 먹어요.|jeomsim|beginner
저녁|evening, dinner|저녁을 같이 먹어요.|jeonyeok|beginner
밤|night|밤에 자요.|bam|beginner
요일|day of the week|오늘은 일요일이에요.|yoil|beginner
주|week|다음 주에 만나요.|ju|beginner
월|month|3월에 와요.|wol|beginner
년|year|올해는 2026년이에요.|nyeon|beginner
날씨|weather|날씨가 좋아요.|nalssi|beginner
비|rain|비가 와요.|bi|beginner
눈|snow|눈이 와요.|nun|beginner
봄|spring|봄에 꽃이 펴요.|bom|beginner
여름|summer|여름은 더워요.|yeoreum|beginner
가을|autumn|가을은 시원해요.|gaeur|beginner
겨울|winter|겨울은 추워요.|gyeoul|beginner
물|water|물을 마셔요.|mul|beginner
밥|rice, meal|밥을 먹어요.|bap|beginner
음식|food|한국 음식을 좋아해요.|eumsik|beginner
빵|bread|빵을 사요.|ppang|beginner
우유|milk|우유를 마셔요.|uyu|beginner
커피|coffee|커피를 마셔요.|keopi|beginner
차|tea|따뜻한 차를 마셔요.|cha|beginner
사과|apple|사과를 먹어요.|sagwa|beginner
돈|money|돈이 없어요.|don|beginner
책|book|책을 읽어요.|chaek|beginner
전화|phone|전화를 해요.|jeonhwa|beginner
사진|photo|사진을 찍어요.|sajin|beginner
영화|movie|영화를 봐요.|yeonghwa|beginner
음악|music|음악을 들어요.|eumak|beginner
노래|song|노래를 불러요.|norae|beginner
운동|exercise|운동을 해요.|undong|beginner
여행|travel|여행을 가요.|yeohaeng|beginner
가다|to go|학교에 가요.|gada|beginner
오다|to come|친구가 와요.|oda|beginner
먹다|to eat|밥을 먹어요.|meokda|beginner
마시다|to drink|물을 마셔요.|masida|beginner
보다|to see, to watch|영화를 봐요.|boda|beginner
읽다|to read|책을 읽어요.|ikda|beginner
쓰다|to write|편지를 써요.|sseuda|beginner
듣다|to listen|음악을 들어요.|deutda|beginner
말하다|to speak|한국어를 말해요.|malhada|beginner
공부하다|to study|한국어를 공부해요.|gongbuhada|beginner
일하다|to work|회사에서 일해요.|ilhada|beginner
사다|to buy|사과를 사요.|sada|beginner
만나다|to meet|친구를 만나요.|mannada|beginner
좋아하다|to like|음악을 좋아해요.|joahada|beginner
자다|to sleep|밤에 자요.|jada|beginner
일어나다|to get up|일곱 시에 일어나요.|ireonada|beginner
좋다|good|날씨가 좋아요.|jota|beginner
나쁘다|bad|기분이 나빠요.|nappeuda|beginner
크다|big|집이 커요.|keuda|beginner
작다|small|방이 작아요.|jakda|beginner
많다|many|사람이 많아요.|manta|beginner
덥다|hot (weather)|오늘은 더워요.|deopda|beginner
춥다|cold|겨울은 추워요.|chupda|beginner
쉽다|easy|이 문제는 쉬워요.|swipda|beginner
어렵다|difficult|한국어가 어려워요.|eoryeopda|beginner
재미있다|interesting, fun|영화가 재미있어요.|jaemiitda|beginner
맛있다|delicious|김치가 맛있어요.|masitda|beginner
바쁘다|busy|오늘은 바빠요.|bappeuda|beginner
행복하다|happy|행복해요.|haengbokhada|beginner
하나|one|사과 하나 주세요.|hana|beginner
열|ten|열 시에 만나요.|yeol|beginner
천|thousand|천 원이에요.|cheon|beginner
결정하다|to decide|빨리 결정해요.|gyeoljeonghada|intermediate
설명하다|to explain|선생님이 설명해요.|seolmyeonghada|intermediate
준비하다|to prepare|시험을 준비해요.|junbihada|intermediate
시작하다|to start|수업이 시작해요.|sijakhada|intermediate
끝나다|to end|영화가 끝나요.|kkeunnada|intermediate
필요하다|to need|도움이 필요해요.|piryohada|intermediate
가능하다|possible|내일 만나는 게 가능해요.|ganeunghada|intermediate
불가능하다|impossible|그건 불가능해요.|bulganeunghada|intermediate
경험|experience|여행 경험이 많아요.|gyeongheom|intermediate
기회|opportunity|좋은 기회예요.|gihoe|intermediate
약속|promise, appointment|약속을 지켜요.|yaksok|intermediate
걱정|worry|걱정하지 마세요.|geokjeong|intermediate
노력|effort|열심히 노력해요.|noryeok|intermediate
계획|plan|주말 계획이 있어요.|gyehoek|intermediate
문제|problem, question|문제를 풀어요.|munje|intermediate
방법|method, way|좋은 방법이 있어요.|bangbeop|intermediate
이유|reason|이유를 알아요.|iyu|intermediate
결과|result|결과가 좋아요.|gyeolgwa|intermediate
질문|question|질문이 있어요.|jilmun|intermediate
대답|answer|대답을 해 주세요.|daedap|intermediate
전화번호|phone number|전화번호를 알려 주세요.|jeonhwabeonho|intermediate
주소|address|주소를 적어 주세요.|juso|intermediate
취미|hobby|취미가 뭐예요?|chwimi|intermediate
꿈|dream|꿈이 커요.|kkum|intermediate
건강|health|건강이 중요해요.|geongang|intermediate
안전|safety|안전이 제일이에요.|anjeon|intermediate
자유|freedom|자유를 원해요.|jayu|intermediate
평화|peace|평화를 사랑해요.|pyeonghwa|intermediate
빨리|quickly|빨리 오세요.|ppalli|intermediate
천천히|slowly|천천히 말해 주세요.|cheoncheonhi|intermediate
자주|often|자주 만나요.|jaju|intermediate
가끔|sometimes|가끔 영화를 봐요.|gakkeum|intermediate
항상|always|항상 웃어요.|hangsang|intermediate
절대|never|절대 늦지 마세요.|jeoldae|intermediate
벌써|already|벌써 열두 시예요.|beolsseo|intermediate
아직|yet, still|아직 안 먹었어요.|ajik|intermediate
같이|together|같이 가요.|gachi|intermediate
혼자|alone|혼자 여행해요.|honja|intermediate
그래서|so, therefore|비가 와요. 그래서 우산을 가져가요.|geuraeseo|intermediate
하지만|but|비가 오지만 가요.|hajiman|intermediate
그리고|and|밥을 먹고 그리고 공부해요.|geurigo|intermediate
만약|if|만약 비가 오면 집에 있어요.|manyak|intermediate
비싸다|expensive|이 가방은 비싸요.|bissada|intermediate
싸다|cheap|이 모자는 싸요.|ssada|intermediate
가깝다|near|학교가 가까워요.|gakkapda|intermediate
멀다|far|집이 멀어요.|meolda|intermediate
새롭다|new|새 옷을 샀어요.|saeropda|intermediate
시원하다|cool, refreshing|바람이 시원해요.|siwonhada|intermediate
따뜻하다|warm|차가 따뜻해요.|ttatteuthada|intermediate
시끄럽다|noisy|밖이 시끄러워요.|sikkeureopda|intermediate
조용하다|quiet|도서관이 조용해요.|joyonghada|intermediate
친절하다|kind|그분은 친절해요.|chinjeolhada|intermediate
유명하다|famous|그 배우는 유명해요.|yumyeonghada|intermediate
편리하다|convenient|교통이 편리해요.|pyeonrihada|intermediate
위험하다|dangerous|밤길은 위험해요.|wiheomhada|intermediate
다르다|different|생각이 달라요.|dareuda|intermediate
같다|same|나도 같아요.|gatda|intermediate
이기다|to win|경기에서 이겨요.|igida|intermediate
지다|to lose|경기에서 졌어요.|jida|intermediate
놓치다|to miss|버스를 놓쳤어요.|nochida|intermediate
환경|environment|환경을 보호해요.|hwangyeong|advanced
경제|economy|경제가 좋아져요.|gyeongje|advanced
사회|society|사회가 변해요.|sahoe|advanced
문화|culture|한국 문화를 배워요.|munhwa|advanced
역사|history|역사를 공부해요.|yeoksa|advanced
정치|politics|정치에 관심이 있어요.|jeongchi|advanced
교육|education|교육이 중요해요.|gyoyuk|advanced
발전|development|기술이 발전해요.|baljeon|advanced
영향|influence|큰 영향을 줘요.|yeonghyang|advanced
해결하다|to solve|문제를 해결해요.|haegyeolhada|advanced
증가하다|to increase|인구가 증가해요.|jeunggahada|advanced
감소하다|to decrease|쓰레기가 감소해요.|gamsohada|advanced
유지하다|to maintain|건강을 유지해요.|yujihada|advanced
참여하다|to participate|행사에 참여해요.|chamyeohada|advanced
요구하다|to demand|설명을 요구해요.|yoguhada|advanced
주장하다|to claim|그는 결백을 주장해요.|jujanghada|advanced
비판하다|to criticize|정책을 비판해요.|bipanhada|advanced
찬성하다|to agree|의견에 찬성해요.|chanseonghada|advanced
반대하다|to oppose|계획에 반대해요.|bandaehada|advanced
기대하다|to expect|좋은 결과를 기대해요.|gidaehada|advanced
실망하다|to be disappointed|결과에 실망해요.|silmanghada|advanced
만족하다|to be satisfied|서비스에 만족해요.|manjokhada|advanced
성공하다|to succeed|사업에 성공해요.|seonggonghada|advanced
실패하다|to fail|실패해도 괜찮아요.|silpaehada|advanced
극복하다|to overcome|어려움을 극복해요.|geukbokhada|advanced
인정하다|to admit|실수를 인정해요.|injeonghada|advanced
존중하다|to respect|서로 존중해요.|jonjunghada|advanced
배려하다|to be considerate|남을 배려해요.|baeryeohada|advanced
공감하다|to empathize|마음에 공감해요.|gonggamhada|advanced
책임|responsibility|책임이 커요.|chaegim|advanced
의무|duty|의무를 다해요.|uimu|advanced
권리|right|권리를 지켜요.|gwolli|advanced
평등|equality|평등이 중요해요.|pyeongdeung|advanced
정의|justice|정의를 믿어요.|jeongui|advanced
진실|truth|진실을 말해요.|jinsil|advanced
거짓말|lie|거짓말하지 마세요.|geojinmal|advanced
소문|rumor|소문을 믿지 마세요.|somun|advanced
전통|tradition|전통을 지켜요.|jeontong|advanced
미래|future|미래가 밝아요.|mirae|advanced
과거|past|과거를 잊지 마세요.|gwageo|advanced"""

def main() -> None:
    cards = []
    seen = set()
    for i, line in enumerate(LINES.strip().splitlines(), 1):
        parts = line.split("|")
        assert len(parts) == 5, f"line {i}: {line!r}"
        word, translation, example, romanization, difficulty = parts
        assert difficulty in ("beginner", "intermediate", "advanced"), f"line {i}"
        assert word not in seen, f"duplicate word line {i}: {word}"
        seen.add(word)
        cards.append(
            {
                "language": "korean",
                "word": word,
                "translation": translation,
                "exampleSentence": example,
                "romanization": romanization,
                "difficulty": difficulty,
            }
        )
    print(f"Korean cards: {len(cards)}")
    assert len(cards) == 200, f"expected 200, got {len(cards)}"
    os.makedirs("data", exist_ok=True)
    with open("data/korean.seed.json", "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=1)
    print("wrote data/korean.seed.json")

if __name__ == "__main__":
    main()
