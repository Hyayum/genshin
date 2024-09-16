import requests
import json

rarity5 = ["PlayerBoy", "PlayerGirl", "Qin", "Diluc", "Mona", "Qiqi", "Keqing", "Venti", "Klee", 
           "Zhongli", "Tartaglia", "Ganyu", "Albedo", "Xiao", "Hutao", "Eula", "Kazuha",
           "Aloy", "Yoimiya", "Ayaka", "Shougun", "Kokomi", "Itto", "Shenhe", "Yae", "Ayato", "Yelan",
           "Tighnari", "Nilou", "Cyno", "Nahida", "Wanderer", "Alhatham", "Dehya", "Baizhuer",
           "Liney", "Wriothesley", "Neuvillette", "Furina", "Navia", "Liuyun", "Chiori", "Arlecchino", "Sigewinne", "Clorinde", "Emilie",
           "Kinich", "Mualani"]

res = requests.get("https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json")
data = json.loads(res.text)
for k, v in data.items():
    name = v["SideIconName"].split("UI_AvatarIcon_Side_")[1]
    print(f"  \"{k}\": {'{'}")
    print(f"    name: \"{name}\",")
    print(f"    rarity: {5 if name in rarity5 else 4},")
    print(f"  {'}'},")