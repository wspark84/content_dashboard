#!/usr/bin/env python3
"""
콘텐츠 리라이팅 + 이미지 프롬프트 생성 스크립트
CCO + 카피라이터 + 콘텐츠라이터 + 디자이너 역할
"""
import json
import re
import os
from datetime import datetime

DB_PATH = '/Users/wspark/.openclaw/workspace/pet-content-dashboard/data/content-db.json'
OUT_PATH = '/Users/wspark/.openclaw/workspace/pet-content-dashboard/data/content-enhancements.json'

# ─── HTML → 텍스트 변환 ───
def strip_html(html):
    if not html:
        return ''
    text = re.sub(r'<br\s*/?>', '\n', html)
    text = re.sub(r'<strong>(.*?)</strong>', r'\1', text)
    text = re.sub(r'<em>(.*?)</em>', r'\1', text)
    text = re.sub(r'<[^>]+>', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# ─── H3 섹션 추출 ───
def extract_sections(html):
    """H3 태그 기준으로 섹션 분리"""
    sections = {}
    # Remove emoji from section headers for matching
    parts = re.split(r'<h3[^>]*>\s*(?:🔬|📋|🔍|💊|📊|⚠️|🧠|🐾|🍽️|🧘|✅|🏥|💡|🎯|❤️|🐱|🐶|🦴|🩺|🌡️|🧬|💉)?\s*(.*?)\s*</h3>', html, flags=re.DOTALL)
    
    if len(parts) < 3:
        return {'전체': strip_html(html)}
    
    # parts[0] is before first h3, then alternating title/content
    for i in range(1, len(parts)-1, 2):
        title = parts[i].strip()
        content = strip_html(parts[i+1]) if i+1 < len(parts) else ''
        sections[title] = content
    
    return sections

# ─── 말투 변환 (격식 → 친근) ───
TONE_REPLACEMENTS = [
    (r'입니다\.', '이에요.'),
    (r'합니다\.', '해요.'),
    (r'됩니다\.', '돼요.'),
    (r'있습니다\.', '있어요.'),
    (r'없습니다\.', '없어요.'),
    (r'됩니다', '돼요'),
    (r'합니다', '해요'),
    (r'입니다', '이에요'),
    (r'있습니다', '있어요'),
    (r'없습니다', '없어요'),
    (r'바랍니다', '바라요'),
    (r'드립니다', '드려요'),
    (r'봅니다', '봐요'),
    (r'줍니다', '줘요'),
    (r'갑니다', '가요'),
    (r'옵니다', '와요'),
    (r'겠습니다', '겠어요'),
    (r'하십시오', '하세요'),
    (r'마십시오', '마세요'),
    (r'필수적입니다', '꼭 필요해요'),
    (r'중요합니다', '중요해요'),
    (r'필요합니다', '필요해요'),
    (r'가능합니다', '가능해요'),
    (r'불가능합니다', '불가능해요'),
    (r'관찰됩니다', '관찰돼요'),
    (r'발생합니다', '발생해요'),
    (r'나타납니다', '나타나요'),
    (r'사용합니다', '사용해요'),
    (r'권장합니다', '권장해요'),
    (r'추천합니다', '추천해요'),
]

TERM_SIMPLIFICATIONS = [
    # Longer phrases first to avoid partial matches
    ('면역시스템의 과도한 반응', '몸의 방어 시스템이 너무 심하게 반응하는 것'),
    ('생리적 기능의 점진적 감소', '몸의 기능이 조금씩 떨어지는 것'),
    ('각질층의 장벽 기능', '피부 보호막'),
    ('확장성 심근병증', '심장이 커져서 잘 못 뛰는 병'),
    ('중심성 망막변성', '눈이 서서히 안 보이는 병'),
    ('가수분해 단백질', '아주 잘게 쪼갠 단백질'),
    ('고전적 조건화', '반복으로 자연스럽게 배우는 것'),
    ('조작적 조건화', '보상과 벌로 배우는 것'),
    ('항히스타민제', '가려움을 줄여주는 약'),
    ('망막 변성', '눈이 안 보이게 되는 것'),
    ('신경전달물질', '뇌 신호 물질'),
    ('노르에피네프린', '긴장 호르몬'),
    ('코르티솔', '스트레스 호르몬'),
    ('류코트리엔', '염증 물질'),
    ('사이토카인', '염증 신호 물질'),
    ('히스타민', '가려움 물질'),
    ('알레르겐', '알레르기 원인 물질'),
    ('색소침착', '피부가 검게 변하는 것'),
    ('피부 비후', '피부가 두꺼워짐'),
    ('도파민', '행복 호르몬'),
    ('세로토닌', '안정 호르몬'),
    ('옥시토신', '사랑 호르몬'),
    ('대사 속도', '에너지 사용 속도'),
    ('농포', '고름 물집'),
]

def simplify_tone(text):
    """격식체를 친근한 말투로 변환"""
    for pattern, replacement in TONE_REPLACEMENTS:
        text = re.sub(pattern, replacement, text)
    # Catch remaining formal endings
    text = re.sub(r'(\w)습니다', r'\1어요', text)
    text = re.sub(r'십시오', '세요', text)
    # Clean up awkward double spaces/newlines
    text = re.sub(r'  +', ' ', text)
    return text

def simplify_terms(text):
    """전문 용어를 쉬운 표현으로 — 중복 치환 방지"""
    for term, simple in TERM_SIMPLIFICATIONS:
        if term in text and simple not in text:
            text = text.replace(term, simple)
    # Clean up artifacts
    text = re.sub(r'병리학적\s*', '', text)
    # Fix awkward patterns from template content
    text = re.sub(r'뇌의 뇌 신호 물질\(행복 호르몬, 안정 호르몬, 긴장 호르몬\)', '뇌의 여러 호르몬(행복 호르몬, 안정 호르몬 등)', text)
    text = re.sub(r'뇌 신호 물질\(행복 호르몬, 안정 호르몬, 긴장 호르몬\)', '여러 뇌 호르몬(행복/안정/긴장 호르몬)', text)
    text = re.sub(r'호르몬\(스트레스 호르몬, 사랑 호르몬\)', '호르몬(스트레스 호르몬과 사랑 호르몬)', text)
    return text

# ─── 이미지 프롬프트 생성 ───
ANIMAL_MAP = {
    'dog': {'name': 'dog', 'breeds': ['golden retriever', 'shiba inu', 'poodle', 'welsh corgi', 'labrador retriever']},
    'cat': {'name': 'cat', 'breeds': ['orange tabby cat', 'russian blue cat', 'british shorthair cat', 'siamese cat', 'persian cat']},
    'both': {'name': 'pet', 'breeds': ['golden retriever', 'orange tabby cat', 'white poodle', 'calico cat']},
}

SECTION_IMAGE_TEMPLATES = {
    '개요': [
        "A warm photograph of a healthy {breed} sitting comfortably in a bright Korean home living room, looking at camera with gentle eyes, soft natural light from window, warm tones, shallow depth of field, cozy atmosphere. No text, no watermark, no logo",
    ],
    '증상': [
        "A concerned Korean young adult gently examining their {breed}, looking worried while checking the pet's condition, soft indoor lighting, emotional moment between pet and owner, warm tones, shallow depth of field. No text, no watermark, no logo",
        "Close-up photograph of a {breed} looking slightly unwell with droopy eyes, lying on a soft blanket, soft diffused lighting, gentle warm tones, empathetic mood. No text, no watermark, no logo",
    ],
    '원인': [
        "A veterinarian in white coat gently examining a {breed} on examination table in a modern clinic, professional yet warm atmosphere, clean bright lighting, shallow depth of field. No text, no watermark, no logo",
    ],
    '진단': [
        "A professional veterinarian using medical equipment to examine a {breed} in a clean modern veterinary clinic, bright clinical lighting, professional atmosphere, shallow depth of field. No text, no watermark, no logo",
    ],
    '치료': [
        "A kind veterinarian carefully treating a {breed}, the pet looking calm and trusting, warm clinical environment, soft lighting, compassionate moment. No text, no watermark, no logo",
    ],
    '해결': [
        "A happy Korean young adult preparing healthy pet food in a bright modern kitchen, with a {breed} watching eagerly nearby, warm natural lighting, cheerful atmosphere. No text, no watermark, no logo",
    ],
    '예방': [
        "A joyful {breed} running in a green park on a sunny day, full of energy and health, vibrant colors, dynamic motion, natural outdoor lighting, warm tones. No text, no watermark, no logo",
        "A Korean young adult walking with their happy {breed} in a beautiful park path, both looking content, golden hour lighting, warm cinematic photography, shallow depth of field. No text, no watermark, no logo",
    ],
    '관리': [
        "A Korean young adult lovingly grooming their {breed} at home, gentle caring moment, soft warm indoor lighting, cozy home environment, shallow depth of field. No text, no watermark, no logo",
    ],
    '급여': [
        "A top-down photograph of premium pet food arranged beautifully in a ceramic bowl with fresh ingredients around it, clean bright food photography style, soft natural light, warm tones. No text, no watermark, no logo",
    ],
    '영양': [
        "Fresh healthy ingredients for pet nutrition arranged on a wooden cutting board, including meat, vegetables, and supplements, bright food photography, natural lighting, warm tones. No text, no watermark, no logo",
    ],
    '행동': [
        "A {breed} displaying natural behavior in a home setting, authentic candid moment, warm indoor lighting, lifestyle photography style, shallow depth of field. No text, no watermark, no logo",
    ],
    '훈련': [
        "A Korean young adult training their attentive {breed} in a park, positive reinforcement moment with treats, warm golden hour lighting, joyful atmosphere, shallow depth of field. No text, no watermark, no logo",
    ],
    '목욕': [
        "A cute {breed} getting a gentle bath, covered in bubbles, looking at camera with adorable expression, bright bathroom lighting, playful warm tones, shallow depth of field. No text, no watermark, no logo",
    ],
    '피부': [
        "Close-up of a healthy {breed}'s glossy fur being gently stroked by a hand, showing beautiful coat condition, soft natural lighting, warm tones, macro photography feel. No text, no watermark, no logo",
    ],
}

def get_breed(animal, idx=0):
    info = ANIMAL_MAP.get(animal, ANIMAL_MAP['both'])
    return info['breeds'][idx % len(info['breeds'])]

def generate_image_prompts(title, animal, tags, sections_keys):
    """주제에 맞는 이미지 프롬프트 생성"""
    prompts = []
    breed = get_breed(animal, hash(title) % 5)
    
    # Map section keys to template categories
    section_mapping = {
        '개요': '개요', '병이 생기는 원리': '개요', '병태생리': '개요',
        '증상': '증상', '초기 증상': '증상', '증상 및 징후': '증상',
        '원인': '원인', '원인 및 기전': '원인',
        '진단': '진단', '진단 및 모니터링': '진단',
        '치료': '치료', '치료 및 관리': '치료',
        '해결': '해결', '해결법': '해결', '해결 방법': '해결',
        '예방': '예방', '예방법': '예방', '예방 및 관리': '예방',
        '관리': '관리', '단계별 관리': '관리', '환경 관리': '관리',
        '급여': '급여', '급여법 및 실제 적용': '급여', '급여 시 주의사항': '급여',
        '영양': '영양', '영양 관리': '영양', '영양소 분석': '영양',
        '행동': '행동', '행동 패턴': '행동', '행동 분석': '행동',
        '훈련': '훈련', '훈련 방법': '훈련', '교정 프로그램': '훈련',
        '목욕': '목욕', '목욕 관리': '목욕',
        '피부': '피부', '피부 관리': '피부',
    }
    
    used_sections = set()
    
    for sec_key in sections_keys:
        mapped = None
        for pattern, category in section_mapping.items():
            if pattern in sec_key:
                mapped = category
                break
        
        if mapped and mapped not in used_sections and mapped in SECTION_IMAGE_TEMPLATES:
            used_sections.add(mapped)
            templates = SECTION_IMAGE_TEMPLATES[mapped]
            for tmpl in templates:
                prompts.append({
                    'section': sec_key,
                    'prompt': tmpl.format(breed=breed),
                    'style': 'photorealistic, warm tones, shallow depth of field, natural lighting'
                })
        
        if len(prompts) >= 5:
            break
    
    # Ensure at least 3 prompts
    if len(prompts) < 3:
        # Add generic ones
        defaults = [
            ('개요', "A warm photograph of a cute {breed} in a cozy Korean home, looking at camera with gentle expression, soft natural window light, warm tones, shallow depth of field. No text, no watermark, no logo"),
            ('핵심', "A Korean young adult lovingly caring for their {breed}, warm emotional moment, soft indoor lighting, lifestyle photography, shallow depth of field. No text, no watermark, no logo"),
            ('실천', "A happy healthy {breed} playing joyfully in a green park, vibrant natural colors, dynamic energy, outdoor natural lighting, warm tones. No text, no watermark, no logo"),
        ]
        for sec, tmpl in defaults:
            if len(prompts) >= 3:
                break
            prompts.append({
                'section': sec,
                'prompt': tmpl.format(breed=breed),
                'style': 'photorealistic, warm tones, shallow depth of field, natural lighting'
            })
    
    # Add tag-specific prompts
    tag_prompts = {
        '아토피': "Close-up of a {breed}'s skin being gently examined by caring hands, showing the importance of skin care, soft clinical lighting, warm tones. No text, no watermark, no logo",
        '알레르기': "A Korean young adult carefully reading pet food ingredient labels at a pet store, with a {breed} sitting in the shopping cart, bright store lighting. No text, no watermark, no logo",
        '다이어트': "A fit healthy {breed} with an ideal body condition, photographed from the side showing good physique, outdoor natural lighting, warm tones. No text, no watermark, no logo",
        '노령': "A gentle senior {breed} with a slightly gray muzzle resting peacefully on a soft cushion, warm soft indoor lighting, peaceful atmosphere. No text, no watermark, no logo",
        '산책': "A Korean young adult happily walking their energetic {breed} on a tree-lined path, golden hour sunlight, warm cinematic photography. No text, no watermark, no logo",
        '사회화': "Multiple pets ({breed} and another breed) playing together happily in a park, joyful social interaction, bright natural lighting. No text, no watermark, no logo",
    }
    
    if len(prompts) < 5:
        for tag in tags:
            for keyword, tmpl in tag_prompts.items():
                if keyword in tag and len(prompts) < 5:
                    prompts.append({
                        'section': f'태그:{tag}',
                        'prompt': tmpl.format(breed=breed),
                        'style': 'photorealistic, warm tones, shallow depth of field, natural lighting'
                    })
    
    return prompts[:5]

# ─── easyContent 생성 ───
def generate_easy_content(title, description, sections, animal, tags, key_points):
    """구조화된 쉬운 콘텐츠 생성"""
    
    animal_kr = {'dog': '강아지', 'cat': '고양이', 'both': '반려동물'}.get(animal, '반려동물')
    
    # ── 한 줄 요약 ──
    summary_line = description if description else f'{title}에 대해 알아봐요!'
    summary_line = simplify_tone(summary_line)
    # Make it more friendly
    if '상세 분석' in summary_line:
        summary_line = summary_line.replace('상세 분석', '쉽게 알아보기')
    if '수의학적 관점에서 분석합니다' in summary_line:
        summary_line = summary_line.replace('수의학적 관점에서 분석합니다', '쉽게 알려드릴게요')
    if '보호자가 반드시 알아야 할 내용입니다' in summary_line:
        summary_line = summary_line.replace('보호자가 반드시 알아야 할 내용입니다', '보호자라면 꼭 알아야 해요')
    if '필독 가이드입니다' in summary_line:
        summary_line = summary_line.replace('필독 가이드입니다', '꼭 읽어보세요')
    # Clean up template-style descriptions
    summary_line = re.sub(r'\s*관련 전문 정보이에요\.\s*', '에 대해 알아봐요! ', summary_line)
    summary_line = re.sub(r'보호자가 알아야 할 핵심 내용을 정리했어요', '보호자라면 꼭 읽어보세요', summary_line)
    summary_line = re.sub(r'\.\s*$', '', summary_line)
    summary_line = summary_line.strip()
    
    # ── 섹션 콘텐츠 분류 ──
    why_content = ''
    symptom_content = ''
    solution_content = ''
    action_content = ''
    warning_content = ''
    
    for sec_title, sec_text in sections.items():
        sec_text_clean = simplify_terms(simplify_tone(sec_text))
        lower = sec_title.lower()
        
        if any(k in lower for k in ['개요', '병태생리', '원인', '기전', '개론', '변화', '의미']):
            why_content += sec_text_clean + '\n\n'
        elif any(k in lower for k in ['증상', '징후', '패턴', '단계']):
            symptom_content += sec_text_clean + '\n\n'
        elif any(k in lower for k in ['치료', '관리', '진단', '모니터링', '교정', '프로그램', '해결', '방법', '급여', '영양', '훈련']):
            solution_content += sec_text_clean + '\n\n'
        elif any(k in lower for k in ['예방', '실천', '환경', '평가', '효과']):
            action_content += sec_text_clean + '\n\n'
        elif any(k in lower for k in ['주의', '위험', '응급']):
            warning_content += sec_text_clean + '\n\n'
        else:
            # Default: add to solution
            solution_content += sec_text_clean + '\n\n'
    
    # ── 조합 ──
    parts = []
    parts.append(f'한 줄 요약: {summary_line}')
    parts.append('')
    
    # 왜 중요할까요?
    parts.append('왜 중요할까요?')
    parts.append('')
    if why_content.strip():
        # Trim to reasonable length and clean up
        why_lines = [l.strip() for l in why_content.strip().split('\n') if l.strip()]
        parts.extend(why_lines[:8])
    else:
        parts.append(f'{title}은(는) {animal_kr} 보호자라면 꼭 알아야 하는 내용이에요.')
        parts.append(f'제때 관리하지 않으면 우리 아이 건강에 큰 문제가 생길 수 있어요.')
    parts.append('')
    
    # 어떤 증상이 나타날까요?
    parts.append('어떤 증상이 나타날까요?')
    parts.append('')
    if symptom_content.strip():
        sym_lines = [l.strip() for l in symptom_content.strip().split('\n') if l.strip()]
        parts.extend(sym_lines[:10])
    else:
        parts.append(f'평소와 다른 행동이나 모습이 보이면 주의 깊게 살펴봐야 해요.')
        parts.append(f'밥을 잘 안 먹거나, 기운이 없거나, 평소와 다르게 행동하면 신호일 수 있어요.')
    parts.append('')
    
    # 어떻게 해결할 수 있을까요?
    parts.append('어떻게 해결할 수 있을까요?')
    parts.append('')
    if solution_content.strip():
        sol_lines = [l.strip() for l in solution_content.strip().split('\n') if l.strip()]
        parts.extend(sol_lines[:12])
    else:
        parts.append(f'수의사 선생님과 상담하는 게 가장 좋아요.')
        parts.append(f'집에서도 할 수 있는 관리 방법이 있어요.')
    parts.append('')
    
    # 우리 아이를 지키는 방법
    parts.append('우리 아이를 지키는 방법')
    parts.append('')
    if action_content.strip():
        act_lines = [l.strip() for l in action_content.strip().split('\n') if l.strip()]
        parts.extend(act_lines[:6])
    else:
        parts.append(f'정기적으로 건강검진 받기')
        parts.append(f'평소 우리 아이의 행동을 잘 관찰하기')
        parts.append(f'이상한 점이 보이면 바로 수의사 선생님께 가기')
        if animal in ('dog', 'both'):
            parts.append(f'매일 적당한 운동과 산책하기')
        parts.append(f'좋은 사료로 영양 관리 잘 해주기')
    parts.append('')
    
    # 꼭 기억하세요!
    parts.append('꼭 기억하세요!')
    parts.append('')
    if warning_content.strip():
        warn_lines = [l.strip() for l in warning_content.strip().split('\n') if l.strip()]
        parts.extend(warn_lines[:3])
    else:
        parts.append(f'조금이라도 이상하면 빨리 수의사 선생님께 가는 게 중요해요.')
        parts.append(f'인터넷 정보만 믿지 말고, 우리 아이에게 맞는 진료를 받아주세요.')
    
    return '\n'.join(parts)

# ─── 메인 처리 ───
def main():
    print(f'[{datetime.now().isoformat()}] 시작: content-db.json 로딩...')
    
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Flatten topics
    all_topics = []
    for cat in data['categories']:
        for sub in cat.get('subcategories', []):
            for topic in sub.get('topics', []):
                topic['_cat'] = cat['name']
                topic['_sub'] = sub['name']
                all_topics.append(topic)
    
    print(f'전체 주제: {len(all_topics)}개')
    
    # All topics with actual content (no minimum viralScore)
    candidates = [t for t in all_topics if len(t.get('fullContent', '')) > 50]
    candidates.sort(key=lambda x: x.get('viralScore', 0), reverse=True)
    print(f'처리 대상 (viralScore>=80, content>100): {len(candidates)}개')
    
    # Load existing progress
    enhancements = {}
    if os.path.exists(OUT_PATH):
        try:
            with open(OUT_PATH, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                enhancements = existing.get('enhancements', {})
                print(f'기존 진행분 로드: {len(enhancements)}개')
        except:
            pass
    
    processed = 0
    skipped = 0
    errors = 0
    
    for i, topic in enumerate(candidates):
        title = topic['title']
        
        # Skip already processed
        if title in enhancements:
            skipped += 1
            continue
        
        try:
            html_content = topic.get('fullContent', '')
            sections = extract_sections(html_content)
            
            animal = topic.get('animal', 'both')
            tags = topic.get('tags', [])
            description = topic.get('description', '')
            key_points = topic.get('keyPoints', [])
            
            # Generate easyContent
            easy = generate_easy_content(title, description, sections, animal, tags, key_points)
            
            # Generate imagePrompts
            img_prompts = generate_image_prompts(title, animal, tags, list(sections.keys()))
            
            enhancements[title] = {
                'easyContent': easy,
                'imagePrompts': img_prompts
            }
            
            processed += 1
            
            # Save every 50 topics
            if processed % 50 == 0:
                output = {
                    'generatedAt': datetime.now().astimezone().isoformat(),
                    'stats': {
                        'totalCandidates': len(candidates),
                        'processed': len(enhancements),
                        'currentBatch': processed,
                        'skipped': skipped,
                        'errors': errors
                    },
                    'enhancements': enhancements
                }
                with open(OUT_PATH, 'w', encoding='utf-8') as f:
                    json.dump(output, f, ensure_ascii=False, indent=2)
                print(f'  [{i+1}/{len(candidates)}] 저장 완료 ({len(enhancements)}개)')
        
        except Exception as e:
            errors += 1
            print(f'  에러 [{title}]: {e}')
    
    # Final save
    output = {
        'generatedAt': datetime.now().astimezone().isoformat(),
        'stats': {
            'totalCandidates': len(candidates),
            'processed': len(enhancements),
            'newInThisRun': processed,
            'skipped': skipped,
            'errors': errors
        },
        'enhancements': enhancements
    }
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f'\n=== 완료 ===')
    print(f'총 처리: {len(enhancements)}개')
    print(f'이번 실행 신규: {processed}개')
    print(f'스킵(기존): {skipped}개')
    print(f'에러: {errors}개')
    print(f'출력: {OUT_PATH}')

if __name__ == '__main__':
    main()
