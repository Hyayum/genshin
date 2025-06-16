interface EnkaCharacterData {
  SideIconName: string;
  QualityType: "QUALITY_ORANGE" | "QUALITY_PURPLE" | "QUALITY_ORANGE_SP";
};

export interface CharacterData {
  iconUrl: string;
  bgcolor: string;
};

export interface CharacterList {
  [id: string]: CharacterData
};

export const getCharacterList = async () => {
  const res = await fetch("https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json");
  const resJson: Record<string, EnkaCharacterData> = await res.json();
  const charaData = Object.entries(resJson).reduce((acc, [id, data]) => ({
    ...acc,
    [id]: {
      iconUrl: `https://enka.network/ui/${data.SideIconName.replace("_Side_", "_")}.png`,
      bgcolor: data.QualityType == "QUALITY_ORANGE" ? "#c95" : data.QualityType == "QUALITY_PURPLE" ? "#87b" : "#a55",
    },
  }), {} as Record<string, CharacterData>);
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