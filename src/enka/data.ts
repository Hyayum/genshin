import { charaListUrl, jpNameMapUrl } from "@/enka/settings";
import { generateCacheBustQueryString } from "@/common/util";

export type Element = "Fire" | "Water" | "Wind" | "Electric" | "Grass" | "Ice" | "Rock" | "None";

interface EnkaCharacterData {
  SideIconName: string;
  QualityType: "QUALITY_ORANGE" | "QUALITY_PURPLE" | "QUALITY_ORANGE_SP";
  Element: Element;
};

export interface CharacterData {
  id: string;
  iconUrl: string;
  bgcolor: string;
  nameEnka: string;
  nameJP: string;
  element: Element;
  rarity: number;
};

export interface CharacterList {
  [id: string]: CharacterData
};

export const RarityColor = {
  QUALITY_ORANGE: "#a63",
  QUALITY_PURPLE: "#76a",
  QUALITY_ORANGE_SP: "#a55",
};

export const getCharacterList = async () => {
  const [charaList, jpNameMap] = await Promise.all([
    fetch(`${charaListUrl}?${generateCacheBustQueryString()}`).then(res => res.json() as Promise<Record<string, EnkaCharacterData>>),
    fetch(`${jpNameMapUrl}?${generateCacheBustQueryString()}`).then(res => res.json() as Promise<Record<string, string>>),
  ]);
  const charaData = Object.entries(charaList).reduce((acc, [id, data]) => {
    if (!data.SideIconName) return acc;
    const nameEnka = data.SideIconName.match(/^\/ui\/UI_AvatarIcon_Side_(.+)\.png$/)?.[1] || "";
    return {
      ...acc,
      [id]: {
        id: id,
        iconUrl: `https://enka.network/ui/UI_AvatarIcon_${nameEnka}.png`,
        bgcolor: RarityColor[data.QualityType],
        nameEnka: nameEnka,
        nameJP: jpNameMap[nameEnka] || nameEnka,
        element: data.Element,
        rarity: data.QualityType == "QUALITY_PURPLE" ? 4 : 5,
      },
    }
  }, {} as Record<string, CharacterData>);
  return charaData;
};

export const statusNames: { [k: string]: string } = {
  "FIGHT_PROP_BASE_ATTACK": "基礎攻撃力",
  "FIGHT_PROP_HP": "HP+",
  "FIGHT_PROP_ATTACK": "攻撃力+",
  "FIGHT_PROP_DEFENSE": "防御力+",
  "FIGHT_PROP_HP_PERCENT": "HP%",
  "FIGHT_PROP_ATTACK_PERCENT": "攻撃力%",
  "FIGHT_PROP_DEFENSE_PERCENT": "防御力%",
  "FIGHT_PROP_CRITICAL": "会心率",
  "FIGHT_PROP_CRITICAL_HURT": "会心ダメージ",
  "FIGHT_PROP_CHARGE_EFFICIENCY": "元素チャージ効率",
  "FIGHT_PROP_HEAL_ADD": "与える治療効果",
  "FIGHT_PROP_ELEMENT_MASTERY": "元素熟知",
  "FIGHT_PROP_PHYSICAL_ADD_HURT": "物理ダメージ",
  "FIGHT_PROP_FIRE_ADD_HURT": "炎元素ダメージ",
  "FIGHT_PROP_ELEC_ADD_HURT": "雷元素ダメージ",
  "FIGHT_PROP_WATER_ADD_HURT": "水元素ダメージ",
  "FIGHT_PROP_WIND_ADD_HURT": "風元素ダメージ",
  "FIGHT_PROP_ICE_ADD_HURT": "氷元素ダメージ",
  "FIGHT_PROP_ROCK_ADD_HURT": "岩元素ダメージ",
  "FIGHT_PROP_GRASS_ADD_HURT": "草元素ダメージ",
};