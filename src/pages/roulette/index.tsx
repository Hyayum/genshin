import React, { useState, useRef, useEffect, useTransition } from "react";
import Head from "next/head"
import { Star, StarOutline } from "@mui/icons-material";
import { motion } from "framer-motion";
import { Howl } from "howler";
import * as Enka from "@/enka";
import { shuffle } from "@/common/util";
import { PUBLIC_BASE_PATH } from "@/common/config";
import styles from "./style.module.css";

type Party = {
  charaIds: string[];
  stg1: number;
  stg2: number;
  stg3: number;
};

type MovingChara = {
  partyIdx: number;
  charaId: string;
  mouseX: number;
  mouseY: number;
  leftMouseDiff: number;
  topMouseDiff: number;
};

const charaIconSize = 90;

const elementUrl = (elm: string) => (elm == "None" ? "" : `${PUBLIC_BASE_PATH}/${elm}.png`);

export default function Roulette() {
  const [allCharaList, setAllCharaList] = useState<Enka.CharacterData[]>([]);
  const [charaList, setCharaList] = useState<Enka.CharacterData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [parties, setParties] = useState<Party[]>([{ charaIds: [], stg1: 0, stg2: 0, stg3: 0 }]);
  const [leftCharaIds, setLeftCharaIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"Roulette" | "List" | "CharaSelect">("CharaSelect");
  const [isChoosing, setIsChoosing] = useState(false);
  const [chosenCharaId, setChosenCharaId] = useState<string | null>(null);
  const [movingChara, setMovingChara] = useState<MovingChara | null>(null);
  const movingCharaData = charaList.find((c) => c.id == movingChara?.charaId);
  const firstPartyIconRefs = useRef<(HTMLDivElement | null)[]>(Array(8).fill(null));
  const partyIconLeftXs = useRef<number[]>(Array(8).fill(0));

  const [rouletteSound, setRouletteSound] = useState<Howl | null>(null);
  const [rouletteSoundLoop, setRouletteSoundLoop] = useState<Howl | null>(null);
  const [rouletteEndSound, setRouletteEndSound] = useState<Howl | null>(null);
  const [soundReloadFlag, setSoundReloadFlag] = useState(0);
  const rouletteSoundIdRef = useRef<number | null>(null);
  const rouletteSoundLoopIdRef = useRef<number | null>(null);
  const rouletteEndSoundIdRef = useRef<number | null>(null);
  useEffect(() => {
    setRouletteSound(new Howl({ src: [`${PUBLIC_BASE_PATH}/roulette.mp3`], pool: 4 } ));
    setRouletteSoundLoop(new Howl({ src: [`${PUBLIC_BASE_PATH}/roulette_loop.mp3`], loop: true, pool: 1 }));
    setRouletteEndSound(new Howl({ src: [`${PUBLIC_BASE_PATH}/roulette_end.mp3`], pool: 1 }));
  }, [soundReloadFlag]);


  const isLastParty = parties[parties.length - 1].charaIds.length % 8 + leftCharaIds.length <= 8;
  const rouletteFinished = (parties[parties.length - 1].charaIds.length >= 8 && parties.length * 8 >= charaList.length) ||
    (charaList.length < 8 && parties[parties.length - 1].charaIds.length >= charaList.length);

  const getCharaList = async () => {
    const travelerId = "10000005-501";
    const idCharaMap = await Enka.getCharacterList();
    const charasForRoulette = Object.values(idCharaMap).filter((c) => (
      ((!Number.isNaN(Number(c.id)) && Number(c.id) < 10000900) || c.id == travelerId) &&
      c.id != "10000005" && c.id != "10000007"
    )).map((c) => c.id == travelerId ? { ...c, iconUrl: `${PUBLIC_BASE_PATH}/traveler.png` } : c);
    setAllCharaList(charasForRoulette.sort((a, b) => a.id.localeCompare(b.id)));
    setCharaList(charasForRoulette);
  };

  const fixCharaList = () => {
    setCharaList((prev) => shuffle(prev));
    setLeftCharaIds(charaList.map(c => c.id));
    setMode("Roulette");
  };

  useEffect(() => {
    if (allCharaList.length == 0) startTransition(getCharaList);
    partyIconLeftXs.current = firstPartyIconRefs.current.map((icon) => {
      if (!icon) return 0;
      const rect = icon?.getBoundingClientRect();
      const leftX = rect.left + window.screenX;
      return leftX;
    });
  }, [mode]);

  const playRouletteSound = () => {
    const id = rouletteSoundIdRef.current;
    if (id !== null && rouletteSound && rouletteSound.playing(id)) rouletteSound.stop(id);
    if (rouletteSound) rouletteSoundIdRef.current = rouletteSound.play();
  };

  const playRouletteSoundLoop = () => {
    const id = rouletteSoundLoopIdRef.current;
    if (id !== null && rouletteSoundLoop && rouletteSoundLoop.playing(id)) rouletteSoundLoop.stop(id);
    if (rouletteSoundLoop) rouletteSoundLoopIdRef.current = rouletteSoundLoop.play();
  };

  const playRouletteEndSound = () => {
    const id = rouletteEndSoundIdRef.current;
    if (id !== null && rouletteEndSound && rouletteEndSound.playing(id)) rouletteEndSound.stop(id);
    if (rouletteEndSound) rouletteEndSoundIdRef.current = rouletteEndSound.play();
  };

  const setParty = (party: Party, i: number) => {
    setParties((prev) => prev.map((p, j) => i == j ? party : p));
  };

  const addParty = (init: Party = { charaIds: [], stg1: 0, stg2: 0, stg3: 0 }) => {
    setParties((prev) => [...prev, init]);
  };

  const addCharacters = (charaIds: string[]) => {
    const targetParty = parties[parties.length - 1];
    if (targetParty.charaIds.length >= 8) {
      addParty({ charaIds: charaIds, stg1: 0, stg2: 0, stg3: 0 });
    } else {
      setParty({ ...targetParty, charaIds: [...targetParty.charaIds, ...charaIds] }, parties.length - 1);
    }
    setLeftCharaIds((prev) => prev.filter((c) => !charaIds.includes(c)));
  };

  const startRoulette = () => {
    if (rouletteFinished) {
      setMode("List");
      return;
    }
    if (isLastParty) {
      if (parties[parties.length - 1].charaIds.length < 8) {
        setParty({ ...parties[parties.length - 1], charaIds: [...parties[parties.length - 1].charaIds, ...leftCharaIds] }, parties.length - 1);
      } else {
        addParty({ charaIds: leftCharaIds, stg1: 0, stg2: 0, stg3: 0 });
      }
      setLeftCharaIds(charaList.filter((c) => !leftCharaIds.includes(c.id)).map((c) => c.id));
      return;
    }
    if (!leftCharaIds.length) return;
    setIsChoosing(true);
    const currentIdx = charaList.findIndex((c) => c.id == chosenCharaId);
    const leftCharaIndices = charaList.map((c, i) => ({ ...c, idx: i })).filter((c) => leftCharaIds.includes(c.id)).map((c) => c.idx);
    const startIdxCandidates = leftCharaIndices.filter((idx) => currentIdx < idx );
    const startIdx = startIdxCandidates.length ? Math.min(...startIdxCandidates) : leftCharaIndices[0];
    const targetIdx = leftCharaIndices[Math.floor(Math.random() * leftCharaIndices.length)];  // だいたいの目標
    // console.log("start", startIdx, charaList[startIdx].nameJP)
    // console.log("target", targetIdx, charaList[targetIdx].nameJP);

    const accl = 13;
    const baseDistance = 60 ** 2 / (2 * accl); // s = v^2 / 2a
    const distance = leftCharaIndices.length * Math.round((baseDistance - (targetIdx - startIdx)) / leftCharaIndices.length) + targetIdx - startIdx;
    const initSpeed = Math.sqrt(2 * accl * distance) // v^2 = 2as
    const maxSoundSpeed = 18;  // mp3
    const soundSlowSpeed = 10;

    let last = performance.now();
    let lastChanged = performance.now();
    let lastChangedInterval = 0;
    let isHighSpeedSound = true;
    let isHighSpeedSoundPlaying = false;
    let frameId: number | null = null;
    let currentSpeed = initSpeed;
    let currentPosition = startIdx;
    let currentDecimal = 0;
    let highSpeedSoundStartedAt = 0;
    let highSpeedSoundLastPlayedAt = 0;
    const loop = (now: number) => {
      const time = Math.max(now - last, 0) / 1000;
      last = now;
      const dist = currentSpeed * time;
      const dispAccl = currentSpeed > 5 ? accl * 1.05 : currentSpeed > 4 ? accl / 6 : currentSpeed > 3 ? accl / 8 : currentSpeed > 2 ? accl / 10 : accl;
      currentSpeed = Math.max(currentSpeed - dispAccl * time, 0);
      const isEnd = currentSpeed <= 0 && now - lastChanged > lastChangedInterval;
      const nextPosition = isEnd ? leftCharaIndices[(leftCharaIndices.findIndex((idx) => idx == currentPosition) + 1) % leftCharaIndices.length] :
        leftCharaIndices[Math.max(Math.floor((leftCharaIndices.findIndex((idx) => idx == currentPosition) + currentDecimal + dist) % leftCharaIndices.length), 0)];

      if (currentPosition != nextPosition) {
        setChosenCharaId(charaList[nextPosition].id);
        lastChangedInterval = now - lastChanged;
        lastChanged = now;
        if (isHighSpeedSound && currentSpeed < soundSlowSpeed) {
          isHighSpeedSound = false;
          if (isHighSpeedSoundPlaying) {
            // switch to slow mode
            const playedDuration = performance.now() - highSpeedSoundStartedAt;
            const timeFromLastSound = playedDuration % (1000 / maxSoundSpeed)
            highSpeedSoundLastPlayedAt = playedDuration - timeFromLastSound + highSpeedSoundStartedAt;
            if (rouletteSoundLoopIdRef.current !== null && rouletteSoundLoop) {
              rouletteSoundLoop.fade(1.0, 0.0, 50, rouletteSoundLoopIdRef.current);
              setTimeout(() => {
                rouletteSoundLoopIdRef.current !== null && rouletteSoundLoop.stop(rouletteSoundLoopIdRef.current);
              }, 60);
            }
            isHighSpeedSoundPlaying = false;
          }
        }
      }
      if (currentPosition != nextPosition && !isEnd && !isHighSpeedSound && performance.now() - highSpeedSoundLastPlayedAt >= 1000 / (maxSoundSpeed + 10)) {
        playRouletteSound();
      }
      if (isHighSpeedSound) {
        if (!isHighSpeedSoundPlaying) {
          playRouletteSoundLoop();
          isHighSpeedSoundPlaying = true;
          highSpeedSoundStartedAt = performance.now();
        }
      }
      if (isEnd && frameId !== null) {
        cancelAnimationFrame(frameId);
        addCharacters([charaList[nextPosition].id]);
        playRouletteEndSound();
        setTimeout(() => {
          Howler.stop();
          Howler.unload();
          Howler.ctx.close().then(() => {
            Howler.ctx = new AudioContext();
            Howler.masterGain = Howler.ctx.createGain();
            Howler.masterGain.connect(Howler.ctx.destination);
          });
          setSoundReloadFlag((prev) => prev + 1);
          setIsChoosing(false);
        }, 500);
        return;
      }
      currentPosition = nextPosition;
      currentDecimal = (currentDecimal + dist) % 1;
      requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
  };

  const switchCharacters = (partyIdx: number, charaIdx1: number, charaIdx2: number) => {
    if (charaIdx1 == charaIdx2) return;
    const charaIds = parties[partyIdx].charaIds;
    if (charaIdx1 >= charaIds.length || charaIdx2 >= charaIds.length) return;
    const changedCharaIds = charaIds.map((id, i) => i == charaIdx1 ? charaIds[charaIdx2] : i == charaIdx2 ? charaIds[charaIdx1] : id);
    setParty({ ...parties[partyIdx], charaIds: changedCharaIds }, partyIdx);
  };

  const startMoveCharacter = (partyIdx: number, charaId: string, target: HTMLDivElement, mouseX: number, mouseY: number) => {
    if (mode != "List" || !charaId) return;
    const rect = target.getBoundingClientRect();
    const leftX = rect.left + window.scrollX;
    const topY = rect.top + window.scrollY;
    setMovingChara({ partyIdx, charaId, mouseX, mouseY, leftMouseDiff: mouseX - leftX, topMouseDiff: mouseY - topY });
  };

  const moveCharacter = (mouseX: number, mouseY: number) => {
    if (mode != "List" || !movingChara) return;
    const leftX = mouseX - movingChara.leftMouseDiff;
    const currentCharaIdx = parties[movingChara.partyIdx].charaIds.findIndex((id) => movingChara.charaId == id);
    const nextCharaIdx = partyIconLeftXs.current.map((x) => Math.abs(x - leftX)).findIndex((diff, i, diffs) => Math.abs(Math.min(...diffs) - diff) == 0);
    switchCharacters(movingChara.partyIdx, currentCharaIdx, nextCharaIdx);
    setMovingChara((prev) => prev ? { ...prev, mouseX, mouseY } : null);
  };

  const finishMoveCharacter = () => {
    if (mode != "List" || !movingChara) return;
    setMovingChara(null);
  };

  const mouseStartMoveCharacter = (e: React.MouseEvent<HTMLDivElement>, partyIdx: number, charaId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const mouseX = e.pageX;
    const mouseY = e.pageY;
    const target = e.currentTarget;
    startMoveCharacter(partyIdx, charaId, target, mouseX, mouseY);
  };

  const mouseMoveCharacter = (e: React.MouseEvent<HTMLDivElement>) => {
    const mouseX = e.pageX;
    const mouseY = e.pageY;
    moveCharacter(mouseX, mouseY);
  };

  const touchStartMoveCharacter = (e: React.TouchEvent<HTMLDivElement>, partyIdx: number, charaId: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    const target = e.currentTarget;
    startMoveCharacter(partyIdx, charaId, target, x, y);
  };

  const touchMoveCharacter = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    moveCharacter(x, y);
  };

  return (
    <div
      onMouseMove={mouseMoveCharacter}
      onTouchMove={touchMoveCharacter}
      onMouseUp={finishMoveCharacter}
      onTouchEnd={finishMoveCharacter}
      style={{ backgroundColor: "#111", color: "#fff", padding: 40, width: "100%", minWidth: 1000, height: "100%", minHeight: "100vh" }}
    >
      <Head>
        <title>ルーレット螺旋（ジェネリック）</title>
        <meta property="og:title" content="ルーレット螺旋（ジェネリック）"></meta>
      </Head>
      <div style={{ fontSize: 30, textAlign: "center", marginBottom: 40 }}>
        ルーレット螺旋（ジェネリック）
      </div>
      {mode != "CharaSelect" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
          {parties.map((p, i) => mode == "Roulette" && i != parties.length - 1 ? (
            <></>
          ) : (
            <div style={{ display: "flex", gap: 5, alignItems: "center" }} key={`party_${i}`}>
              <div style={{ fontSize: 40, width: 70, textAlign: "center" }}>{ i + 1 }</div>
              {Array(8).fill(0).map((_, j) => {
                const charaId = p.charaIds[j];
                const chara = charaList.find(c => c.id == charaId);
                const isMoving = !!(chara && movingChara?.charaId == charaId && i == movingChara?.partyIdx);
                return (
                  <motion.div
                    key={`chara_${i}_${charaId || j}_${mode}`}
                    layout
                    transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
                  >
                    <CharaIcon
                      ref={(el) => { if (i == 0) { firstPartyIconRefs.current[j] = el; } }}
                      iconUrl={chara?.iconUrl || ""}
                      element={chara?.element || "None"}
                      bgcolor={chara?.bgcolor || "#222"}
                      name={chara?.nameJP || ""}
                      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => mouseStartMoveCharacter(e, i, charaId)}
                      onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => touchStartMoveCharacter(e, i, charaId)}
                      style={{
                        opacity: isMoving ? 0.3 : p.stg1 + p.stg2 + p.stg3 >= 9 ? 0.5 : 1,
                        marginLeft: mode == "List" && j == 4 ? 20 : 0,
                        zIndex: isMoving ? 0 : 1,
                        cursor: mode == "List" ? "pointer" : "default",
                      }}
                    />
                  </motion.div>
                );
              })}
              {mode == "List" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginLeft: 10 }}>
                  <Stars count={p.stg1} setCount={(n: number) => setParty({ ...p, stg1: n }, i)} />
                  <Stars count={p.stg2} setCount={(n: number) => setParty({ ...p, stg2: n }, i)} />
                  <Stars count={p.stg3} setCount={(n: number) => setParty({ ...p, stg3: n }, i)} />
                </div>
              )}
              {movingChara && movingCharaData && (
                <CharaIcon
                  iconUrl={movingCharaData.iconUrl}
                  element={movingCharaData.element}
                  bgcolor={movingCharaData.bgcolor}
                  name={movingCharaData.nameJP}
                  style={{
                    position: "absolute",
                    top: movingChara.mouseY - movingChara.topMouseDiff,
                    left: movingChara.mouseX - movingChara.leftMouseDiff,
                    zIndex: 2,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {mode == "Roulette" && (
        <>
          <div style={{ display: "flex", justifyContent: "center", margin: 30 }}>
            <button
              className={[styles.rouletteButton, isChoosing || charaList.length == 0 ? styles.disabled : ""].join(" ")}
              disabled={isChoosing || charaList.length == 0}
              onClick={startRoulette}
            >
              {charaList.length == 0 && isPending ? "読込中..." : rouletteFinished ? "結果一覧" : isLastParty ? "残りのメンバーを確定" : "抽選"}
            </button>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", marginLeft: "auto", alignItems: "center", gap: 15, marginBottom: 10, marginRight: 20 }}>
              {["Fire", "Water", "Wind", "Electric", "Grass", "Ice", "Rock"].map((elm) => (
                <div key={`element_${elm}`} style={{ display: "flex", alignItems: "center" }}>
                  <img src={elementUrl(elm)} alt={elm} style={{ width: 30, height: 30 }} />
                  <div style={{ fontSize: 20, width: 30 }}>{ charaList.filter((c) => c.element == elm && leftCharaIds.includes(c.id)).length }</div>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 20, height: 20, backgroundColor: Enka.RarityColor.QUALITY_ORANGE, borderRadius: "50%", marginRight: 2 }} />
                <div style={{ fontSize: 20, width: 30 }}>{ charaList.filter((c) => c.rarity == 5 && leftCharaIds.includes(c.id)).length }</div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 20, height: 20, backgroundColor: Enka.RarityColor.QUALITY_PURPLE, borderRadius: "50%", marginRight: 2 }} />
                <div style={{ fontSize: 20, width: 30 }}>{ charaList.filter((c) => c.rarity == 4 && leftCharaIds.includes(c.id)).length }</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 7, marginBottom: 150 }}>
            {charaList.map((chara, i) => {
              const alreadySelected = !leftCharaIds.includes(chara.id);
              return (
                <CharaIcon
                  key={`chara_${i}`}
                  iconUrl={chara.iconUrl}
                  element={chara.element}
                  bgcolor={chara.bgcolor}
                  name={chara.nameJP}
                  selected={chara.id == chosenCharaId}
                  disabled={alreadySelected}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!alreadySelected) addCharacters([chara.id]);
                  }}
                  style={{ cursor: alreadySelected ? "default" : "pointer" }}
                />
              );
            })}
          </div>
        </>
      )}
      {mode == "CharaSelect" && (
        <>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, margin: 30 }}>
            <button
              className={[styles.rouletteButton, charaList.length == 0 ? styles.disabled : ""].join(" ")}
              disabled={charaList.length == 0}
              onClick={fixCharaList}
            >
              {allCharaList.length == 0 && isPending ? "読込中..." : "使用キャラ決定"}
            </button>
            <div style={{ fontSize: 14 }}>未所持キャラなどを除外できます</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 7, marginBottom: 150 }}>
            {allCharaList.map((chara, i) => {
              const alreadyInList = charaList.some(c => c.id == chara.id);
              return (
                <CharaIcon
                  key={`chara_${i}`}
                  iconUrl={chara.iconUrl}
                  element={chara.element}
                  bgcolor={chara.bgcolor}
                  name={chara.nameJP}
                  selected={chara.id == chosenCharaId}
                  disabled={!alreadyInList}
                  onClick={(e) => {
                    e.preventDefault();
                    if (alreadyInList) setCharaList((prev) => prev.filter(c => c.id != chara.id));
                    else setCharaList((prev) => [...prev, chara]);
                  }}
                />
              );
            })}
          </div>
        </>
      )}
      {mode == "Roulette" && (
        <div style={{ display: "flex" }}>
          <button
            className={[styles.rouletteButton, isChoosing ? styles.disabled : ""].join(" ")}
            disabled={isChoosing}
            onClick={() => setMode("List")}
            style={{ marginLeft: "auto" }}
          >
            結果一覧⇒
          </button>
        </div>
      )}
      {mode == "List" && !rouletteFinished && (
        <button
          className={[styles.rouletteButton, isChoosing ? styles.disabled : ""].join(" ")}
          disabled={isChoosing}
          onClick={() => setMode("Roulette")}
        >
          ⇐ルーレット
        </button>
      )}
      <div style={{ backgroundColor: "#444", borderRadius: 10, padding: 20, width: "40%", minWidth: 500, marginTop: 20, marginBottom: 40 }}>
        <div style={{ fontSize: 14 }}>▼今回使用するパーティー</div>
        {parties.map((p, i) => (
          <div key={`partyText_${i}`} style={{ fontSize: 14 }}>
            {i + 1}: {p.charaIds.map((id) => charaList.find((c) => c.id == id)?.nameJP).join("/")}
          </div>
        ))}
        <div style={{ fontSize: 22, marginTop: 20 }}>
          {`${parties.filter((p) => p.stg1 + p.stg2 + p.stg3 >= 9).length}/${parties.length}ｸﾘｱ(★${parties.reduce((acc, p) => acc + p.stg1 + p.stg2 + p.stg3, 0)}/${parties.length * 9})`}
        </div>
      </div>
    </div>
  );
}

const CharaIcon = ({
  iconUrl,
  element,
  bgcolor,
  name,
  onClick = (e) => {e.preventDefault()},
  onMouseDown = (e) => {e.preventDefault()},
  onTouchStart = (e) => {e.preventDefault()},
  style = {},
  selected = false,
  disabled = false,
  ref = null,
}: {
  iconUrl: string;
  element: Enka.Element;
  bgcolor: string;
  name: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  onTouchStart?: React.TouchEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
  selected?: boolean;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}) => {
  const elementIconStyle: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, width: "25%", height: "25%", opacity: disabled ? 0.3 : 1,
  };
  const mainStyle: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: disabled ? 0.3 : 1, borderRadius: 5,
  };
  return (
    <div
      ref={ref}
      style={{ position: "relative", width: charaIconSize, height: charaIconSize, cursor: "pointer", userSelect: "none", ...style }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div style={{ ...mainStyle, backgroundColor: bgcolor }} />
      {iconUrl && (
        <img src={iconUrl} alt={name} style={mainStyle} />
      )}
      {elementUrl(element) && (
        <>
          <div style={{ ...elementIconStyle, backgroundColor: "#222", borderRadius: "50%", filter: "blur(1px)", opacity: 0.7 }} />
          <img src={elementUrl(element)} alt={element} style={{ ...elementIconStyle }} />
        </>
      )}
      {selected && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderWidth: selected ? 3 : 0, borderColor: "#fe2", borderRadius: 5 }} />
      )}
    </div>
  );
};

const Stars = ({
  count,
  setCount,
}: {
  count: number;
  setCount: (n: number) => void;
}) => {
  const onClickStar = (n: number) => {
    setCount(n == count ? 0 : n);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
      {Array(3).fill(0).map((_, i) => i < count ? (
        <Star key={`star_${i}`} onClick={() => onClickStar(i + 1)} sx={{ cursor: "pointer" }} fontSize="medium" />
      ) : (
        <StarOutline key={`star_${i}`} onClick={() => onClickStar(i + 1)} sx={{ cursor: "pointer" }} fontSize="medium" style={{ opacity: 0.5 }} />
      ))}
    </div>
  );
};