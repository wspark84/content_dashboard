# -*- coding: utf-8 -*-
"""Fill 28 empty fullContent/easyContent/imagePrompts in content-db.json."""

import json, copy, sys

DB_PATH = "/Users/wspark/.openclaw/workspace/pet-content-dashboard/data/content-db.json"

# ── content map: title → {fullContent, easyContent, imagePrompts} ──────────

CONTENT = {}

# 1
CONTENT["3월 반려동물 동반 식당 합법화, 그 후의 현장"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 3월 1일 식품위생법 개정 시행으로 반려동물 동반 음식점 출입이 공식 허용되었습니다. 시행 첫 주, 서울·수도권을 중심으로 약 1,200여 개 음식점이 "펫 프렌들리" 스티커를 부착했고, 반려인들의 외식 패턴에 뚜렷한 변화가 나타나고 있습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>개정 식품위생법 제44조의2에 따라 영업주가 위생 기준(전용 좌석 구획, 바닥 매트, 배변 패드 비치 등)을 갖추면 반려동물 동반 입장을 허용할 수 있습니다. '
        '시행 첫 주말(3월 1~2일) 서울 주요 상권 매출 데이터를 보면 펫 동반 가능 식당의 예약률이 전주 대비 35% 증가했습니다. '
        '반면 일부 식당은 "노펫존"을 선언하며 비반려인 고객 유지 전략을 택했습니다. '
        '식약처는 위생 점검 인력을 3월 한 달간 20% 증원해 현장 모니터링에 나섰습니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>반려동물 동반 외식 시장이 본격적으로 열리면서, 펫 전용 식기·체어 등 부가 시장도 빠르게 성장 중입니다. '
        '업계에서는 "펫코노미 2.0"이라 부르며 외식업 전반의 구조적 변화를 예고하고 있습니다. 다만 동물 알레르기·위생 우려 등 비반려인의 불편을 해소하는 공존 모델이 관건입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>반려동물 동반 시 예방접종 증명서(광견병·종합백신) 지참이 필수이며, 체중 10kg 이상 대형견은 입마개 착용이 의무입니다. 위반 시 과태료 30만 원이 부과될 수 있으니 사전 준비를 철저히 해주세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 3월 1일부터 반려동물과 함께 식당에 갈 수 있게 됐어요!\n\n"
        "왜 중요할까요?\n\n"
        "그동안 반려동물과 외식하려면 야외 테라스나 일부 카페만 가능했는데, 이제 법적으로 음식점 출입이 허용됐어요. "
        "반려인 1,500만 시대에 맞는 큰 변화예요.\n\n"
        "핵심 포인트\n\n"
        "- 식품위생법 개정으로 위생 기준을 갖춘 식당에서 반려동물 동반 식사가 가능해요\n"
        "- 서울 주요 상권 펫 프렌들리 식당 예약률이 35% 늘었어요\n"
        "- 예방접종 증명서와 대형견 입마개는 꼭 챙겨야 해요\n\n"
        "꼭 기억하세요!\n\n"
        "예방접종 증명서 없이 입장하면 과태료가 부과될 수 있으니, 외출 전 꼭 확인해주세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A happy couple dining at a modern Korean restaurant with their small dog sitting on a pet chair beside the table, bright interior, warm lighting, Seoul cityscape visible through window, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A restaurant entrance in Korea with a pet-friendly sticker on the glass door, a small Welcome Pets sign, clean modern interior visible inside, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A person showing a pet vaccination certificate on their smartphone to a restaurant staff member at the entrance, Korean restaurant setting, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 2
CONTENT["대구펫쇼 역대 최대 규모 폐막, 트렌드 분석"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 3월 6일부터 8일까지 대구 엑스코(EXCO)에서 열린 "2026 대구펫쇼"가 역대 최대 규모인 500개 부스, 3일간 누적 관람객 약 12만 명을 기록하며 폐막했습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>올해 대구펫쇼는 전년 대비 부스 수 25% 증가, 관람객 30% 증가를 달성했습니다. '
        '특히 주목할 트렌드는 ①펫 헬스케어(웨어러블 건강 모니터링 기기) ②프리미엄 수제 간식·RAW 사료 ③반려동물 보험·펫상조 서비스 ④AI 기반 펫케어 솔루션입니다. '
        '전시장 내 "펫 힐링존"에서는 반려동물 행동교정 무료 상담이 진행되어 하루 평균 200건 이상의 상담이 이뤄졌습니다. '
        'B2B 상담 실적도 전년 대비 40% 늘어 산업 성장세를 반영했습니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>대구펫쇼의 규모 확대는 반려동물 산업이 수도권을 넘어 지방 대도시로 확산되고 있음을 보여줍니다. '
        '특히 펫테크(Pet-Tech) 분야의 급성장이 두드러지며, 단순 용품 판매에서 건강관리·보험·사후관리까지 산업 영역이 확장되는 추세입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>펫쇼에서 충동 구매한 제품은 반려동물에게 바로 적용하기보다, 수의사 상담 후 사용하는 것이 안전합니다. 특히 새로운 사료나 영양제는 기존 식단과의 호환성을 꼭 확인하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 2026 대구펫쇼가 500부스, 12만 관람객으로 역대 최대 기록을 세웠어요!\n\n"
        "왜 중요할까요?\n\n"
        "대구펫쇼는 반려동물 산업 트렌드를 한눈에 볼 수 있는 대표 전시회예요. "
        "올해 트렌드를 보면 앞으로 어떤 제품과 서비스가 뜰지 알 수 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 500개 부스, 12만 관람객으로 역대 최대 규모였어요\n"
        "- 펫 웨어러블·AI 펫케어 같은 펫테크가 가장 핫했어요\n"
        "- 프리미엄 사료와 반려동물 보험 부스도 크게 늘었어요\n\n"
        "꼭 기억하세요!\n\n"
        "펫쇼에서 새 제품을 구매했다면, 바로 쓰지 말고 수의사 상담 후 사용하는 게 안전해요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "Aerial view of a large pet expo hall in Daegu EXCO convention center, hundreds of colorful booths, crowds of visitors with dogs and cats, bright exhibition lighting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A pet wearable health monitoring device being demonstrated on a golden retriever at a Korean pet expo booth, modern technology display, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A family with a small poodle browsing premium pet food samples at a Korean pet exhibition, colorful product displays, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 3
CONTENT['정부 주도 "맹견 안전관리 캠페인" 본격화'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>농림축산식품부는 2026년 3월부터 "슬기로운 맹견 반려생활" 캠페인을 전국적으로 본격 시행합니다. 맹견 사고 예방과 책임 있는 반려문화 정착을 목표로 하며, 맹견 5종(도사견, 아메리칸 핏불테리어, 아메리칸 스태퍼드셔 테리어, 스태퍼드셔 불 테리어, 로트와일러)과 그 잡종의 관리 강화가 핵심입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>캠페인의 주요 내용은 ①맹견 외출 시 입마개·목줄 의무화 재강조 ②맹견 보유자 대상 의무 교육 프로그램(온라인 3시간) ③맹견 사고 시 보호자 처벌 강화(최대 3년 이하 징역 또는 3,000만 원 이하 벌금) ④지자체별 맹견 등록 현황 전수조사입니다. '
        '농식품부는 TV·SNS 홍보와 함께 전국 동물병원 2,000곳에 캠페인 포스터를 배포할 예정입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>맹견 사고가 매년 증가하는 가운데, 정부 주도 캠페인은 처벌 위주에서 교육·예방 중심으로 정책 방향이 전환되고 있음을 보여줍니다. 맹견 보호자의 인식 제고와 사회적 안전망 강화가 동시에 필요합니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>맹견 보호자는 외출 시 반드시 입마개와 2m 이내 목줄을 착용해야 하며, 미착용 시 과태료 300만 원이 부과됩니다. 맹견 보유 신고를 하지 않은 경우에도 과태료가 부과되니 반드시 등록해주세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 정부가 맹견 안전관리 캠페인을 3월부터 전국적으로 시작해요!\n\n"
        "왜 중요할까요?\n\n"
        "맹견 사고가 늘고 있어서 정부가 직접 나섰어요. 처벌만 강화하는 게 아니라 교육과 예방에 초점을 맞추고 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 맹견 5종과 잡종 대상, 입마개·목줄 의무 재강조해요\n"
        "- 맹견 보호자 의무 교육(온라인 3시간)이 시작돼요\n"
        "- 미준수 시 과태료 300만 원, 사고 시 최대 3년 징역이에요\n\n"
        "꼭 기억하세요!\n\n"
        "맹견 보호자라면 외출 시 입마개와 목줄은 필수! 우리 아이와 이웃 모두의 안전을 위한 거예요."
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A responsible dog owner walking a Rottweiler wearing a proper muzzle and short leash on a Korean city sidewalk, spring weather, safe and controlled atmosphere, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A Korean government official presenting a pet safety campaign poster at a press conference, podium with microphones, professional setting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A veterinarian fitting a comfortable muzzle on a large dog breed while the owner watches attentively in a Korean animal hospital, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 4
CONTENT['보람그룹, 펫상조 라인업 "스카이펫" 대폭 강화'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>보람그룹이 2026년 3월 반려동물 사후관리 서비스 브랜드 "스카이펫"의 라인업을 대폭 강화했습니다. 기존 장례 서비스 중심에서 생애 전반을 아우르는 종합 펫케어 상조로 확장하며, 반려동물 상조 시장 선점에 나섰습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>스카이펫 신규 라인업은 ①기본형(월 1.5만 원, 장례+수목장) ②프리미엄형(월 3만 원, 장례+건강검진 연 1회+추모 서비스) ③VIP형(월 5만 원, 장례+건강검진 연 2회+동반 여행 할인+법률 상담)으로 구성됩니다. '
        '보람그룹은 전국 15개 직영 반려동물 장례식장을 운영 중이며, 2026년 말까지 25개로 확대할 계획입니다. '
        '제휴 동물병원도 현재 300곳에서 연내 500곳으로 늘릴 예정입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>인간 상조 시장의 포화 속에서 펫상조는 새로운 성장 동력으로 주목받고 있습니다. 반려동물 고령화와 "펫 휴머니제이션" 트렌드가 맞물리며 사후관리 시장이 빠르게 확대될 전망입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>펫상조 가입 시 해약 환급률, 서비스 이용 조건, 지역 제한 여부를 꼼꼼히 확인하세요. 공정거래위원회에 등록된 상조 업체인지도 반드시 확인해야 합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 보람그룹이 반려동물 상조 \"스카이펫\" 서비스를 크게 확장했어요!\n\n"
        "왜 중요할까요?\n\n"
        "반려동물도 가족이니까, 마지막까지 잘 보내드리고 싶은 마음은 당연해요. "
        "이제 장례뿐 아니라 건강검진·여행·법률상담까지 한 번에 관리할 수 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 월 1.5만 원부터 5만 원까지 3가지 등급이 있어요\n"
        "- 전국 15개 직영 장례식장, 연내 25개로 확대 예정이에요\n"
        "- 제휴 동물병원 500곳으로 늘어나요\n\n"
        "꼭 기억하세요!\n\n"
        "가입 전 해약 환급률과 공정위 등록 여부를 꼭 확인하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A modern and serene pet memorial facility in Korea with warm wood interior, soft lighting, small flower arrangements, a peaceful atmosphere, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A family consulting with a pet memorial service advisor at a clean modern office desk, brochures on the table, professional Korean business setting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A small memorial garden for pets with tiny headstones and fresh flowers under a cherry blossom tree in spring, Korean landscape, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 5
CONTENT["반려동물 기부부터 의료보험까지, 달라진 반려문화"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 한국의 반려문화가 빠르게 진화하고 있습니다. 단순 양육을 넘어 반려동물 전용 기부 플랫폼, 의료보험, 교육 서비스, 상조까지 인간 복지 시스템에 버금가는 생태계가 형성되고 있습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>주요 변화상은 다음과 같습니다. ①반려동물 기부: 유기동물 후원, 동물병원 진료비 크라우드펀딩 등 연간 기부액이 2025년 대비 45% 증가했습니다. '
        '②의료보험: 삼성화재·KB손해보험 등 주요 보험사가 반려동물 의료보험 상품을 출시하며 가입자 수가 전년 대비 60% 늘었습니다. '
        '③펫 교육: 반려동물 행동교정사, 펫 매니저 등 전문 직종이 확대되고 있습니다. '
        '④법적 지위: 민법 개정 논의가 본격화되며 반려동물을 "물건"이 아닌 "생명"으로 재정의하려는 움직임이 활발합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>반려문화의 고도화는 관련 산업 전반의 성장을 이끌고 있습니다. 특히 보험·금융 분야에서 반려동물 관련 상품이 급증하며, 펫코노미가 단순 소비재를 넘어 금융·서비스업으로 확산되고 있습니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>반려동물 보험 가입 시 면책 기간, 보장 범위(선천성 질환 제외 여부), 갱신 조건을 반드시 비교하세요. 기부 시에도 투명한 사용 내역을 공개하는 단체를 선택하는 것이 중요합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 기부·보험·교육까지, 반려동물 복지가 사람 수준으로 올라가고 있어요!\n\n"
        "왜 중요할까요?\n\n"
        "반려동물을 가족으로 여기는 문화가 자리 잡으면서, 관련 서비스도 빠르게 발전하고 있어요. "
        "이제 우리 아이도 보험 혜택을 받을 수 있는 시대예요.\n\n"
        "핵심 포인트\n\n"
        "- 반려동물 기부액이 전년 대비 45% 늘었어요\n"
        "- 주요 보험사 반려동물 보험 가입자가 60% 증가했어요\n"
        "- 반려동물 법적 지위를 \"생명\"으로 바꾸려는 움직임이 있어요\n\n"
        "꼭 기억하세요!\n\n"
        "보험 가입 시 면책 기간과 보장 범위를 꼼꼼히 비교해보세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A heartwarming scene of volunteers at a Korean animal shelter caring for rescued dogs and cats, donation boxes visible, warm and compassionate atmosphere, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A pet owner reviewing a pet insurance policy document on a tablet while sitting with their dog at a Korean insurance office, modern interior, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A professional pet behaviorist training a dog in a modern Korean pet education center, agility equipment visible, bright and clean space, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 6
CONTENT['오히려 늘어나는 "노펫존", 반려인과 비반려인의 갈등'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>식품위생법 개정으로 반려동물 동반 식당이 허용된 2026년 3월, 역설적으로 "노펫존"을 선언하는 업소가 오히려 증가하고 있습니다. 시행 첫 2주간 서울·경기 지역에서 약 800여 곳이 자발적으로 노펫존을 선언한 것으로 파악됩니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>노펫존 확산의 주요 원인은 ①비반려인 고객의 위생 우려와 항의 ②동물 알레르기 고객 대응 부담 ③반려동물 사고(물림·배변) 발생 시 업주 책임 우려 ④추가 위생 설비 투자 비용 부담입니다. '
        '반려인 측에서는 "합법적 권리를 업소가 거부하는 것은 차별"이라 주장하고, 비반려인 측은 "쾌적한 식사 환경을 선택할 권리"를 강조하며 갈등이 심화되고 있습니다. '
        '법적으로 영업주에게 허용 여부 결정권이 있어 노펫존 자체는 합법입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>법 개정만으로 문화적 갈등이 해소되지 않음을 보여주는 사례입니다. 반려인과 비반려인이 공존할 수 있는 구체적인 가이드라인과 사회적 합의가 필요합니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>노펫존으로 표시된 업소에 반려동물 동반 입장을 강요하는 것은 영업 방해에 해당할 수 있습니다. 방문 전 업소의 펫 허용 여부를 확인하고, 서로의 선택을 존중하는 성숙한 반려문화가 필요합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 반려동물 식당 허용 후 오히려 노펫존이 늘어나고 있어요!\n\n"
        "왜 중요할까요?\n\n"
        "법이 바뀌었다고 모든 식당이 반려동물을 환영하는 건 아니에요. "
        "반려인과 비반려인 사이의 갈등이 커지고 있어서, 서로 배려하는 문화가 중요해요.\n\n"
        "핵심 포인트\n\n"
        "- 서울·경기에서만 800곳 이상이 노펫존을 선언했어요\n"
        "- 위생 우려와 알레르기 문제가 주된 이유예요\n"
        "- 업소에 허용 여부 결정권이 있어서 노펫존은 합법이에요\n\n"
        "꼭 기억하세요!\n\n"
        "방문 전에 펫 허용 여부를 꼭 확인하고, 노펫존도 존중해주세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A Korean cafe storefront with a clear No Pets Allowed sign on the door, a person with a small dog looking at the sign, urban Seoul street scene, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Split view of two Korean restaurants side by side, one pet-friendly with dogs inside and one pet-free with a quiet atmosphere, modern Korean dining, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A pet owner checking their smartphone for pet-friendly restaurants while holding a leash with a small dog on a busy Korean street, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 7
CONTENT["까다로운 예방접종 증명, 모바일 백신앱이 뜬다"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>반려동물 동반 식당 출입 시 예방접종 증명이 의무화되면서, 종이 증명서의 불편함을 해소하는 모바일 백신 인증 앱이 빠르게 부상하고 있습니다. 2026년 3월 기준 관련 앱 다운로드가 전월 대비 300% 이상 급증했습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>현재 시장에서 주목받는 앱은 ①"펫패스"(Pet Pass) — QR코드 기반 접종 이력 관리, 동물병원 직접 연동 ②"마이펫다이어리" — 접종 스케줄 알림 + 증명서 디지털화 ③"동물등록 ON" — 농림부 공식 동물등록 시스템 연동입니다. '
        '이 앱들은 광견병·종합백신(DHPPL)·코로나장염 등 필수 접종 이력을 QR코드로 저장하여, 식당 입구에서 간편하게 인증할 수 있습니다. 일부 앱은 NFC 태그 연동도 지원합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>반려동물 신원 인증의 디지털 전환이 가속화되고 있으며, 향후 동물병원·보험·공공기관과의 데이터 연동이 확대될 전망입니다. 블록체인 기반 위변조 방지 기술 도입도 논의 중입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>모바일 앱의 접종 기록이 모든 식당에서 인정되는 것은 아직 아닙니다. 종이 증명서도 함께 지참하는 것이 안전하며, 앱 선택 시 동물병원 연동 여부와 개인정보 보호 정책을 확인하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 반려동물 예방접종 증명, 이제 스마트폰 앱으로 간편하게 할 수 있어요!\n\n"
        "왜 중요할까요?\n\n"
        "식당에 갈 때마다 종이 증명서를 들고 다니기 번거로웠는데, 모바일 앱으로 QR코드만 보여주면 돼요. "
        "관련 앱 다운로드가 300% 넘게 늘었어요.\n\n"
        "핵심 포인트\n\n"
        "- 펫패스, 마이펫다이어리 등 QR 기반 인증 앱이 인기예요\n"
        "- 접종 스케줄 알림까지 받을 수 있어서 편리해요\n"
        "- 아직 모든 식당에서 인정되진 않으니 종이 증명서도 챙기세요\n\n"
        "꼭 기억하세요!\n\n"
        "앱을 쓰더라도 만약을 위해 종이 증명서는 백업으로 가지고 다니세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A pet owner showing a QR code on their smartphone screen at a Korean restaurant entrance for pet vaccination verification, small dog in a carrier, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A smartphone displaying a pet vaccination record app with colorful health timeline and QR code, veterinary clinic background, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A veterinarian scanning a pet microchip while updating digital records on a tablet in a modern Korean animal hospital, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 8
CONTENT["규정 위반 시 식당 영업정지? 과도한 규제 논란"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>반려동물 동반 음식점 관련 식품위생법 시행규칙에 따라 위생 기준 위반 시 최대 영업정지 처분이 가능하다는 내용이 알려지면서, 외식업계에서 "과도한 규제"라는 반발이 일고 있습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>시행규칙에 따르면 반려동물 동반 허용 업소는 ①전용 구역 구분 ②바닥 방수 처리 ③소독·청소 일지 작성 ④예방접종 미확인 동물 입장 시 과태료 등의 기준을 준수해야 합니다. '
        '1차 위반 시 시정명령, 2차 위반 시 영업정지 7일, 3차 위반 시 영업정지 15일이 가능합니다. '
        '외식업중앙회는 "소규모 식당에 과도한 부담"이라며 유예 기간 연장과 지원금을 요구하고 있으며, 동물보호단체는 "위생 기준은 동물과 사람 모두를 위한 최소한의 안전장치"라고 반박합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>새로운 제도 도입 초기에 규제 수준을 놓고 이해관계자 간 갈등이 발생하는 전형적인 양상입니다. 현장의 목소리를 반영한 단계적 시행과 소상공인 지원 대책이 함께 마련되어야 합니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>펫 동반 허용 식당 운영을 고려하는 업주는 시행규칙 세부 기준을 반드시 확인하고, 관할 보건소에 사전 상담을 받는 것이 좋습니다. 위반 시 영업정지까지 이어질 수 있으므로 준비를 철저히 하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 반려동물 식당 위생 기준 위반 시 영업정지까지 가능해서 논란이에요!\n\n"
        "왜 중요할까요?\n\n"
        "반려동물 동반 식당을 운영하려면 꽤 까다로운 위생 기준을 지켜야 해요. "
        "소규모 식당에겐 부담이 크다는 의견과, 최소한의 안전장치라는 의견이 맞서고 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 위생 기준 위반 시 최대 영업정지 15일까지 가능해요\n"
        "- 외식업계는 소규모 식당에 과도한 부담이라고 해요\n"
        "- 동물보호단체는 사람과 동물 모두를 위한 최소 기준이라고 해요\n\n"
        "꼭 기억하세요!\n\n"
        "식당 운영자라면 관할 보건소에 사전 상담을 꼭 받아보세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A Korean health inspector examining a pet-friendly restaurant kitchen area with a checklist, restaurant owner looking concerned, professional inspection scene, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A small Korean restaurant owner reading regulation documents at their desk looking worried, simple restaurant interior background, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A clean and well-organized pet-friendly zone in a Korean restaurant with separate seating area, floor mats, and sanitizer station, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 9
CONTENT['종이 증명서는 안녕, "반려동물 모바일 예방접종 패스"'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>농림축산식품부와 한국동물보건사협회가 공동 개발한 "반려동물 모바일 예방접종 패스" 시스템이 2026년 3월부터 시범 운영에 들어갔습니다. 코로나19 당시 "COOV" 앱처럼 반려동물의 접종 이력을 QR코드로 관리하는 공적 시스템입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>모바일 접종 패스의 주요 기능은 ①동물등록번호 연동 자동 접종 이력 조회 ②QR코드 기반 즉시 인증 ③접종 만료 알림(30일·7일 전) ④전국 동물병원 접종 기록 실시간 반영입니다. '
        '시범 운영 기간(3~6월)에는 서울·부산·대구 3개 도시 소재 동물병원 500곳에서 먼저 적용됩니다. '
        '식당·카페 등에서의 인증은 업주가 전용 단말기 또는 스마트폰 앱으로 QR코드를 스캔하는 방식입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>공적 디지털 인증 체계의 도입은 반려동물 관련 행정의 디지털 전환을 상징합니다. 성공적 안착 시 동물등록·보험·입양 등 다양한 분야로 확장될 수 있습니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>시범 운영 기간에는 서울·부산·대구만 해당되므로, 다른 지역에서는 기존 종이 증명서가 필요합니다. 앱 이용 시 동물등록이 선행되어야 하니 미등록 반려동물은 먼저 등록을 완료하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 정부가 만든 반려동물 모바일 예방접종 패스가 3월부터 시작돼요!\n\n"
        "왜 중요할까요?\n\n"
        "코로나 때 COOV 앱 기억나시죠? 이제 반려동물 접종 증명도 똑같이 QR코드로 할 수 있어요. "
        "종이 증명서를 매번 챙기는 불편함이 사라져요.\n\n"
        "핵심 포인트\n\n"
        "- 동물등록번호로 접종 이력이 자동 연동돼요\n"
        "- QR코드로 식당 입구에서 바로 인증할 수 있어요\n"
        "- 시범 운영은 서울·부산·대구 500개 동물병원부터 시작해요\n\n"
        "꼭 기억하세요!\n\n"
        "이 서비스를 이용하려면 동물등록이 먼저 되어 있어야 해요! 미등록이라면 지금 바로 등록하세요."
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A person holding a smartphone showing a digital pet vaccination pass with a QR code, a happy dog beside them at a Korean cafe entrance, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A veterinarian updating a pet vaccination record on a digital tablet system connected to a government database in a Korean animal clinic, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A cafe staff member scanning a QR code from a customer smartphone for pet entry verification, small dog in the customer arms, Korean cafe setting, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 10
CONTENT['동반 식당을 위한 반려동물 전용 체어 "초코린"'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>일본 오사카의 펫 가구 브랜드 "초코린(Chocolin)"이 한국 시장에 진출하며, 반려동물 동반 식당용 전용 펫 체어를 출시했습니다. 식품위생법 개정에 맞춰 한국 식당 환경에 최적화된 제품으로, 3월 출시 첫 주 만에 사전 예약 3,000건을 돌파했습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>초코린 펫 체어의 주요 특징은 ①항균 방수 소재(PU 가죽 + 항균 코팅) ②10kg 이하 소형견·고양이 전용 ③식탁 높이 조절 클램프로 테이블에 고정 ④세척 가능한 분리형 쿠션 ⑤접이식 구조로 보관 용이입니다. '
        '가격은 기본형 8만 9천 원, 프리미엄형(온열 기능) 14만 9천 원입니다. '
        '국내 공식 유통은 쿠팡·네이버 스마트스토어를 통해 이뤄지며, B2B 식당 대량 구매 시 30% 할인을 제공합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>반려동물 동반 외식 시장의 성장과 함께 관련 용품 시장도 빠르게 형성되고 있습니다. 식당 인테리어와 어우러지는 디자인 펫 가구가 새로운 카테고리로 떠오르고 있습니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>체중 제한(10kg 이하)을 반드시 확인하세요. 중·대형견은 사용할 수 없으며, 반려동물이 체어에 적응할 때까지 보호자가 옆에서 지켜봐야 합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 일본 브랜드 \"초코린\"이 식당용 반려동물 전용 의자를 한국에 출시했어요!\n\n"
        "왜 중요할까요?\n\n"
        "식당에서 반려동물을 무릎에 앉히거나 바닥에 두기 곤란했는데, 전용 의자가 나왔어요. "
        "항균 방수 소재라 위생적이고 식탁에 고정할 수 있어서 편리해요.\n\n"
        "핵심 포인트\n\n"
        "- 항균 방수 소재, 10kg 이하 소형 반려동물 전용이에요\n"
        "- 기본형 8만 9천 원, 온열 기능 프리미엄 14만 9천 원이에요\n"
        "- 사전 예약 3,000건 돌파! 쿠팡·네이버에서 구매 가능해요\n\n"
        "꼭 기억하세요!\n\n"
        "10kg 초과 반려동물은 사용할 수 없으니 체중을 꼭 확인하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A small white poodle sitting comfortably in a stylish pet chair attached to a restaurant dining table, modern Korean restaurant interior, warm lighting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Close-up of a premium pet chair with antibacterial waterproof PU leather cushion and table clamp mechanism, product photography style, clean white background, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A couple enjoying dinner at a Korean restaurant with their small cat sitting in a pet chair beside them, cozy restaurant atmosphere, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 11
CONTENT["3월 1일부터 반려동물 동반 음식점 출입 허용 — 식품위생법 개정"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 3월 1일, 개정 식품위생법이 시행되면서 위생 기준을 충족한 음식점에서 반려동물 동반 출입이 공식 허용되었습니다. 기존에는 식품접객업소 내 동물 출입이 원칙적으로 금지되어 있었으나, 반려인구 1,500만 시대를 맞아 제도적 변화가 이루어졌습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>개정법의 핵심 사항은 다음과 같습니다. ①허용 대상: 영업주가 자발적으로 신청한 음식점(강제 아님) ②위생 요건: 반려동물 전용 구역 지정, 바닥 방수·소독 처리, 청소 일지 비치 ③반려동물 조건: 예방접종 완료 증명, 체중 10kg 초과 시 입마개 착용 ④과태료: 기준 미준수 시 업주에게 1차 시정명령, 이후 과태료 50~300만 원입니다. '
        '식약처는 전국 지자체에 매뉴얼을 배포하고 3월 한 달간 집중 점검을 실시합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>이번 개정은 한국이 반려동물 선진국으로 나아가는 중요한 이정표입니다. 다만 업주의 자발적 참여에 기반하므로, 실질적 확산까지는 시간이 필요할 전망입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>모든 음식점이 동반을 허용하는 것은 아닙니다. 반드시 방문 전 펫 허용 여부를 확인하고, 예방접종 증명서를 지참하세요. 반려동물의 식당 내 행동 관리는 보호자의 책임입니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 3월 1일부터 식품위생법이 바뀌어서 반려동물과 식당에 갈 수 있게 됐어요!\n\n"
        "왜 중요할까요?\n\n"
        "예전에는 법적으로 식당에 동물을 데려갈 수 없었는데, 이제 위생 기준을 갖춘 식당이면 OK예요. "
        "반려인 1,500만 시대에 맞는 제도 변화예요.\n\n"
        "핵심 포인트\n\n"
        "- 영업주가 자발적으로 신청한 식당에서만 가능해요\n"
        "- 예방접종 증명서와 10kg 초과 시 입마개가 필수예요\n"
        "- 기준 위반 시 업주에게 최대 300만 원 과태료가 부과돼요\n\n"
        "꼭 기억하세요!\n\n"
        "방문 전 해당 식당이 펫 동반을 허용하는지 꼭 확인하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "Official ceremony of a Korean Food Safety law amendment with government officials at a podium, pet-friendly restaurant policy announcement, formal setting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "An infographic-style layout showing a Korean restaurant with clearly marked pet zone and human-only zone, floor plan perspective, modern restaurant design, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A family happily entering a pet-friendly Korean restaurant with their leashed dog, pet-friendly welcome sign visible on the door, spring day, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 12
CONTENT['"노펫존" 선언하는 카페·식당들 — 반려동물 허용 반대 움직임도'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>식품위생법 개정 시행 이후, 일부 카페와 식당이 "노펫존(No-Pet Zone)"을 적극 선언하며 반려동물 허용에 반대하는 움직임이 가시화되고 있습니다. 이들은 자체 SNS와 매장 입구에 노펫존 스티커를 부착하며 비반려인 고객 중심 운영을 선언하고 있습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>노펫존 선언 업소들의 주요 근거는 ①기존 단골 고객(비반려인)의 이탈 우려 ②동물 털·냄새로 인한 위생 민원 증가 ③반려동물 사고(물림·소음) 발생 시 법적 책임 모호 ④추가 위생 설비 비용(평균 200~500만 원 추정)입니다. '
        'SNS에서는 #노펫존카페 해시태그가 빠르게 확산되며, 비반려인 고객들의 지지를 받고 있습니다. '
        '반면 반려인 커뮤니티에서는 해당 업소에 대한 불매 움직임도 나타나고 있어 갈등이 심화되는 양상입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>법적 허용과 사회적 수용은 다른 문제임을 보여주는 현상입니다. 업소별 자율 선택권을 존중하면서도 사회 전체적인 반려문화 성숙이 병행되어야 합니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>노펫존 업소에 대한 악성 리뷰나 불매 운동은 오히려 갈등을 악화시킬 수 있습니다. 업소의 선택을 존중하고, 펫 프렌들리 업소를 찾아 긍정적인 경험을 만들어가는 것이 바람직합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 법이 바뀌었지만 노펫존을 선언하는 카페·식당이 늘어나고 있어요!\n\n"
        "왜 중요할까요?\n\n"
        "반려동물 동반이 허용됐다고 모든 곳이 환영하는 건 아니에요. "
        "업소마다 사정이 다르고, 비반려인 고객도 배려해야 하니까요.\n\n"
        "핵심 포인트\n\n"
        "- SNS에서 #노펫존카페 해시태그가 빠르게 퍼지고 있어요\n"
        "- 위생 설비 비용 200~500만 원이 소규모 업소에겐 부담이에요\n"
        "- 업소의 노펫존 선택은 법적으로 문제 없어요\n\n"
        "꼭 기억하세요!\n\n"
        "노펫존도 업소의 정당한 선택이에요. 악성 리뷰보다는 펫 프렌들리 업소를 응원하는 게 더 좋아요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A stylish Korean cafe with a visible No Pets Zone sticker on the entrance door, customers enjoying coffee inside without pets, clean minimalist interior, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A Korean cafe owner placing a No Pets sticker on their store window, thoughtful expression, small independent cafe exterior in Seoul, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "Two friends having a conversation at a quiet Korean cafe, peaceful atmosphere without pets, modern Korean cafe interior with plants, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 13
CONTENT['98개 동물단체, 반려동물 부처 이관 촉구 — "가축인가 가족인가"'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 3월, 전국 98개 동물보호단체가 연합하여 반려동물 관할 부처를 농림축산식품부에서 별도의 "반려동물복지처(가칭)"로 이관할 것을 정부에 촉구했습니다. 핵심 논점은 "반려동물이 가축으로 관리되는 현 체계의 부적절함"입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>단체들의 주요 주장은 ①농식품부는 축산업 진흥이 본업이므로 반려동물 복지와 이해충돌 ②동물보호법과 축산법이 같은 부처 소관으로 정책 모순 발생 ③선진국 사례(독일 연방식품농업부 산하 동물복지국 독립, 영국 DEFRA 내 동물복지팀 강화) ④반려인구 1,500만 시대에 맞는 전담 조직 필요입니다. '
        '정부 측은 "조직 개편은 중장기 검토 사항"이라며 즉각적 이관에는 신중한 입장을 보이고 있습니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>반려동물의 법적·행정적 지위 재정립은 단순 부처 이관을 넘어, 한국 사회에서 동물의 위상 변화를 반영합니다. 장기적으로 반려동물 전담 조직 설립은 불가피한 흐름으로 보입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>부처 이관은 예산·인력·법률 개정 등 복잡한 과정이 필요하므로 단기간에 이루어지기 어렵습니다. 국민 의견 수렴과 전문가 논의가 충분히 이루어져야 합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 98개 동물단체가 \"반려동물은 가축이 아니라 가족\"이라며 담당 부처 변경을 촉구했어요!\n\n"
        "왜 중요할까요?\n\n"
        "지금은 농림축산식품부가 반려동물을 관리하는데, 이 부처의 본업은 축산업이에요. "
        "가족 같은 반려동물을 가축과 같은 부서에서 관리하는 게 맞나 하는 문제예요.\n\n"
        "핵심 포인트\n\n"
        "- 98개 동물보호단체가 연합해서 부처 이관을 요구했어요\n"
        "- 독일·영국 등은 이미 동물복지 전담 조직이 있어요\n"
        "- 정부는 \"중장기 검토 사항\"이라며 신중한 입장이에요\n\n"
        "꼭 기억하세요!\n\n"
        "반려동물 정책의 미래를 위해 관심을 가져주세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A large group of animal welfare activists rallying in front of a Korean government building with banners about pet welfare reform, peaceful protest, spring day, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A comparison scene showing a farm with livestock on one side and a loving family with a pet dog on the other, Korean setting, symbolic contrast, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A person hugging their pet dog lovingly in a Korean apartment living room, warm natural light, emotional family moment, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 14
CONTENT["국무2차장 주재 반려동물 정책 간담회 — 정부 차원 현안 논의"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 3월, 국무조정실 국무2차장 주재로 "반려동물 정책 간담회"가 개최되었습니다. 농식품부·환경부·식약처·행안부 등 관련 부처와 동물보호단체, 수의사회, 외식업계 대표가 참석하여 반려동물 정책 현안을 종합 논의했습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>간담회 주요 의제는 ①식품위생법 개정 시행 후 현장 애로사항 ②반려동물 등록률 제고 방안 ③맹견 관리 강화 대책 ④동물보호법 개정 방향 ⑤반려동물 관련 부처 간 협업 체계 구축입니다. '
        '참석자들은 동물등록 의무화 실효성 강화, 반려동물 진료비 부담 완화, 유기동물 발생 억제를 위한 중성화 지원 확대 등을 건의했습니다. '
        '국무2차장은 "부처 간 칸막이를 없애고 통합적 정책 추진을 하겠다"고 밝혔습니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>반려동물 정책이 단일 부처를 넘어 정부 차원의 종합 현안으로 격상되었음을 보여주는 의미 있는 행사입니다. 향후 범부처 협업 체계의 실질적 운영이 관건입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>정책 간담회의 논의 결과가 실제 정책에 반영되기까지는 시간이 필요합니다. 관심을 지속하고 국민 의견 제출 채널(국민청원 등)을 적극 활용하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 정부 고위급이 나서서 반려동물 정책을 종합적으로 논의했어요!\n\n"
        "왜 중요할까요?\n\n"
        "국무2차장이 직접 주재한다는 건 반려동물 정책이 정부의 중요 현안이 됐다는 뜻이에요. "
        "여러 부처가 함께 모여 해결책을 찾고 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 농식품부·환경부·식약처 등 관련 부처가 모두 참석했어요\n"
        "- 동물등록 강화, 진료비 완화, 유기동물 대책 등이 논의됐어요\n"
        "- \"부처 간 칸막이를 없애겠다\"는 약속이 나왔어요\n\n"
        "꼭 기억하세요!\n\n"
        "좋은 정책이 나오려면 국민의 관심과 참여가 중요해요! 국민청원 등을 활용해보세요."
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A high-level Korean government policy meeting in a formal conference room with officials and animal welfare experts seated around a large table, professional setting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Multiple Korean government ministry representatives discussing documents at a policy roundtable, name plates visible, formal atmosphere, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A veterinarian and a pet owner shaking hands at a Korean animal hospital, symbolizing improved pet healthcare policy, warm and hopeful atmosphere, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 15
CONTENT["부정확한 동물등록률 — 정부 조사에서도 차이 확인"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 3월 정부 내부 조사에서 국내 동물등록률 통계의 부정확성이 공식 확인되었습니다. 농림축산식품부 발표 등록률(약 78%)과 실제 현장 조사 결과(약 55~60%) 사이에 상당한 괴리가 있는 것으로 나타났습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>괴리의 주요 원인은 ①사망·분실 후 말소 처리 미비(등록 후 미갱신) ②중복 등록(이전 보호자와 현 보호자 모두 등록) ③고양이 등록 사각지대(의무 등록 대상 미포함) ④농촌 지역 등록률 저조(도시 70% vs 농촌 35% 추정)입니다. '
        '정부는 이번 조사를 바탕으로 동물등록 시스템 전면 개편을 추진할 계획이며, ①연 1회 등록 정보 갱신 의무화 ②고양이 등록 단계적 의무화 ③RFID 마이크로칩 표준화를 핵심 과제로 제시했습니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>정확한 동물등록 데이터는 유기동물 추적, 질병 관리, 정책 수립의 기반입니다. 데이터의 정확성 없이는 효과적인 동물복지 정책 수립이 어렵다는 점에서 시스템 개편의 시급성이 부각됩니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>반려동물 보호자는 등록 정보(보호자 연락처, 주소 등)가 변경되면 반드시 갱신해야 합니다. 미등록 반려동물은 분실 시 찾기 어렵고, 과태료(최대 100만 원) 대상이 될 수 있습니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 정부가 발표한 동물등록률과 실제가 20% 넘게 차이 나요!\n\n"
        "왜 중요할까요?\n\n"
        "동물등록은 유기동물을 줄이고 분실 시 찾을 수 있는 기본이에요. "
        "그런데 통계가 부정확하면 좋은 정책을 만들기 어렵잖아요.\n\n"
        "핵심 포인트\n\n"
        "- 공식 등록률 78%지만 실제는 55~60% 수준이에요\n"
        "- 사망 후 미삭제, 중복 등록이 주요 원인이에요\n"
        "- 연 1회 등록 갱신 의무화와 고양이 등록 확대가 추진돼요\n\n"
        "꼭 기억하세요!\n\n"
        "주소나 연락처가 바뀌면 동물등록 정보도 꼭 업데이트하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A veterinarian scanning a pet microchip on a dog's neck with an RFID reader in a Korean animal hospital, concerned expression looking at the screen, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A Korean government official presenting animal registration statistics on a screen showing discrepancy between reported and actual numbers, conference room setting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A pet owner registering their new puppy at a Korean district office counter, filling out registration forms, friendly government office atmosphere, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 16
CONTENT["서울시 동물병원 진료비 지원 — 2026년 3월~12월"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>서울시가 2026년 3월부터 12월까지 반려동물 진료비 지원 사업을 시행합니다. 저소득층 및 취약계층 반려인을 대상으로 연간 최대 30만 원의 동물병원 진료비를 지원하는 정책으로, 반려동물 의료 접근성 향상을 목표로 합니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>지원 대상은 ①기초생활수급자 ②차상위계층 ③65세 이상 독거노인 중 반려동물 등록을 완료한 서울시 거주자입니다. '
        '지원 항목은 예방접종, 중성화 수술, 기본 건강검진, 응급 진료이며, 미용·호텔링 등은 제외됩니다. '
        '신청은 서울시 동물보호 포털 또는 주민센터에서 가능하며, 선착순이 아닌 자격 심사 방식입니다. '
        '서울시는 이 사업에 총 50억 원의 예산을 배정했으며, 약 1만 7천 가구가 혜택을 받을 것으로 예상합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>지자체 차원의 반려동물 복지 정책이 구체화되고 있습니다. 반려동물 진료비 부담은 유기 원인 중 하나이므로, 이 같은 지원이 유기동물 감소에도 긍정적 영향을 미칠 수 있습니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>지원을 받으려면 동물등록이 필수이며, 서울시 소재 등록 동물병원에서만 사용 가능합니다. 예산 소진 시 조기 종료될 수 있으니 해당되시면 빨리 신청하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 서울시가 저소득층 반려인에게 연간 최대 30만 원 진료비를 지원해요!\n\n"
        "왜 중요할까요?\n\n"
        "동물병원비 부담 때문에 치료를 미루거나 포기하는 분들이 있어요. "
        "서울시가 취약계층 반려인을 위해 50억 원 예산을 배정했어요.\n\n"
        "핵심 포인트\n\n"
        "- 기초수급자·차상위·65세 이상 독거노인이 대상이에요\n"
        "- 예방접종·중성화·건강검진·응급 진료를 지원해요\n"
        "- 서울시 동물보호 포털이나 주민센터에서 신청해요\n\n"
        "꼭 기억하세요!\n\n"
        "동물등록이 되어 있어야 신청할 수 있으니 미리 확인하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "An elderly Korean person holding their small dog at a veterinary clinic reception desk, warm and caring atmosphere, modern Korean animal hospital, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A Seoul city government welfare office with a banner about pet medical expense support program, Korean public office interior, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A veterinarian examining a cat while a grateful elderly owner watches in a clean Korean animal hospital, warm lighting, compassionate scene, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 17
CONTENT["2026 펫 휴머니제이션 — 반려동물이 가족 구성원으로 편입"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>2026년 "펫 휴머니제이션(Pet Humanization)" 트렌드가 한국에서 본격적으로 자리잡고 있습니다. 반려동물을 단순한 동반자가 아닌 가족 구성원으로 대우하는 문화가 확산되며, 관련 산업과 제도가 빠르게 변화하고 있습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>펫 휴머니제이션의 주요 양상은 ①식품: 사람 식품 수준의 프리미엄 사료·간식 시장 성장(전년 대비 25% 증가) ②의료: 반려동물 CT·MRI 등 고급 의료 서비스 확대 ③금융: 반려동물 보험·신탁·상조 상품 다양화 ④법률: 반려동물 양육권 분쟁 소송 증가(이혼 시 반려동물 양육권) ⑤문화: 반려동물 생일파티·돌잔치 서비스 등장입니다. '
        '한국농촌경제연구원에 따르면 2026년 국내 펫코노미 시장 규모는 약 7조 원에 달할 것으로 전망됩니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>펫 휴머니제이션은 저출산·1인 가구 증가와 맞물린 구조적 현상으로, 단기 트렌드가 아닌 장기적 사회 변화입니다. 기업과 정부 모두 이에 맞는 전략적 대응이 필요합니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>반려동물의 인간화가 과도해지면 동물 복지에 오히려 해로울 수 있습니다. 반려동물의 종 특이적 욕구(충분한 산책, 적절한 사회화 등)를 존중하는 것이 진정한 가족 대우입니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 반려동물이 진짜 가족처럼 대우받는 \"펫 휴머니제이션\" 시대가 왔어요!\n\n"
        "왜 중요할까요?\n\n"
        "이제 반려동물도 보험 가입하고, 생일파티 하고, 이혼할 때 양육권 다투는 시대예요. "
        "펫코노미 시장이 7조 원까지 커질 전망이에요.\n\n"
        "핵심 포인트\n\n"
        "- 프리미엄 사료 시장이 전년 대비 25% 성장했어요\n"
        "- CT·MRI 같은 고급 의료 서비스도 확대되고 있어요\n"
        "- 이혼 시 반려동물 양육권 소송이 늘고 있어요\n\n"
        "꼭 기억하세요!\n\n"
        "진정한 가족 대우는 우리 아이의 종 특성을 존중하는 거예요. 충분한 산책과 사회화를 잊지 마세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A Korean family celebrating their pet dog birthday with a small cake and party decorations in a modern apartment, warm and joyful atmosphere, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A veterinary hospital performing advanced imaging CT scan on a pet dog, modern high-tech Korean veterinary facility, professional medical equipment, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A person shopping for premium organic pet food at a high-end Korean pet store, beautifully displayed products, upscale retail environment, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 18
CONTENT["보람그룹, 반려동물 동반 여행상품 론칭 — 펫상조 라인업 강화"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>보람그룹이 반려동물 상조 브랜드 "스카이펫"의 서비스 확장으로 반려동물 동반 여행상품을 2026년 3월 론칭했습니다. 상조 회원 전용 혜택으로, 국내 주요 펫 프렌들리 리조트·호텔과 제휴한 패키지 상품입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>여행상품 라인업은 ①"펫캉스 베이직"(1박 2일, 강원도·제주 리조트, 15만 원~) ②"펫캉스 프리미엄"(2박 3일, 5성급 호텔+펫 스파, 35만 원~) ③"펫 글램핑"(1박, 경기·충청 글램핑장, 12만 원~)입니다. '
        '모든 상품에 반려동물 여행 보험(여행 중 사고·질병 보장), 전용 차량 이동 서비스, 펫시터 옵션이 포함됩니다. '
        '스카이펫 상조 회원은 10~20% 추가 할인을 받을 수 있으며, 비회원도 일반가로 이용 가능합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>펫상조 서비스가 사후관리를 넘어 생애 전반의 라이프스타일 서비스로 확장되는 모습입니다. 반려동물 동반 여행 시장은 연 20% 이상 성장하는 블루오션으로 주목받고 있습니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>반려동물 동반 여행 시 차량 멀미 대비, 여행지 동물병원 위치 확인, 숙소의 반려동물 규정(크기 제한·추가 요금 등)을 사전에 꼼꼼히 체크하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 보람그룹이 반려동물과 함께 떠나는 여행상품을 새로 출시했어요!\n\n"
        "왜 중요할까요?\n\n"
        "반려동물 때문에 여행을 포기했던 분들에게 희소식이에요. "
        "전용 차량, 여행 보험, 펫시터까지 포함된 패키지라 편하게 떠날 수 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 강원도·제주·글램핑 등 다양한 코스가 12만 원부터 있어요\n"
        "- 여행 중 반려동물 보험이 기본 포함돼요\n"
        "- 스카이펫 상조 회원은 10~20% 추가 할인이에요\n\n"
        "꼭 기억하세요!\n\n"
        "여행 전에 숙소의 반려동물 규정과 가까운 동물병원 위치를 꼭 확인하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A happy Korean couple with their golden retriever arriving at a luxury pet-friendly resort in Jeju Island, beautiful ocean view, sunny spring day, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A luxury glamping tent interior with pet bed and toys, mountain view through the tent opening, Korean countryside glamping site, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A dog enjoying a pet spa treatment at a Korean resort, professional groomer washing the dog, relaxing spa atmosphere, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 19
CONTENT['"예방접종 증명하라니" — 반려동물 식당 진입장벽 논란'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>식품위생법 개정으로 반려동물 동반 식당 출입이 허용되었으나, 예방접종 증명 의무화를 둘러싸고 반려인 사이에서도 찬반 논란이 뜨겁습니다. 일부는 "합리적 안전장치"라고 보는 반면, 다른 일부는 "불필요한 진입장벽"이라고 비판합니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>반대 측 주장은 ①종이 증명서 발급의 번거로움 ②접종 시기가 지난 경우 재접종까지 외식 불가 ③고령 반려동물의 경우 접종 부담(면역 저하 상태에서의 접종 위험) ④증명서 위변조 가능성입니다. '
        '찬성 측은 ①공공 위생 확보를 위한 최소 요건 ②광견병 등 인수공통감염병 예방 ③반려동물 건강관리 유인 효과 ④비반려인의 안심을 위한 사회적 합의를 강조합니다. '
        '정부는 모바일 접종 패스 도입으로 증명 절차를 간소화하고, 고령 동물에 대한 수의사 진단서 대체 방안을 검토 중입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>새로운 권리에는 그에 상응하는 책임이 따릅니다. 예방접종 증명은 반려인의 책임 의식을 높이고 공중보건을 지키는 균형점을 찾는 과정입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>예방접종이 만료된 경우 가까운 동물병원에서 갱신 접종을 받으세요. 고령 반려동물은 수의사와 상의하여 접종 가능 여부를 먼저 확인하는 것이 중요합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 식당 갈 때 예방접종 증명이 필수인데, 반려인 사이에서도 의견이 갈려요!\n\n"
        "왜 중요할까요?\n\n"
        "식당 동반 허용은 좋지만, 매번 접종 증명서를 챙기는 게 번거롭다는 분도 있고, "
        "안전을 위해 당연하다는 분도 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 종이 증명서가 번거롭다는 불만이 많아요\n"
        "- 고령 반려동물은 접종 자체가 부담될 수 있어요\n"
        "- 정부가 모바일 접종 패스로 절차를 간소화할 예정이에요\n\n"
        "꼭 기억하세요!\n\n"
        "예방접종은 우리 아이 건강을 위해서도 중요해요. 만료됐다면 병원 방문부터 하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A frustrated pet owner looking at expired vaccination paperwork while their dog waits beside them outside a Korean restaurant, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A veterinarian administering a vaccination to a dog while explaining the certificate process to the owner in a Korean animal clinic, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "An elderly Korean person gently holding their senior dog at a veterinary clinic, discussing vaccination options with the vet, compassionate scene, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 20
CONTENT["동물 유래 사료원료 관리체계 공백 논란 — ASF 감염 위험"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>동물 유래 사료원료의 관리체계 공백이 아프리카돼지열병(ASF) 감염 위험을 높일 수 있다는 논란이 2026년 3월 불거졌습니다. 반려동물 사료에 사용되는 동물성 원료(돈골분, 혈분 등)에 대한 위생 관리 기준이 미비하다는 지적입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>논란의 핵심은 ①사료관리법상 동물 유래 원료의 열처리 기준이 ASF 바이러스 불활화에 불충분할 수 있다는 전문가 지적 ②수입 원료에 대한 원산지·처리 과정 추적 시스템 부재 ③소규모 사료 제조업체의 위생 관리 사각지대 ④ASF 바이러스가 가공 식품에서 최대 수개월 생존 가능하다는 연구 결과입니다. '
        '농식품부는 "현행 기준으로 충분히 안전하다"는 입장이나, 학계와 시민단체는 "예방적 관점에서 기준 강화가 필요하다"고 반박하고 있습니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>ASF는 돼지에게는 치명적이지만 사람과 반려동물에게는 감염되지 않습니다. 다만 오염된 사료가 양돈 농가로 유입될 경우 축산업 전체에 심각한 피해를 줄 수 있어 관리 강화가 필요합니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>반려동물 사료 구매 시 HACCP 인증 여부와 원료 원산지를 확인하세요. 출처 불명의 저가 사료나 수제 간식은 피하고, 검증된 브랜드 제품을 선택하는 것이 안전합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 반려동물 사료에 쓰이는 동물성 원료 관리가 허술해서 논란이에요!\n\n"
        "왜 중요할까요?\n\n"
        "아프리카돼지열병(ASF) 바이러스가 사료 원료를 통해 퍼질 수 있다는 우려가 나왔어요. "
        "ASF는 반려동물에겐 안전하지만, 축산업 전체에 영향을 미쳐요.\n\n"
        "핵심 포인트\n\n"
        "- 동물성 사료원료의 열처리·추적 기준이 부족해요\n"
        "- 소규모 제조업체 관리에 사각지대가 있어요\n"
        "- ASF는 사람·반려동물에겐 감염 안 되지만 돼지에겐 치명적이에요\n\n"
        "꼭 기억하세요!\n\n"
        "사료 살 때 HACCP 인증과 원료 원산지를 꼭 확인하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A quality control inspector examining pet food ingredients at a Korean pet food manufacturing facility, wearing protective gear, laboratory setting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Raw animal-derived pet food ingredients being processed in a clean food manufacturing line, Korean factory setting, industrial equipment, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A pet owner carefully reading the ingredient label on a bag of premium dog food at a Korean pet store, magnifying the label, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 21
CONTENT["슬기로운 맹견 반려생활 — 농식품부 캠페인 시작"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>농림축산식품부가 2026년 3월 "슬기로운 맹견 반려생활" 캠페인을 공식 시작했습니다. 맹견으로 인한 안전사고를 예방하고, 맹견 보호자의 책임 의식을 높이기 위한 범국민 캠페인입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>캠페인의 세부 프로그램은 ①TV·유튜브 공익광고 송출(3~5월, 30초 스팟) ②전국 동물병원 2,000곳 포스터·리플렛 배포 ③맹견 보호자 의무 교육(온라인 3시간, 행동 교정 기초) ④지역 맹견 안전 점검의 날(매월 셋째 주 토요일) ⑤맹견 산책 매너 실천 챌린지(SNS 인증 이벤트)입니다. '
        '맹견 보호자가 의무 교육을 이수하지 않으면 과태료 300만 원이 부과되며, 사고 발생 시 가중 처벌됩니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>처벌 강화만으로는 맹견 사고를 근본적으로 줄일 수 없습니다. 교육과 인식 개선을 병행하는 이번 캠페인은 올바른 방향이며, 지속적인 실행이 관건입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>맹견 보호자는 반드시 의무 교육을 이수하세요. 외출 시 입마개·목줄은 선택이 아닌 법적 의무입니다. 우리 모두의 안전을 위한 최소한의 규칙을 지켜주세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 농식품부가 \"슬기로운 맹견 반려생활\" 캠페인을 시작했어요!\n\n"
        "왜 중요할까요?\n\n"
        "맹견 사고가 늘어나면서 맹견 자체를 키우지 못하게 하자는 극단적 의견도 나오고 있어요. "
        "이 캠페인은 처벌 대신 교육으로 해결하려는 시도예요.\n\n"
        "핵심 포인트\n\n"
        "- TV·유튜브·동물병원 등 다양한 채널로 홍보해요\n"
        "- 맹견 보호자 의무 교육(온라인 3시간)을 꼭 이수해야 해요\n"
        "- 미이수 시 과태료 300만 원이 부과돼요\n\n"
        "꼭 기억하세요!\n\n"
        "맹견 보호자의 책임감이 우리 아이와 이웃 모두를 지켜요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A responsible dog owner walking a large breed dog with proper muzzle and short leash in a Korean park, other people walking safely nearby, spring scenery, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A Korean government campaign poster being displayed at a veterinary clinic waiting room, pet owners looking at the information board, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A dog trainer conducting a group obedience class for large breed dogs and their owners in a Korean training facility, professional setting, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 22
CONTENT["강아지 토하는 이유 5가지 — 장폐색 위험 신호 총정리"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>강아지 구토는 반려인이 가장 흔하게 마주하는 증상 중 하나입니다. 대부분은 경미한 원인이지만, 장폐색 등 생명을 위협하는 응급 상황의 신호일 수 있어 정확한 판단이 중요합니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p><strong>강아지가 토하는 주요 원인 5가지:</strong></p>'
        '<p>①<strong>과식·급식 속도 과다:</strong> 한꺼번에 많이 먹거나 너무 빨리 먹을 때 발생합니다. 소화되지 않은 사료가 그대로 나오는 "역류"에 가깝습니다.</p>'
        '<p>②<strong>식이 부적합·알레르기:</strong> 새로운 사료 전환, 사람 음식 섭취, 식품 알레르기로 위장이 자극받아 구토합니다.</p>'
        '<p>③<strong>이물질 섭취(장폐색 위험):</strong> 장난감 조각, 뼈, 양말 등을 삼켰을 때 발생하며, 장폐색으로 이어지면 수술이 필요한 응급 상황입니다.</p>'
        '<p>④<strong>감염성 질환:</strong> 파보바이러스, 코로나바이러스 장염 등 감염성 질환의 초기 증상으로 구토가 나타납니다.</p>'
        '<p>⑤<strong>췌장염·간질환:</strong> 만성 구토가 반복될 경우 췌장염, 간질환, 신장질환 등 내부 장기 문제를 의심해야 합니다.</p>'
        '<p><strong>🚨 장폐색 위험 신호:</strong> 반복적 구토 + 식욕 완전 소실 + 배변 없음 + 복부 통증(만지면 움츠림) + 탈수 증상(잇몸 건조)이 동시에 나타나면 즉시 응급 동물병원을 방문하세요.</p>'
        '<h3>💡 시사점</h3>'
        '<p>구토 횟수, 색깔, 내용물을 관찰하여 기록해두면 수의사 진단에 큰 도움이 됩니다. 단순 구토와 응급 상황을 구분할 수 있는 보호자의 관찰력이 반려동물의 생명을 살릴 수 있습니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>24시간 내 3회 이상 구토, 혈액 섞인 구토, 이물질 섭취가 의심될 때는 가정 치료를 시도하지 말고 즉시 동물병원을 방문하세요. 구토 후 바로 물이나 사료를 주면 증상이 악화될 수 있으니 2~4시간 금식 후 소량씩 급여하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 강아지 구토 원인 5가지와 장폐색 위험 신호를 알아봐요!\n\n"
        "왜 중요할까요?\n\n"
        "강아지가 토하면 걱정되지만, 대부분은 가벼운 원인이에요. "
        "하지만 장폐색 같은 위험한 경우도 있으니 구분할 줄 알아야 해요.\n\n"
        "핵심 포인트\n\n"
        "- 과식, 알레르기, 이물질 섭취, 감염, 장기 질환이 주요 원인이에요\n"
        "- 반복 구토 + 식욕 없음 + 배변 없음이면 장폐색 의심이에요\n"
        "- 하루 3번 이상 토하거나 피가 섞이면 바로 병원 가세요\n\n"
        "꼭 기억하세요!\n\n"
        "구토 후 바로 밥이나 물을 주지 마세요! 2~4시간 금식 후 조금씩 주는 게 좋아요."
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A concerned pet owner kneeling beside their sick puppy at a Korean veterinary emergency room, veterinarian examining the dog, urgent but caring atmosphere, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A veterinarian performing an X-ray examination on a dog to check for intestinal obstruction, Korean animal hospital radiology room, medical equipment visible, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A pet owner monitoring their resting puppy on a comfortable bed after mild vomiting episode, home setting with water bowl nearby, gentle caring scene, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 23
CONTENT["반려동물 초콜릿 중독 — 메틸잔틴 독성 계산기 등장"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>반려동물의 초콜릿 중독은 매년 반복되는 응급 사고입니다. 2026년 3월, 국내 수의사 팀이 개발한 "메틸잔틴 독성 계산기" 앱이 출시되며 보호자가 직접 위험도를 빠르게 판단할 수 있게 되었습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>초콜릿의 독성 물질은 테오브로민과 카페인(총칭: 메틸잔틴)입니다. 독성량은 초콜릿 종류에 따라 크게 다릅니다. '
        '①화이트 초콜릿: 테오브로민 0.25mg/g (거의 무독) ②밀크 초콜릿: 2.4mg/g ③다크 초콜릿: 5.5~16mg/g ④베이킹 초콜릿: 16mg/g 이상입니다. '
        '개의 테오브로민 중독량은 체중 kg당 20mg부터 증상이 나타나며, 40~50mg/kg에서 심각한 심장 독성이 발생합니다. '
        '새로 출시된 독성 계산기 앱은 반려동물 체중, 섭취한 초콜릿 종류·양을 입력하면 위험도(안전/주의/위험/응급)를 즉시 판정합니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>보호자가 응급 상황에서 병원 방문 여부를 빠르게 판단할 수 있는 도구의 등장은 반려동물 안전에 큰 기여를 합니다. 다만 앱 결과에만 의존하지 말고, 의심 시 반드시 수의사에게 연락하세요.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>초콜릿 섭취 후 증상(구토, 설사, 과흥분, 떨림, 빈맥)은 2~12시간 후 나타날 수 있습니다. 섭취 직후 증상이 없더라도 안심하지 마시고, 특히 다크·베이킹 초콜릿은 소량이라도 즉시 병원에 가세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 강아지 초콜릿 중독 위험도를 바로 확인할 수 있는 앱이 나왔어요!\n\n"
        "왜 중요할까요?\n\n"
        "초콜릿에 들어있는 테오브로민은 강아지에게 정말 위험해요. "
        "이제 앱으로 체중과 섭취량을 입력하면 위험도를 바로 알 수 있어요.\n\n"
        "핵심 포인트\n\n"
        "- 다크·베이킹 초콜릿이 가장 위험해요 (밀크 초콜릿보다 5배 이상)\n"
        "- 체중 kg당 20mg 이상 섭취하면 증상이 나타나요\n"
        "- 증상은 2~12시간 후에 나타날 수 있으니 바로 안심하면 안 돼요\n\n"
        "꼭 기억하세요!\n\n"
        "초콜릿을 먹었다면 종류와 양을 기억해두고 바로 동물병원에 연락하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A worried pet owner discovering their puppy near an open chocolate bar on the floor, Korean apartment living room, urgent moment captured, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Different types of chocolate bars arranged by toxicity level from white to dark to baking chocolate, clean product photography on a white background, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A veterinarian treating a small dog for chocolate poisoning with IV drip at a Korean emergency animal hospital, medical monitoring equipment visible, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 24
CONTENT['오사카발 "초코린" 펫 체어 — 반려동물 식탁 동반 신제품'] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>일본 오사카에서 시작된 펫 가구 브랜드 "초코린(Chocolin)"이 한국 시장 진출과 함께 반려동물 식탁 동반용 펫 체어를 공식 출시했습니다. 식품위생법 개정으로 열린 한국의 반려동물 동반 외식 시장을 겨냥한 전략적 진출입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>초코린 펫 체어는 일본에서 이미 레스토랑 3,000곳 이상에 납품된 검증된 제품입니다. '
        '한국 출시 모델의 특징은 ①항균 PU 가죽 + 방수 코팅(식약처 인증 소재) ②10kg 이하 소형 반려동물 전용 ③테이블 클램프 고정 방식(흔들림 방지) ④접이식 설계(무게 1.8kg) ⑤세탁 가능한 분리형 쿠션입니다. '
        '가격은 기본형 89,000원, 온열 프리미엄형 149,000원이며, 쿠팡·네이버를 통해 유통됩니다. B2B 대량 구매 시 30% 할인이 적용됩니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>일본의 성숙한 펫 프렌들리 문화 제품이 한국에 진출하면서, 양국 간 펫코노미 교류가 활발해지고 있습니다. 한국 시장의 급속한 성장이 해외 브랜드의 관심을 끌고 있음을 보여줍니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>10kg 체중 제한을 반드시 지켜야 안전합니다. 처음 사용 시 반려동물이 적응할 시간을 주세요. 식당 테이블 두께(2~5cm)에 맞는 클램프인지도 확인이 필요합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 일본 인기 펫 체어 \"초코린\"이 한국에 정식 출시됐어요!\n\n"
        "왜 중요할까요?\n\n"
        "식당에서 반려동물을 어디에 앉힐지 고민이었죠? "
        "일본에서 3,000곳 넘는 식당에 납품된 검증된 제품이에요.\n\n"
        "핵심 포인트\n\n"
        "- 항균 방수 소재, 10kg 이하 전용이에요\n"
        "- 테이블에 클램프로 고정해서 안전해요\n"
        "- 기본형 89,000원, 쿠팡·네이버에서 구매 가능해요\n\n"
        "꼭 기억하세요!\n\n"
        "우리 아이 체중과 테이블 두께를 먼저 확인하고 구매하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A cute small dog sitting in a stylish Japanese-designed pet chair clamped to a restaurant table, elegant dining setting, warm ambiance, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Close-up detail of a foldable pet chair mechanism with table clamp, showing antibacterial PU leather material and removable cushion, product detail shot, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A Korean restaurant owner setting up multiple pet chairs at dining tables in preparation for pet-friendly service, modern restaurant interior, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 25
CONTENT["2026 강아지 사료 성분 완전정복 — 조단백·조지방 숫자의 진실"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>반려견 사료 포장지에 적힌 "조단백 26% 이상, 조지방 14% 이상" 같은 수치는 무엇을 의미할까요? 2026년 사료 시장이 세분화되면서 보호자들의 성분표 이해력이 그 어느 때보다 중요해졌습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p><strong>"조(粗)" 성분의 의미:</strong> "조"는 "대략적인"이라는 뜻으로, 정밀 분석이 아닌 근사치입니다. '
        '①<strong>조단백(Crude Protein):</strong> 킬달법으로 측정한 질소 함량 × 6.25. 실제 소화 가능 단백질과는 차이가 있습니다. AAFCO 기준 성견 최소 18%, 퍼피 22.5% 이상. '
        '②<strong>조지방(Crude Fat):</strong> 에테르 추출법으로 측정. 성견 최소 5.5%, 퍼피 8.5% 이상. 활동량 많은 개는 15~20%가 적합합니다. '
        '③<strong>조섬유(Crude Fiber):</strong> 소화되지 않는 식물 성분. 3~5%가 적절하며, 다이어트 사료는 8% 이상일 수 있습니다. '
        '④<strong>조회분(Crude Ash):</strong> 미네랄 총량. 8% 이하가 양호합니다.</p>'
        '<p>단순 수치보다 원재료의 품질이 더 중요합니다. 조단백 30%라도 부산물 위주라면 소화율이 낮을 수 있습니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>사료 선택 시 조성분 수치만 보지 말고, 원재료 순서(첫 번째 원료가 가장 많은 함량), 소화율, AAFCO/NRC 기준 충족 여부를 종합적으로 평가하세요.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>사료 전환 시 최소 7~10일에 걸쳐 기존 사료와 새 사료를 섞어가며 천천히 바꿔주세요. 급격한 변경은 소화 장애를 유발할 수 있습니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 사료 포장지의 조단백·조지방 수치, 제대로 읽는 법을 알려드릴게요!\n\n"
        "왜 중요할까요?\n\n"
        "사료 성분표를 볼 줄 알면 우리 아이에게 맞는 사료를 고를 수 있어요. "
        "\"조\" 성분은 대략적인 수치라서 숫자만 보면 안 돼요.\n\n"
        "핵심 포인트\n\n"
        "- 조단백은 성견 18% 이상, 퍼피 22.5% 이상이 기준이에요\n"
        "- 수치보다 원재료 품질이 더 중요해요 (첫 번째 원료 확인!)\n"
        "- 사료 바꿀 때는 7~10일에 걸쳐 천천히 바꿔야 해요\n\n"
        "꼭 기억하세요!\n\n"
        "조단백 수치가 높다고 무조건 좋은 사료가 아니에요. 원재료를 먼저 확인하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A pet owner carefully reading the nutritional information label on a bag of premium dog food at a Korean pet store, close-up of the label and thoughtful expression, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Various types of dog food kibble arranged neatly showing different sizes and colors, clean white background, product comparison style photography, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A happy dog eating from a premium food bowl in a modern Korean apartment kitchen, healthy meal scene, natural lighting, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 26
CONTENT["비건 강아지 사료 브랜드 비교 — 영양 적합성 기준 체크포인트"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>비건(채식) 강아지 사료 시장이 2026년 한국에서도 성장세를 보이고 있습니다. 환경·윤리적 이유로 비건 사료를 선택하는 보호자가 늘고 있으나, 영양학적 적합성에 대한 검증이 필수적입니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>국내외 주요 비건 사료 브랜드와 특징입니다. '
        '①<strong>V-dog(미국):</strong> 100% 식물성, AAFCO 성견 기준 충족, 조단백 24%, 콩·완두 기반 ②<strong>야라(Yarrah, 네덜란드):</strong> 유기농 인증, 비건/베지테리언 라인 분리, 조단백 21% ③<strong>국내 A브랜드:</strong> 귀리·렌틸콩 기반, AAFCO 미인증(자체 기준)입니다.</p>'
        '<p><strong>영양 적합성 체크포인트:</strong> ①AAFCO 또는 FEDIAF 기준 충족 여부 ②필수 아미노산 10종(특히 타우린·L-카르니틴) 보충 여부 ③비타민 B12·D3 합성 보충 여부 ④오메가-3 지방산(해조류 유래 DHA) 포함 여부 ⑤정기적 혈액검사를 통한 영양 상태 모니터링 필요</p>'
        '<h3>💡 시사점</h3>'
        '<p>개는 잡식성이므로 이론적으로 비건 식단이 가능하지만, 영양 설계가 정밀해야 합니다. 수의 영양학 전문의와 상의 없이 임의로 비건 식단을 급여하는 것은 위험할 수 있습니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>고양이는 절대적 육식동물이므로 비건 사료를 급여하면 안 됩니다. 강아지도 성장기 퍼피에게는 비건 사료가 권장되지 않으며, 반드시 수의사 상담 후 결정하세요.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 비건 강아지 사료, 어떤 기준으로 골라야 할까요?\n\n"
        "왜 중요할까요?\n\n"
        "환경이나 윤리적 이유로 비건 사료를 고려하는 보호자가 늘고 있어요. "
        "하지만 영양이 부족하면 우리 아이 건강에 문제가 생길 수 있어요.\n\n"
        "핵심 포인트\n\n"
        "- AAFCO 기준 충족 여부를 반드시 확인하세요\n"
        "- 타우린·L-카르니틴·비타민B12 보충이 돼 있어야 해요\n"
        "- 퍼피나 고양이에게는 비건 사료가 적합하지 않아요\n\n"
        "꼭 기억하세요!\n\n"
        "비건 사료를 시작하기 전에 수의사와 꼭 상담하세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A variety of vegan dog food products displayed on a wooden table with fresh vegetables and legumes around them, clean natural lighting, Korean kitchen setting, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Close-up of plant-based dog food kibble with visible ingredients like peas, lentils, and sweet potato pieces, macro photography, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A veterinary nutritionist consulting with a pet owner about diet options, charts and food samples on the desk, professional Korean veterinary office, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 27
CONTENT["사료 등급표로 알아보는 반려견 건강관리 — 등급별 특징과 선택법"] = {
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>반려견 사료는 원재료 품질과 제조 공정에 따라 등급이 나뉩니다. 2026년 현재 공식적인 국제 표준 등급 체계는 없으나, 업계에서 통용되는 분류 기준을 이해하면 사료 선택에 큰 도움이 됩니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p><strong>사료 등급 분류(업계 통용 기준):</strong></p>'
        '<p>①<strong>홀리스틱(Holistic) 등급:</strong> 인간 식용 가능 원료(Human-grade), 유기농·무항생제, 인공 첨가물 無. 대표: 오리젠, 아카나. 가격대 kg당 3~5만 원.</p>'
        '<p>②<strong>슈퍼프리미엄 등급:</strong> 고품질 원육 사용, 부산물 최소화, 프로바이오틱스 첨가. 대표: 로얄캐닌, 힐스 사이언스. 가격대 kg당 2~3만 원.</p>'
        '<p>③<strong>프리미엄 등급:</strong> 원육+부산물 혼합, 기본 영양 기준 충족. 대표: 퓨리나 프로플랜. 가격대 kg당 1~2만 원.</p>'
        '<p>④<strong>이코노미 등급:</strong> 부산물·곡물 중심, 가격 경쟁력 위주. 가격대 kg당 5천~1만 원.</p>'
        '<p>등급이 높다고 모든 개에게 좋은 것은 아닙니다. 알레르기, 소화력, 활동량에 맞는 사료가 최선입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>가격이 비싸다고 무조건 좋은 사료는 아닙니다. 우리 강아지의 나이, 크기, 건강 상태, 활동량에 맞는 사료를 선택하고, 정기 건강검진으로 영양 상태를 확인하세요.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>"등급"은 공식 인증이 아닌 업계 관행이므로 맹신하지 마세요. 원재료 목록의 첫 5개 항목과 AAFCO 기준 충족 여부를 직접 확인하는 것이 가장 정확합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 사료 등급(홀리스틱~이코노미)의 차이와 선택법을 알려드릴게요!\n\n"
        "왜 중요할까요?\n\n"
        "사료 등급을 알면 우리 아이에게 맞는 적절한 사료를 고를 수 있어요. "
        "무조건 비싼 게 좋은 건 아니에요!\n\n"
        "핵심 포인트\n\n"
        "- 홀리스틱 > 슈퍼프리미엄 > 프리미엄 > 이코노미 순이에요\n"
        "- 등급보다 우리 아이의 나이·건강·활동량에 맞는 게 중요해요\n"
        "- 원재료 목록 첫 5개를 꼭 확인하세요\n\n"
        "꼭 기억하세요!\n\n"
        "사료 등급은 공식 인증이 아니라 업계 관행이에요. 직접 성분을 확인하는 게 가장 정확해요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "Four different grades of dog food displayed side by side from premium to economy, showing visible quality differences in kibble, clean comparison layout, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "A veterinarian explaining dog food nutrition chart to a pet owner using a visual guide, Korean animal hospital consultation room, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A happy healthy dog sitting beside premium dog food bowls in a bright modern Korean home, healthy coat and energetic appearance, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# 28 (English title → Korean)
CONTENT["Free pet festival returns to Stonnington with new children's event"] = {
    "newTitle": "호주 스토닝턴 무료 반려동물 축제, 어린이 프로그램 신설",
    "fullContent": (
        '<h3>🔬 개요</h3>'
        '<p>호주 멜버른 스토닝턴(Stonnington) 시의회가 주최하는 무료 반려동물 축제가 2026년에도 돌아왔습니다. 올해는 새롭게 어린이 전용 프로그램이 신설되어 가족 단위 참여가 더욱 확대되었습니다.</p>'
        '<h3>📋 핵심 내용</h3>'
        '<p>스토닝턴 펫 페스티벌은 매년 개최되는 지역 커뮤니티 행사로, 반려동물과 함께 즐길 수 있는 다양한 프로그램을 무료로 제공합니다. '
        '주요 프로그램은 ①반려동물 건강 무료 상담 ②펫 패션쇼 및 도그 쇼 ③반려동물 입양 부스 ④동물 관련 교육 워크숍입니다. '
        '올해 신설된 어린이 프로그램은 ①"꼬마 수의사" 체험 ②동물 그림 그리기 대회 ③반려동물 돌봄 교육(5~12세 대상)으로 구성됩니다. '
        '한국에서도 이와 같은 지역 기반 무료 반려동물 축제가 확산될 수 있는 좋은 모델 사례입니다.</p>'
        '<h3>💡 시사점</h3>'
        '<p>해외의 반려동물 커뮤니티 행사는 단순 축제를 넘어 반려 문화 교육과 입양 촉진의 장으로 활용됩니다. 한국 지자체에서도 벤치마킹할 수 있는 모델입니다.</p>'
        '<h3>⚠️ 주의사항</h3>'
        '<p>해외 축제 정보를 참고할 때 한국과의 법규·문화 차이를 고려하세요. 유사 행사 참여 시 반려동물의 예방접종과 건강 상태를 확인하고, 많은 사람·동물이 모이는 환경에서의 스트레스 관리도 중요합니다.</p>'
    ),
    "easyContent": (
        "한 줄 요약: 호주 스토닝턴에서 무료 반려동물 축제가 열리는데, 올해는 어린이 프로그램도 생겼어요!\n\n"
        "왜 중요할까요?\n\n"
        "해외에서는 이렇게 지역 주민과 반려동물이 함께하는 무료 축제가 활발해요. "
        "한국에서도 이런 행사가 많아지면 좋겠죠?\n\n"
        "핵심 포인트\n\n"
        "- 건강 상담, 펫 패션쇼, 입양 부스 등 다양한 프로그램이 무료예요\n"
        "- 올해 신설된 \"꼬마 수의사\" 체험이 인기예요\n"
        "- 한국 지자체도 벤치마킹할 수 있는 좋은 사례예요\n\n"
        "꼭 기억하세요!\n\n"
        "대규모 행사에 반려동물을 데려갈 때는 스트레스 관리에 신경 써주세요!"
    ),
    "imagePrompts": [
        {"section": "대표 이미지", "prompt": "A vibrant outdoor pet festival in an Australian park with families and their dogs enjoying activities, colorful tents and booths, sunny day, community event atmosphere, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "정보 이미지", "prompt": "Children participating in a junior veterinarian experience program at a pet festival, kids with stethoscopes examining stuffed animals, fun educational activity, No text, no watermark, no logo", "style": "photorealistic"},
        {"section": "생활 이미지", "prompt": "A family with children and their pet dog browsing adoption booths at an outdoor community pet festival, happy atmosphere, Australian park setting, No text, no watermark, no logo", "style": "photorealistic"}
    ]
}

# ── Main logic ──────────────────────────────────────────────

with open(DB_PATH, "r", encoding="utf-8") as f:
    db = json.load(f)

updated = 0
for cat in db["categories"]:
    for sub in cat.get("subcategories", []):
        for topic in sub.get("topics", []):
            title = topic.get("title", "")
            if title in CONTENT and topic.get("fullContent", "") == "":
                data = CONTENT[title]
                topic["fullContent"] = data["fullContent"]
                topic["easyContent"] = data["easyContent"]
                topic["imagePrompts"] = data["imagePrompts"]
                if "newTitle" in data:
                    topic["title"] = data["newTitle"]
                updated += 1

# Verify remaining empty
remaining = 0
for cat in db["categories"]:
    for sub in cat.get("subcategories", []):
        for topic in sub.get("topics", []):
            if topic.get("fullContent", "") == "":
                remaining += 1

with open(DB_PATH, "w", encoding="utf-8") as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(f"Updated: {updated} topics")
print(f"Remaining empty: {remaining} topics")

# Validate JSON
with open(DB_PATH, "r", encoding="utf-8") as f:
    json.load(f)
print("JSON validation: OK")