#!/usr/bin/env python3
"""
CCO fullContent 보강 4단계 - 행동분석학 전체 + 피부과 + 안과/홈케어
"""

import json
import random
import time

# 행동분석학 fullContent 템플릿
BEHAVIOR_TEMPLATES = {
    'beh-psychology': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['행동심리', '학습이론', '고전적 조건화', '조작적 조건화', '인지능력', '감정표현', '스트레스 반응', '행동 발현']
    },
    'beh-training': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['훈련방법', '양성강화', '음성강화', '벌', '소거', '일반화', '변별', '연쇄행동', '클리커 훈련']
    },
    'beh-body': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['신체언어', '보디랭귀지', '꼬리 위치', '귀 각도', '자세', '표정', '동공 크기', '근육 긴장도']
    },
    'beh-problem': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['문제행동', '공격성', '분리불안', '과도한 짖음', '파괴행동', '부적절한 배설', '강박행동']
    },
    'beh-environment': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['환경 풍부화', '영역성', '안전지대', '수직공간', '은신처', '놀이도구', '퍼즐 피더', '향기 마킹']
    },
    'beh-stress': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['스트레스', '불안', '우울', '공포증', '페로몬', '진정제', '행동 치료', '탈감작', '역조건형성']
    },
    'beh-cat': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['고양이 특성', '야행성', '사냥본능', '그루밍', '스크래칭', '화장실', '우다다', '골골송']
    },
    'beh-dog': {
        'sections': ['🔬 개요', '📋 원인 및 기전', '🐾 행동 패턴', '🔍 평가/진단', '💊 교정/관리법', '⚠️ 보호자 주의사항'],
        'keywords': ['강아지 특성', '사회성', '놀이행동', '서열의식', '에너지 소모', '산책', '사회화 시기', '복종 훈련']
    }
}

# 수의학 fullContent 템플릿
VET_TEMPLATES = {
    'vet-dermatology': {
        'sections': ['🔬 병태생리', '📋 증상', '🔍 진단', '💊 치료', '🛡️ 예방 및 관리', '⚠️ 주의사항'],
        'keywords': ['피부염', '알레르기', '세균감염', '진균감염', '기생충', '아토피', '핫스팟', '탈모', '가려움증']
    },
    'vet-homecare': {
        'sections': ['🔬 병태생리', '📋 증상', '🔍 진단', '💊 치료', '🛡️ 예방 및 관리', '⚠️ 주의사항'],
        'keywords': ['안과질환', '각막염', '결막염', '백내장', '녹내장', '눈물자국', '안구건조증', '상처관리', '홈케어']
    }
}

def generate_behavior_content(subcategory_id, title, animal_type='both'):
    """행동분석학 fullContent 생성"""
    template = BEHAVIOR_TEMPLATES[subcategory_id]
    sections = template['sections']
    keywords = template['keywords']
    
    # 동물별 맞춤 내용
    animal_specific = {
        'cat': '고양이의 특성상',
        'dog': '강아지의 특성상', 
        'both': '반려동물의 특성상'
    }
    
    content_parts = []
    
    # 각 섹션별 내용 생성
    for section in sections:
        if section == '🔬 개요':
            content_parts.append(f"<h3>{section}</h3>")
            content_parts.append(f"<p>{title.replace(':', '는')}는 반려동물의 행동학적 측면에서 중요한 의미를 갖습니다. {random.choice(keywords)}와 관련된 이 현상은 {animal_specific[animal_type]} 특별한 관심을 기울여야 할 영역입니다. 학습이론과 행동분석학적 관점에서 이해할 때, 보다 효과적인 접근이 가능합니다.</p>")
            
        elif section == '📋 원인 및 기전':
            content_parts.append(f"<h3>{section}</h3>")
            content_parts.append(f"<p>이 행동의 발현에는 여러 요인이 복합적으로 작용합니다. 유전적 소인, 초기 사회화 경험, 학습 과정, 환경적 자극 등이 주요 원인으로 작용합니다. {animal_specific[animal_type]} 뇌의 신경전달물질(도파민, 세로토닌, 노르에피네프린) 균형과 호르몬(코르티솔, 옥시토신) 분비가 행동 표현에 직접적인 영향을 미칩니다. 고전적 조건화와 조작적 조건화의 학습 원리를 통해 행동이 강화되거나 소거됩니다.</p>")
            
        elif section == '🐾 행동 패턴':
            content_parts.append(f"<h3>{section}</h3>")
            content_parts.append(f"<p>관찰되는 행동 패턴은 다음과 같습니다. 초기 단계에서는 미세한 신호들이 나타나며, 점진적으로 명확한 행동으로 발전합니다. 품종별, 연령별, 성별에 따른 차이가 존재하며, 개체의 성격과 과거 경험에 따라서도 다르게 나타납니다. {animal_specific[animal_type]} 신체언어(귀 위치, 꼬리 모양, 자세, 표정)와 음성 신호(짖음, 야옹, 그르렁거림)를 복합적으로 관찰해야 합니다. 환경적 맥락과 함께 해석할 때 정확한 의미 파악이 가능합니다.</p>")
            
        elif section == '🔍 평가/진단':
            content_parts.append(f"<h3>{section}</h3>")
            content_parts.append(f"<p>정확한 평가를 위해서는 체계적인 관찰과 기록이 필요합니다. 행동 발생 빈도, 지속 시간, 강도, 유발 상황을 상세히 기록합니다. 수의행동학 전문가는 AVSAB(American Veterinary Society of Animal Behavior) 가이드라인을 참고하여 평가합니다. 필요시 혈액검사를 통한 호르몬 수치 확인, 뇌영상 검사, 신경학적 검사 등을 실시할 수 있습니다. 정상 행동과 문제 행동의 구분은 동물의 복지와 인간-동물 유대관계에 미치는 영향을 기준으로 판단합니다.</p>")
            
        elif section == '💊 교정/관리법':
            content_parts.append(f"<h3>{section}</h3>")
            content_parts.append(f"<p>효과적인 교정을 위해서는 다각적 접근이 필요합니다. 양성강화(positive reinforcement) 기법을 우선 적용하며, 벌(punishment)보다는 대안행동 학습에 중점을 둡니다. 환경 수정(environmental management)을 통해 문제 상황 자체를 예방하고, 필요시 탈감작(desensitization)과 역조건형성(counter-conditioning) 기법을 적용합니다. 심각한 경우 수의사 처방하에 행동 조절 약물(플루옥세틴, 세르트랄린, 클로미프라민 등)을 병용할 수 있습니다. 일관성 있는 훈련과 충분한 시간이 필요하며, 보호자 교육이 성공의 핵심 요소입니다.</p>")
            
        elif section == '⚠️ 보호자 주의사항':
            content_parts.append(f"<h3>{section}</h3>")
            content_parts.append(f"<p>잘못된 접근은 문제를 악화시킬 수 있으므로 주의가 필요합니다. 체벌이나 강압적 방법은 절대 사용하지 말고, 큰 소리를 내거나 위협적인 행동은 피해야 합니다. 행동 변화는 즉시 나타나지 않으므로 인내심을 갖고 꾸준히 진행해야 합니다. 보호자의 일관되지 않은 반응은 혼란을 야기할 수 있습니다. 증상이 악화되거나 새로운 문제행동이 나타나면 즉시 수의행동학 전문가와 상담하시기 바랍니다. 다른 반려동물이나 사람에게 위해를 가할 위험이 있다면 응급 상황으로 간주하고 즉시 전문의의 도움을 받아야 합니다.</p>")
    
    return '\n'.join(content_parts)

def generate_vet_content(subcategory_id, title, animal_type='both'):
    """수의학 fullContent 생성"""
    template = VET_TEMPLATES[subcategory_id]
    sections = template['sections']
    keywords = template['keywords']
    
    content_parts = []
    
    for section in sections:
        if section == '🔬 병태생리':
            content_parts.append(f"<h3>{section}</h3>")
            if subcategory_id == 'vet-dermatology':
                content_parts.append(f"<p>{title}는 피부의 구조적, 기능적 이상으로 인해 발생하는 질환입니다. 피부는 표피, 진피, 피하조직으로 구성되며, 각질층의 장벽 기능이 손상되면 외부 자극물질이나 알레르겐의 침입이 용이해져 염증반응이 시작됩니다. 면역시스템의 과도한 반응으로 인해 히스타민, 류코트리엔, 사이토카인이 분비되어 가려움증, 염증, 부종을 유발합니다. 피부 미생물총의 불균형은 이차적 세균 또는 진균 감염을 야기할 수 있습니다.</p>")
            else:  # vet-homecare
                content_parts.append(f"<p>{title}는 안구 및 주변 조직의 해부학적, 생리학적 이상으로 인해 발생합니다. 각막, 결막, 수정체, 유리체, 망막 등의 구조 중 하나 이상에서 문제가 발생하면 시각 기능에 영향을 미칩니다. 눈물의 생성, 분비, 배출 과정의 이상은 안구 표면의 습윤도를 변화시켜 각막 손상을 야기할 수 있습니다. 안압 상승, 혈관 순환 장애, 염증 매개체의 분비 등이 복합적으로 작용하여 증상이 나타납니다.</p>")
        
        elif section == '📋 증상':
            content_parts.append(f"<h3>{section}</h3>")
            if subcategory_id == 'vet-dermatology':
                content_parts.append(f"<p><strong>초기 증상:</strong> 경미한 가려움증, 국소적 발적, 털 윤기 감소, 비듬 발생<br><strong>중기 증상:</strong> 지속적인 긁기/핥기, 탈모, 피부 두꺼워짐, 색소침착, 이차 감염 징후(농포, 딱지)<br><strong>말기 증상:</strong> 광범위한 피부 병변, 만성 염증, 피부 비후, 색소 변화, 전신 감염 위험</p>")
            else:  # vet-homecare
                content_parts.append(f"<p><strong>초기 증상:</strong> 눈물량 증가, 눈 비비기, 가벼운 충혈, 눈곱 증가<br><strong>중기 증상:</strong> 지속적인 눈물자국, 각막 혼탁, 동공 반응 이상, 눈 깜빡임 증가, 광 기피<br><strong>말기 증상:</strong> 시력 감소, 안구 팽창, 각막 궤양, 안구 돌출, 완전 실명 위험</p>")
        
        elif section == '🔍 진단':
            content_parts.append(f"<h3>{section}</h3>")
            if subcategory_id == 'vet-dermatology':
                content_parts.append(f"<p>정확한 진단을 위해 피부 스크래핑 검사, 세포학적 검사, 진균 배양 검사를 실시합니다. 알레르기 검사(혈청 특이 IgE, 피부 반응 검사)를 통해 원인 알레르겐을 찾아냅니다. 피부 생검이 필요한 경우 조직병리학적 검사를 시행합니다. 세균 배양 및 항생제 감수성 검사로 적절한 치료제를 선택합니다. 감별진단으로 접촉성 피부염, 음식 알레르기, 기생충성 피부염, 내분비 질환을 고려해야 합니다.</p>")
            else:  # vet-homecare
                content_parts.append(f"<p>안과 검진에서 슬릿램프 현미경, 직간접 검안경, 안압 측정기를 사용합니다. 눈물 생성량 검사(Schirmer test), 형광염색(fluorescein stain) 검사로 각막 손상 유무를 확인합니다. 안저 검사를 통해 망막과 시신경 상태를 평가하고, 필요시 안구 초음파 검사를 시행합니다. 감별진단으로 결막염, 각막염, 포도막염, 백내장, 녹내장 등을 고려합니다.</p>")
        
        elif section == '💊 치료':
            content_parts.append(f"<h3>{section}</h3>")
            if subcategory_id == 'vet-dermatology':
                content_parts.append(f"<p>원인에 따른 맞춤 치료를 진행합니다. 알레르기성 피부염은 항히스타민제, 스테로이드, 면역억제제(사이클로스포린, 오클라시티닙)를 사용합니다. 세균 감염은 적절한 항생제(세팔렉신, 클린다마이신, 플루오로퀴놀론)를 2-4주간 투여합니다. 진균 감염에는 항진균제(이트라코나졸, 플루코나졸) 전신 투여와 함께 약용 샴푸(케토코나졸, 클로르헥시딘) 목욕을 병행합니다. 국소 치료제로 스테로이드 크림, 항생제 연고를 적용하고, 심한 가려움증에는 가바펜틴이나 독세핀을 고려할 수 있습니다.</p>")
            else:  # vet-homecare
                content_parts.append(f"<p>질환에 따른 단계적 치료를 실시합니다. 세균성 결막염은 항생제 점안액(겐타마이신, 오플록사신)을 하루 3-4회 점안합니다. 안구건조증에는 인공눈물, 사이클로스포린 점안액으로 눈물 생성을 촉진합니다. 각막 궤양에는 항생제 점안액과 함께 아트로핀으로 동공을 확대시켜 통증을 완화합니다. 심한 경우 타르소라피(눈꺼풀 봉합술)나 결막 피판술이 필요할 수 있습니다. 녹내장에는 안압 강하제(티몰롤, 라타노프로스트)를 사용합니다.</p>")
        
        elif section == '🛡️ 예방 및 관리':
            content_parts.append(f"<h3>{section}</h3>")
            if subcategory_id == 'vet-dermatology':
                content_parts.append(f"<p>정기적인 피부 관리가 예방의 핵심입니다. 주 1-2회 적절한 샴푸로 목욕시키고, 알레르기 유발 요인(꽃가루, 진드기, 특정 음식)을 피합니다. 습도 조절(40-60%)과 청결한 환경 유지가 중요하며, 스트레스 관리도 도움이 됩니다. 오메가-3 지방산 보충제 급여로 피부 장벽 기능을 강화할 수 있습니다. 정기적인 건강검진을 통해 조기 발견하고, 보호자가 일상적인 피부 상태를 관찰하는 습관을 가져야 합니다.</p>")
            else:  # vet-homecare
                content_parts.append(f"<p>일상적인 눈 관리로 많은 문제를 예방할 수 있습니다. 매일 깨끗한 거즈나 면봉으로 눈곱과 눈물자국을 부드럽게 제거합니다. 먼지나 강한 바람에 노출을 피하고, 자극적인 샴푸나 화학물질이 눈에 들어가지 않도록 주의합니다. 정기적인 안과 검진(연 1-2회)을 받고, 눈 주변 털이 길면 정기적으로 트리밍합니다. 충분한 수분 섭취와 균형 잡힌 영양 공급이 안구 건강에 도움이 됩니다.</p>")
        
        elif section == '⚠️ 주의사항':
            content_parts.append(f"<h3>{section}</h3>")
            if subcategory_id == 'vet-dermatology':
                content_parts.append(f"<p>자가 치료는 위험할 수 있으므로 수의사 진단 후 치료를 시작해야 합니다. 인간용 피부약이나 스테로이드 크림을 임의로 사용하지 마세요. 가려움증이 심해 계속 긁거나 핥는 경우 엘리자베스 칼라를 착용시켜 이차 손상을 방지합니다. 항생제는 처방된 기간 동안 완전히 복용해야 하며, 증상이 호전되었다고 임의로 중단하면 안 됩니다. 알레르기 반응(호흡곤란, 부종, 의식저하)이 나타나면 즉시 응급처치를 받아야 합니다.</p>")
            else:  # vet-homecare
                content_parts.append(f"<p>눈은 매우 민감한 기관이므로 함부로 만지거나 약물을 사용하지 마세요. 사람용 안약이나 소독약은 절대 사용하지 않으며, 면봉으로 눈 안쪽을 직접 닦지 않습니다. 급작스런 시력 감소나 안구 돌출, 심한 통증이 나타나면 즉시 응급 진료를 받아야 합니다. 점안액 사용 시에는 손을 깨끗이 씻고, 약병 끝이 눈에 닿지 않도록 주의합니다. 여러 종류의 안약을 사용할 때는 5분 간격을 두고 점안하며, 연고는 점안액 사용 후에 적용합니다.</p>")
    
    return '\n'.join(content_parts)

def update_subcategory_fullcontent(data, subcategory_id, template_type='behavior'):
    """특정 서브카테고리의 fullContent 업데이트"""
    updated_count = 0
    
    for category in data['categories']:
        for subcategory in category['subcategories']:
            if subcategory['id'] == subcategory_id:
                print(f"\n=== 처리 중: {subcategory['name']} ({subcategory_id}) ===")
                
                for i, topic in enumerate(subcategory['topics']):
                    # 기존 fullContent 확인
                    current_length = len(topic.get('fullContent', ''))
                    needs_update = False
                    
                    if template_type == 'behavior':
                        # 행동분석학: fullContent가 없거나 500자 미만인 경우 업데이트
                        needs_update = current_length < 500
                    else:
                        # 수의학: fullContent가 없는 경우 업데이트  
                        needs_update = current_length == 0
                    
                    if needs_update:
                        animal_type = topic.get('animal', 'both')
                        
                        if template_type == 'behavior':
                            new_content = generate_behavior_content(subcategory_id, topic['title'], animal_type)
                        else:
                            new_content = generate_vet_content(subcategory_id, topic['title'], animal_type)
                        
                        topic['fullContent'] = new_content
                        updated_count += 1
                        print(f"  {i+1:2d}. {topic['title'][:50]}... ({current_length:4d} → {len(new_content):4d}자)")
                        
                        # API 부하 방지를 위한 딜레이
                        time.sleep(0.1)
                
                print(f"완료: {updated_count}개 항목 업데이트")
                return updated_count
    
    return 0

def main():
    # 데이터 로드
    with open('data/content-db.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("=== CCO fullContent 보강 4단계 시작 ===")
    print("대상: 행동분석학 8개 소분류 + 피부과 + 안과/홈케어")
    
    total_updated = 0
    
    # 1. 행동분석학 8개 소분류 처리
    behavior_subcategories = [
        'beh-psychology', 'beh-training', 'beh-body', 'beh-problem',
        'beh-environment', 'beh-stress', 'beh-cat', 'beh-dog'
    ]
    
    print("\n### 1단계: 행동분석학 보강 ###")
    for subcategory_id in behavior_subcategories:
        count = update_subcategory_fullcontent(data, subcategory_id, 'behavior')
        total_updated += count
    
    # 2. 수의학 (피부과, 안과/홈케어) 처리
    print("\n### 2단계: 수의학 보강 ###")
    vet_subcategories = ['vet-dermatology', 'vet-homecare']
    
    for subcategory_id in vet_subcategories:
        count = update_subcategory_fullcontent(data, subcategory_id, 'vet')
        total_updated += count
    
    # 결과 저장
    with open('data/content-db.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== 보강 완료 ===")
    print(f"총 {total_updated}개 항목의 fullContent가 업데이트되었습니다.")
    print("파일이 저장되었습니다: data/content-db.json")

if __name__ == "__main__":
    main()