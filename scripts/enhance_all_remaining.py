# -*- coding: utf-8 -*-
import json

DB = '/Users/wspark/.openclaw/workspace/pet-content-dashboard/data/content-db.json'

# ===== 응급 (632자) =====
EMERGENCY = '<h3>\xf0\x9f\x94\xac 개요</h3>\n<p>반려동물 응급 상황에서 골든타임은 생존을 결정합니다. 심정지 4분, 호흡정지 3~5분, GDV(위비틀림) 1~2시간이 핵심 시간입니다. 정상 생체징후 — 체온: 37.5~39.2\u00b0C, 심박수: 개 60~140bpm(대형\u2192소형), 고양이 160~220bpm, 호흡수: 개 15~30회/분, 고양이 20~40회/분, CRT(모세혈관재충전시간): <2초.</p>\n\n<h3>\xf0\x9f\x93\x8b 응급 프로토콜</h3>\n<p><strong>CPR:</strong> 흉부 압박 100~120회/분, 깊이 흉곽 1/3~1/2. 30회 압박 : 2회 인공호흡(입-코). 에피네프린 0.01~0.1mg/kg IV q3~5분.</p>\n<p><strong>호흡곤란:</strong> 산소 flow-by 2~3L/분, 스트레스 최소화. 고양이 개구호흡은 항상 비정상. 푸로세마이드 2~4mg/kg IV(폐수종).</p>\n<p><strong>중독:</strong> 구토유도(3% 과산화수소 1~2mL/kg, 개만) + 활성탄 1~2g/kg. 초콜릿 치사량 100~200mg/kg(테오브로민), 자일리톨 0.1g/kg(저혈당).</p>\n<p><strong>출혈/쇼크:</strong> 직접 압박 5~10분, 쇼크 수액 개 90mL/kg/h, 고양이 60mL/kg/h(1/4씩 투여 후 재평가). 잇몸 창백+CRT>2초+빈맥 = 쇼크.</p>\n<p><strong>발작:</strong> 5분 이상 지속 시 중첩발작 응급. 디아제팜 0.5~1mg/kg IV/직장. 주변 위험물 치우기, 영상 촬영.</p>\n<p><strong>열사병:</strong> 체온>41\u00b0C. 미지근한 물(15~20\u00b0C)로 냉각, 얼음물 금지. 39.5\u00b0C까지 내리면 중단. 사망률 39~50%.</p>\n\n<h3>\xf0\x9f\x94\x8d 위험 징후 (즉시 병원)</h3>\n<p>개구호흡(고양이), 청색증, 비생산적 구역질+복부팽만(GDV), 혈변/혈뇨, 의식소실, 발작 5분+, 체온>41\u00b0C 또는 <36\u00b0C, 24시간+ 구토, 소변 불능.</p>\n\n<h3>\xf0\x9f\x92\x8a 병원 치료 핵심</h3>\n<p>수액소생(LRS/NaCl), 산소공급(FiO2 40~60%), 혈액검사(CBC, 화학, 응고, 가스), 영상진단(X-ray, 초음파). 진통: 메타돈 0.1~0.5mg/kg IV, 부토르파놀 0.2~0.4mg/kg IM.</p>\n\n<h3>\xf0\x9f\x9b\xa1\xef\xb8\x8f 응급키트 필수품</h3>\n<p>직장 체온계, 거즈/붕대, 클로르헥시딘 0.05%, 핀셋/가위, 응급 담요, 꿀(저혈당), 3% 과산화수소, 24시간 동물병원 연락처.</p>\n\n<h3>\xe2\x9a\xa0\xef\xb8\x8f 보호자 주의사항</h3>\n<p>다친 동물은 물 수 있으므로 입마개 사용(호흡곤란/구토 시 제외). 골절 부위 억지로 맞추지 않기. 소금물 구토유도 위험(나트륨중독). 고양이에게 과산화수소 금지. 의심 물질 포장지 가져가기. 증상 없어도 24~72시간 후 장기 손상 가능 — 반드시 검사.</p>'

# ===== 시니어 (657자) =====
SENIOR = '<h3>\xf0\x9f\x94\xac 개요</h3>\n<p>노령동물 정의: 소형견 10세+, 중형견 8세+, 대형견 6~7세+, 초대형견 5세+, 고양이 11세+(시니어), 15세+(슈퍼시니어). 노화에 따라 대사율 감소(20~30%), 근육량 감소(연 1~2%), 면역력 저하, 감각 기능 저하가 진행됩니다. 정기 건강검진(연 2회)과 적절한 영양 관리가 삶의 질을 결정합니다.</p>\n\n<h3>\xf0\x9f\x93\x8b 주요 노령 질환</h3>\n<p><strong>인지기능장애(CDS):</strong> DISHAA 체크리스트 — Disorientation(방향감각 상실), Interaction 변화, Sleep-wake 주기 변화, House soiling(실내 배변), Activity 변화, Anxiety 증가. 유병률: 11~12세 개 28%, 15~16세 68%.</p>\n<p><strong>근감소증(Sarcopenia):</strong> MCS(Muscle Condition Score)로 평가. 고단백식(단백질 >25% DM), 류신 보충, 적절한 운동이 핵심.</p>\n<p><strong>관절염(OA):</strong> 개 20%(1세+), 고양이 61~90%(X-ray). EPA+DHA 100mg/kg/일, 글루코사민 20mg/kg/일, 체중관리(BCS 4~5/9).</p>\n<p><strong>만성 신장병(CKD):</strong> 고양이 30~40%(15세+). SDMA 조기 진단(>14\u00b5g/dL). 인 제한, 단백질 적정, 수분 섭취 강화.</p>\n\n<h3>\xf0\x9f\x94\x8d 정기 검진 항목</h3>\n<p>혈액검사: CBC, 혈청화학(BUN 정상 7~27mg/dL, Crea 0.5~1.8mg/dL, ALT 10~125U/L, 혈당 74~143mg/dL, T4 1.0~4.0\u00b5g/dL), SDMA(<18\u00b5g/dL). 소변검사: 비중(개 1.025~1.045, 고양이 1.035~1.060), UPC. 혈압: 수축기 <160mmHg. 안과검사, 치과검사, 체중/BCS/MCS 평가.</p>\n\n<h3>\xf0\x9f\x92\x8a 영양 관리</h3>\n<p>에너지: RER \xd7 1.0~1.4(활동량에 따라). 단백질: 근손실 방지를 위해 성견보다 높게(>25% DM). 인: CKD 없으면 제한 불필요. 오메가3: 50~100mg/kg/일(항염, 인지). 항산화: 비타민E 400IU/kg DM + 비타민C 100mg/일 + 셀레늄. MCT오일: 인지기능 1~2mL/kg/일. L-카르니틴: 근육 에너지 50~100mg/kg DM.</p>\n\n<h3>\xf0\x9f\x9b\xa1\xef\xb8\x8f 환경 개선</h3>\n<p>미끄럼 방지 매트, 높은 침대/소파 경사로, 사료/물그릇 높이 조절, 화장실 턱 낮추기(고양이), 적절한 조명(야간등), 정해진 루틴 유지(인지장애 완화).</p>\n\n<h3>\xe2\x9a\xa0\xef\xb8\x8f 보호자 주의사항</h3>\n<p>체중 감소 >10%/6개월은 질병 신호. "나이 들어서 그래"로 넘기지 마세요 — 통증, 갑상선, 신장, 종양 등 치료 가능한 원인이 있을 수 있습니다. 삶의 질 평가(HHHHHMM 척도): Hurt, Hunger, Hydration, Hygiene, Happiness, Mobility, More good days than bad. 완화 의료와 안락사 결정은 수의사와 함께 논의하세요.</p>'

# ===== 처방식 (706자) =====
PRESCRIPTION = '<h3>\xf0\x9f\x94\xac 개요 및 기전</h3>\n<p>처방식(therapeutic diet)은 특정 질환의 병태생리를 고려하여 영양소를 정밀 조절한 의학적 식이요법입니다. 일반 사료와 달리 수의사 처방 하에 급여하며, 질병 진행 억제와 증상 완화를 목표로 합니다. AAFCO "complete and balanced" 기준을 충족하면서도 특정 영양소를 제한하거나 강화합니다.</p>\n\n<h3>\xf0\x9f\x93\x8b 질환별 핵심 성분</h3>\n<p><strong>신장병(CKD):</strong> 인 0.2~0.5%(DM), 단백질 14~25%(DM, IRIS 단계별), Na 0.1~0.3%, 오메가3 EPA+DHA 140mg/kg/일. 전환 7~10일.</p>\n<p><strong>간질환:</strong> 단백질 15~20%(DM, 간성뇌증), 유제품/대두 단백 선호. Cu <5mg/kg DM(구리축적). SAMe 20mg/kg/일(개). 소량 다회(4~6회/일).</p>\n<p><strong>비만:</strong> 칼로리 RER\xd70.8, 단백질 25~35%(DM), 지방 8~12%, 섬유 12~25%, L-카르니틴 50~300mg/kg DM. 주당 체중 1~2%(개), 0.5~1%(고양이) 감량.</p>\n<p><strong>알레르기:</strong> 가수분해 단백질(<10kDa) 또는 신규 단백질(캥거루, 사슴, 곤충). 제거식이 8~12주 엄격 실시. 오메가6:3 = 5:1~10:1.</p>\n<p><strong>비뇨기:</strong> 스트루바이트 pH 6.0~6.3, Mg <20mg/100kcal. 옥살레이트 pH 6.5~7.0, 시트르산칼륨 75mg/kg/일. 수분 60ml/kg/일+.</p>\n<p><strong>관절:</strong> EPA+DHA 100mg/kg/일+, 글루코사민 20mg/kg/일, 콘드로이틴 15mg/kg/일, GLM 77mg/kg/일.</p>\n\n<h3>\xf0\x9f\x8d\xbd\xef\xb8\x8f 급여 전환법</h3>\n<p>표준 전환 7~10일: 1~3일 기존75%+신규25% \u2192 4~6일 50:50 \u2192 7~9일 25:75 \u2192 10일 100%. 소화기 질환은 10~14일 권장. 식욕 저하 시: 사료 37\u00b0C로 데우기, 소량 다회, 향미 증진제(치킨 브로스 소량). 급여량 계산: RER = 70 \xd7 체중(kg)^0.75 kcal/일.</p>\n\n<h3>\xf0\x9f\x93\x8a 모니터링</h3>\n<p>체중 주 1회, BCS/MCS 월 1회. 질환별 혈액검사: 신장(BUN, Crea, SDMA, P, K), 간(ALT, AST, ALP, NH3, 알부민), 당뇨(혈당, 프룩토사민), 비뇨기(요검사 pH, 결정체). 초기 2~4주 \u2192 안정 후 3~6개월 간격.</p>\n\n<h3>\xf0\x9f\x9b\xa1\xef\xb8\x8f 효과적인 활용</h3>\n<p>처방식 효과를 최대화하려면 간식·사람 음식·일반 사료 혼합을 완전히 차단해야 합니다. 특히 알레르기 제거식이 중 간식 1개만 줘도 시험이 무효화됩니다. 수의사 처방 없이 임의 변경·중단은 질병 악화를 초래합니다.</p>\n\n<h3>\xe2\x9a\xa0\xef\xb8\x8f 보호자 주의사항</h3>\n<p>처방식은 의약품과 같은 개념입니다. 인터넷에서 구매 가능하더라도 반드시 수의사 진단 후 급여하세요. 다견/다묘 가정에서 처방식 환자만 분리 급여가 필요합니다. 처방식 비용이 부담되면 수의사와 대안을 상의하세요(성분 비교 후 유사 제품 검토). 급여량을 저울로 정확히 측정하고, 체중 변화를 기록하세요.</p>'

with open(DB, 'r', encoding='utf-8') as f:
    data = json.load(f)

mod = 0
for cat in data['categories']:
    for sub in cat.get('subcategories', []):
        for t in sub.get('topics', []):
            flen = len(t.get('fullContent', ''))
            if flen == 632:
                t['fullContent'] = EMERGENCY
                mod += 1
            elif flen == 657:
                t['fullContent'] = SENIOR
                mod += 1
            elif flen == 706:
                t['fullContent'] = PRESCRIPTION
                mod += 1

with open(DB, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

json.load(open(DB, encoding='utf-8'))
print(f'Modified: {mod}')
