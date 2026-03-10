import { MissionTemplate } from "./types";

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "customer-decision",
    cardTitle: "Customer Decision",
    mission: "고객은 어떤 기준으로 제품을 선택할까요?",
    teamTask: "고객이 제품을 선택할 때 가장 중요한 기준 TOP 5를 정하세요",
    example: "성능, 디자인, 가격, 브랜드, 사용자 경험"
  },
  {
    id: "competitor-think",
    cardTitle: "Think Like a Competitor",
    mission: "경쟁사 직원이라면 우리 제품의 어떤 점을 공격할까요?",
    teamTask: "경쟁사의 시각에서 우리 제품의 치명적인 약점 3가지를 찾아내세요",
    example: "높은 가격대, 복잡한 설정 과정, 부족한 사후 서비스"
  },
  {
    id: "future-news",
    cardTitle: "Future News",
    mission: "3년 뒤 우리 브랜드가 뉴스 1면에 나온다면 어떤 내용일까요?",
    teamTask: "우리 브랜드의 미래 성공 시나리오를 뉴스 헤드라인으로 작성하세요",
    example: "'혁신적인 AI 기술로 글로벌 시장 점유율 1위 달성'"
  },
  {
    id: "user-pain-point",
    cardTitle: "User Pain Point",
    mission: "사용자가 우리 서비스를 이용할 때 가장 짜증나는 순간은 언제일까요?",
    teamTask: "사용자의 여정 중 가장 큰 불편함(Pain Point)을 정의하고 해결책을 제시하세요",
    example: "결제 단계에서의 잦은 오류 -> 간편 결제 시스템 도입"
  },
  {
    id: "brand-personality",
    cardTitle: "Brand Personality",
    mission: "우리 브랜드가 사람이라면 어떤 성격과 외모를 가졌을까요?",
    teamTask: "우리 브랜드의 페르소나를 구체적으로 묘사하세요 (나이, 직업, 성격 등)",
    example: "30대 초반의 세련되고 지적인 IT 전문가, 신뢰감을 주는 말투"
  },
  {
    id: "elevator-pitch",
    cardTitle: "Elevator Pitch",
    mission: "엘리베이터에서 투자자를 만났습니다. 30초 안에 우리를 어떻게 설명할까요?",
    teamTask: "우리 제품의 핵심 가치를 한 문장으로 정의하는 슬로건을 만드세요",
    example: "세상의 모든 복잡함을 단순함으로 바꾸는 혁신 솔루션"
  },
  {
    id: "anti-problem",
    cardTitle: "Anti-Problem",
    mission: "우리 프로젝트를 완전히 망하게 하려면 어떻게 해야 할까요?",
    teamTask: "실패를 위한 완벽한 전략을 세우고, 이를 뒤집어 성공 전략을 도출하세요",
    example: "고객의 피드백을 무시한다 -> 고객 소통 채널 강화"
  },
  {
    id: "superpower",
    cardTitle: "Superpower",
    mission: "우리 팀에게 단 하나의 초능력이 생긴다면 무엇이 좋을까요?",
    teamTask: "업무 효율을 10배 높여줄 '팀 초능력'을 정의하고 활용 방안을 적으세요",
    example: "미래 예측 능력 -> 시장 트렌드 선제적 대응"
  },
  {
    id: "unexpected-use",
    cardTitle: "Unexpected Use",
    mission: "우리 제품을 원래 용도와 전혀 다르게 쓴다면 어떻게 쓸 수 있을까요?",
    teamTask: "우리 제품의 기발하고 엉뚱한 새로운 용도 3가지를 제안하세요",
    example: "스마트폰 거치대를 캠핑용 조명 스탠드로 활용"
  },
  {
    id: "magic-wand",
    cardTitle: "Magic Wand",
    mission: "마법 지팡이가 있다면 우리 조직에서 무엇을 가장 먼저 바꾸고 싶나요?",
    teamTask: "조직 문화나 일하는 방식에서 가장 시급한 변화 1가지를 선정하세요",
    example: "수직적인 보고 체계를 수평적인 공유 문화로 변경"
  }
];
