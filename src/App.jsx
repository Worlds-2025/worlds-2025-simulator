import React, { useState } from 'react';
import { Trophy, Swords, TrendingUp } from 'lucide-react';

const Worlds2025Simulator = () => {
  // 队伍数据（包含赔率区间和赛区）
  const teamsData = {
    'GEN': { name: 'Gen.G', region: 'LCK', oddsRange: [2.10, 2.40], pool: 1 },
    'HLE': { name: 'Hanwha Life', region: 'LCK', oddsRange: [2.80, 3.25], pool: 2 },
    'BLG': { name: 'Bilibili Gaming', region: 'LPL', oddsRange: [4.80, 5.75], pool: 1 },
    'T1': { name: 'T1', region: 'LCK', oddsRange: [5.30, 6.50], pool: 3 },
    'AL': { name: "Anyone's Legend", region: 'LPL', oddsRange: [8.00, 9.50], pool: 2 },
    'TES': { name: 'Top Esports', region: 'LPL', oddsRange: [6.30, 11.00], pool: 2 },
    'KT': { name: 'KT Rolster', region: 'LCK', oddsRange: [12.00, 21.00], pool: 2 },
    'iG': { name: 'Invictus Gaming', region: 'LPL', oddsRange: [15.00, 23.00], pool: 3 },
    'G2': { name: 'G2 Esports', region: 'LEC', oddsRange: [25.00, 51.00], pool: 1 },
    'FLY': { name: 'FlyQuest', region: 'LTA', oddsRange: [30.00, 67.00], pool: 1 },
    'MKOI': { name: 'Movistar KOI', region: 'LEC', oddsRange: [30.00, 71.00], pool: 2 },
    'FNC': { name: 'Fnatic', region: 'LEC', oddsRange: [35.00, 81.00], pool: 3 },
    'CFO': { name: 'CTBC Flying Oyster', region: 'LCP', oddsRange: [35.00, 81.00], pool: 1 },
    'PSG': { name: 'PSG Talon', region: 'LCP', oddsRange: [45.00, 101.00], pool: 3 },
    '100T': { name: '100 Thieves', region: 'LTA', oddsRange: [50.00, 151.00], pool: 3 },
    'TSW': { name: 'Team Secret Whales', region: 'LCP', oddsRange: [75.00, 151.00], pool: 2 },
    'VKS': { name: 'Vivo Keyd Stars', region: 'LTA', oddsRange: [75.00, 251.00], pool: 2 }
  };

  const GAMMA = 0.5; // Bradley-Terry 压缩系数

  // 计算所有队伍的强度（确保概率总和为1）
  const calculateStrengths = () => {
    const selectedOdds = {};
    
    // 步骤1: 为每支队伍在赔率区间内随机选择赔率
    Object.keys(teamsData).forEach(code => {
      const [minOdds, maxOdds] = teamsData[code].oddsRange;
      selectedOdds[code] = minOdds + Math.random() * (maxOdds - minOdds);
    });
    
    // 步骤2: 计算隐含概率
    const impliedProbs = {};
    Object.keys(selectedOdds).forEach(code => {
      impliedProbs[code] = 1 / selectedOdds[code];
    });
    
    // 步骤3: 归一化（使所有队伍的隐含概率总和为1，消除抽水）
    const totalImpliedProb = Object.values(impliedProbs).reduce((sum, p) => sum + p, 0);
    const normalizedProbs = {};
    Object.keys(impliedProbs).forEach(code => {
      normalizedProbs[code] = impliedProbs[code] / totalImpliedProb;
    });
    
    // 步骤4: 从归一化概率计算等效赔率和强度
    const normalizedOdds = {};
    const strengths = {};
    Object.keys(normalizedProbs).forEach(code => {
      normalizedOdds[code] = 1 / normalizedProbs[code];
      strengths[code] = -Math.log(normalizedOdds[code]); // s_i = -ln(odds_normalized)
    });
    
    return { selectedOdds, normalizedOdds, normalizedProbs, strengths };
  };

  // Bradley-Terry 模型计算单局胜率
  const calcBO1WinProb = (sA, sB) => {
    const x = GAMMA * (sA - sB);
    return 1 / (1 + Math.exp(-x)); // sigmoid
  };

  // 施加状态波动到strength上（±10%）
  const applyStrengthFluctuation = (baseStrength) => {
    const fluctuation = 1 + (Math.random() * 0.20 - 0.10); // ±10%
    return baseStrength * fluctuation;
  };

  // BO3 胜率（赢2局或3局）
  const calcBO3WinProb = (p) => {
    // P = p^2*(3-2p) 的简化形式
    // 或完整计算：C(3,2)*p^2*(1-p) + C(3,3)*p^3
    return 3 * p * p * (1 - p) + p * p * p;
  };

  // BO5 胜率（赢3局、4局或5局）
  const calcBO5WinProb = (p) => {
    // C(5,3)*p^3*(1-p)^2 + C(5,4)*p^4*(1-p) + C(5,5)*p^5
    return 10 * Math.pow(p, 3) * Math.pow(1 - p, 2) + 
           5 * Math.pow(p, 4) * (1 - p) + 
           Math.pow(p, 5);
  };

  // 模拟 BO1
  const simulateBO1 = (team1, team2, s1, s2) => {
    const baseProb = calcBO1WinProb(s1, s2); // 基础胜率（无波动）
    
    // 对双方strength各自施加 ±10%状态波动
    const s1Fluctuated = applyStrengthFluctuation(s1);
    const s2Fluctuated = applyStrengthFluctuation(s2);
    const adjustedProb = calcBO1WinProb(s1Fluctuated, s2Fluctuated); // 波动后的胜率
    
    const winner = Math.random() < adjustedProb ? team1 : team2;
    return { 
      team1, team2, winner, 
      baseProb: baseProb.toFixed(3),
      adjustedProb: adjustedProb.toFixed(3)
    };
  };

  // 模拟 BO3
  const simulateBO3 = (team1, team2, s1, s2) => {
    const baseProb = calcBO1WinProb(s1, s2); // 基础单局胜率（无波动）
    
    let score1 = 0, score2 = 0;
    const games = [];
    
    while (score1 < 2 && score2 < 2) {
      // 每局对双方strength各自施加 ±10%状态波动
      const s1Fluctuated = applyStrengthFluctuation(s1);
      const s2Fluctuated = applyStrengthFluctuation(s2);
      const adjustedProb = calcBO1WinProb(s1Fluctuated, s2Fluctuated);
      
      if (Math.random() < adjustedProb) {
        score1++;
        games.push({ winner: team1, team1Prob: adjustedProb });
      } else {
        score2++;
        games.push({ winner: team2, team1Prob: adjustedProb });
      }
    }
    
    const pBO3 = calcBO3WinProb(baseProb); // 理论BO3胜率（无波动）
    
    return { 
      team1, team2, score1, score2, games, 
      winner: score1 === 2 ? team1 : team2,
      baseBO3Prob: pBO3.toFixed(3),
      baseProb: baseProb // 保存基础单局胜率
    };
  };

  // 模拟 BO5
  const simulateBO5 = (team1, team2, s1, s2) => {
    const baseProb = calcBO1WinProb(s1, s2); // 基础单局胜率（无波动）
    
    let score1 = 0, score2 = 0;
    const games = [];
    
    while (score1 < 3 && score2 < 3) {
      // 每局对双方strength各自施加 ±10%状态波动
      const s1Fluctuated = applyStrengthFluctuation(s1);
      const s2Fluctuated = applyStrengthFluctuation(s2);
      const adjustedProb = calcBO1WinProb(s1Fluctuated, s2Fluctuated);
      
      if (Math.random() < adjustedProb) {
        score1++;
        games.push({ winner: team1, team1Prob: adjustedProb });
      } else {
        score2++;
        games.push({ winner: team2, team1Prob: adjustedProb });
      }
    }
    
    const pBO5 = calcBO5WinProb(baseProb); // 理论BO5胜率（无波动）
    
    return { 
      team1, team2, score1, score2, games, 
      winner: score1 === 3 ? team1 : team2,
      baseBO5Prob: pBO5.toFixed(3),
      baseProb: baseProb // 保存基础单局胜率
    };
  };

  // 瑞士轮首轮抽签（POOL1 vs POOL3，POOL2内部，同赛区避战，采用重新抽签策略）
  const drawSwissRound1 = (swissTeams, strengths) => {
    const pool1 = swissTeams.filter(t => t.poolActual === 1);
    const pool2 = swissTeams.filter(t => t.poolActual === 2);
    const pool3 = swissTeams.filter(t => t.poolActual === 3);
    
    const MAX_ATTEMPTS = 1000; // 最大重试次数
    let attempt = 0;
    
    // 检查配对中是否有同赛区对战
    const hasSameRegionMatch = (matches) => {
      return matches.some(match => 
        teamsData[match.team1]?.region === teamsData[match.team2]?.region
      );
    };
    
    // 尝试生成POOL1 vs POOL3的配对
    const tryDrawPool1VsPool3 = () => {
      const shuffledPool1 = [...pool1].sort(() => Math.random() - 0.5);
      const shuffledPool3 = [...pool3].sort(() => Math.random() - 0.5);
      
      const matches = [];
      for (let i = 0; i < shuffledPool1.length; i++) {
        matches.push({ 
          team1: shuffledPool1[i].code, 
          team2: shuffledPool3[i].code 
        });
      }
      return matches;
    };
    
    // 尝试生成POOL2内部的配对
    const tryDrawPool2Internal = () => {
      const shuffledPool2 = [...pool2].sort(() => Math.random() - 0.5);
      
      const matches = [];
      for (let i = 0; i < shuffledPool2.length; i += 2) {
        if (i + 1 < shuffledPool2.length) {
          matches.push({ 
            team1: shuffledPool2[i].code, 
            team2: shuffledPool2[i + 1].code 
          });
        }
      }
      return matches;
    };
    
    // 重新抽签直到没有同赛区对战
    let pool1VsPool3Matches = [];
    let pool2Matches = [];
    
    // POOL1 vs POOL3抽签
    while (attempt < MAX_ATTEMPTS) {
      pool1VsPool3Matches = tryDrawPool1VsPool3();
      if (!hasSameRegionMatch(pool1VsPool3Matches)) {
        break; // 没有同赛区对战，抽签成功
      }
      attempt++;
    }
    
    if (attempt >= MAX_ATTEMPTS) {
      console.warn('POOL1 vs POOL3: 达到最大重试次数，仍存在同赛区对战');
    }
    
    // POOL2内部抽签
    attempt = 0;
    while (attempt < MAX_ATTEMPTS) {
      pool2Matches = tryDrawPool2Internal();
      if (!hasSameRegionMatch(pool2Matches)) {
        break; // 没有同赛区对战，抽签成功
      }
      attempt++;
    }
    
    if (attempt >= MAX_ATTEMPTS) {
      console.warn('POOL2内部: 达到最大重试次数，仍存在同赛区对战');
    }
    
    // 合并所有配对
    return [...pool1VsPool3Matches, ...pool2Matches];
  };

  const [simulated, setSimulated] = useState(false);
  const [results, setResults] = useState(null);

  const runSimulation = () => {
    const { selectedOdds, normalizedOdds, normalizedProbs, strengths } = calculateStrengths();

    // 入围赛: iG vs T1 (BO5)
    const playInResult = simulateBO5('iG', 'T1', strengths['iG'], strengths['T1']);
    const playInWinner = playInResult.winner;
    const playInLoser = playInResult.winner === 'iG' ? 'T1' : 'iG';

    // 确定瑞士轮 POOL 分配
    // POOL2: 五大赛区二号种子 + 入围赛胜出赛区的三号种子
    // POOL3: 剩余队伍
    const pool1Teams = ['GEN', 'BLG', 'CFO', 'G2', 'FLY'];
    let pool2Teams = ['AL', 'HLE', 'TSW', 'MKOI', 'VKS'];
    let pool3Teams = ['PSG', 'FNC', '100T'];
    
    // 根据入围赛结果分配 KT/TES
    if (playInWinner === 'iG') {
      // iG(LPL四号种子)赢了，LPL是入围赛胜出赛区
      pool2Teams.push('TES'); // LPL三号种子进POOL2
      pool3Teams.push('KT', 'iG'); // LCK三号种子和入围赛胜者进POOL3
    } else {
      // T1(LCK四号种子)赢了，LCK是入围赛胜出赛区
      pool2Teams.push('KT'); // LCK三号种子进POOL2
      pool3Teams.push('TES', 'T1'); // LPL三号种子和入围赛胜者进POOL3
    }

    // 瑞士轮参赛队伍
    const swissTeams = [
      ...pool1Teams.map(code => ({ code, poolActual: 1, wins: 0, losses: 0, strength: strengths[code], matchHistory: [] })),
      ...pool2Teams.map(code => ({ code, poolActual: 2, wins: 0, losses: 0, strength: strengths[code], matchHistory: [] })),
      ...pool3Teams.map(code => ({ code, poolActual: 3, wins: 0, losses: 0, strength: strengths[code], matchHistory: [] }))
    ];

    const swissMatches = [];
    const qualified = [];
    const eliminated = [];

    // 瑞士轮第1轮（特殊抽签规则）
    const round1Pairings = drawSwissRound1(swissTeams, strengths);
    const round1Matches = round1Pairings.map(pair => {
      const t1 = swissTeams.find(t => t.code === pair.team1);
      const t2 = swissTeams.find(t => t.code === pair.team2);
      
      if (!t1 || !t2) {
        console.error('Invalid pairing:', pair);
        return null;
      }
      
      const match = simulateBO1(pair.team1, pair.team2, t1.strength, t2.strength);
      
      // 保存比赛前的战绩
      const team1RecordBefore = `${t1.wins}-${t1.losses}`;
      const team2RecordBefore = `${t2.wins}-${t2.losses}`;
      
      if (match.winner === pair.team1) {
        t1.wins++;
        t2.losses++;
      } else {
        t2.wins++;
        t1.losses++;
      }
      
      // 记录比赛历史（包含比赛后的战绩）
      const matchRecord = {
        round: 1,
        opponent: pair.team2,
        result: match.winner === pair.team1 ? 'W' : 'L',
        score: match.winner === pair.team1 ? '1-0' : '0-1',
        type: 'BO1',
        recordAfter: `${t1.wins}-${t1.losses}`
      };
      t1.matchHistory.push(matchRecord);
      
      const matchRecord2 = {
        round: 1,
        opponent: pair.team1,
        result: match.winner === pair.team2 ? 'W' : 'L',
        score: match.winner === pair.team2 ? '1-0' : '0-1',
        type: 'BO1',
        recordAfter: `${t2.wins}-${t2.losses}`
      };
      t2.matchHistory.push(matchRecord2);
      
      return { 
        ...match, 
        type: 'BO1', 
        decisive: false,
        team1RecordBefore,
        team2RecordBefore
      };
    }).filter(m => m !== null);
    
    swissMatches.push({ round: 1, matches: round1Matches });

    // 瑞士轮第2-5轮（常规配对）
    for (let r = 2; r <= 5; r++) {
      const activeTeams = swissTeams.filter(t => t.wins < 3 && t.losses < 3);
      if (activeTeams.length === 0) break;
      
      const roundMatches = [];
      
      // 按战绩分组
      const byRecord = {};
      activeTeams.forEach(t => {
        const record = `${t.wins}-${t.losses}`;
        if (!byRecord[record]) byRecord[record] = [];
        byRecord[record].push(t);
      });
      
      Object.values(byRecord).forEach(group => {
        group.sort((a, b) => b.strength - a.strength);
        for (let i = 0; i < group.length; i += 2) {
          if (i + 1 < group.length) {
            const t1 = group[i];
            const t2 = group[i + 1];
            
            const isDecisive = (t1.wins === 2 || t1.losses === 2) || (t2.wins === 2 || t2.losses === 2);
            
            // 保存比赛前的战绩
            const team1RecordBefore = `${t1.wins}-${t1.losses}`;
            const team2RecordBefore = `${t2.wins}-${t2.losses}`;
            
            let matchResult;
            let matchType;
            if (isDecisive) {
              matchResult = simulateBO3(t1.code, t2.code, t1.strength, t2.strength);
              matchType = 'BO3';
              roundMatches.push({ 
                ...matchResult, 
                type: 'BO3', 
                decisive: true,
                team1RecordBefore,
                team2RecordBefore
              });
            } else {
              matchResult = simulateBO1(t1.code, t2.code, t1.strength, t2.strength);
              matchType = 'BO1';
              roundMatches.push({ 
                ...matchResult, 
                type: 'BO1', 
                decisive: false,
                team1RecordBefore,
                team2RecordBefore
              });
            }
            
            if (matchResult.winner === t1.code) {
              t1.wins++;
              t2.losses++;
            } else {
              t2.wins++;
              t1.losses++;
            }
            
            // 记录比赛历史（包含比赛后的战绩）
            const score1 = matchType === 'BO3' 
              ? `${matchResult.score1}-${matchResult.score2}` 
              : (matchResult.winner === t1.code ? '1-0' : '0-1');
            const score2 = matchType === 'BO3' 
              ? `${matchResult.score2}-${matchResult.score1}` 
              : (matchResult.winner === t2.code ? '1-0' : '0-1');
            
            t1.matchHistory.push({
              round: r,
              opponent: t2.code,
              result: matchResult.winner === t1.code ? 'W' : 'L',
              score: score1,
              type: matchType,
              recordAfter: `${t1.wins}-${t1.losses}`
            });
            
            t2.matchHistory.push({
              round: r,
              opponent: t1.code,
              result: matchResult.winner === t2.code ? 'W' : 'L',
              score: score2,
              type: matchType,
              recordAfter: `${t2.wins}-${t2.losses}`
            });
            
            if (t1.wins === 3 && !qualified.find(q => q.code === t1.code)) qualified.push({...t1});
            if (t2.wins === 3 && !qualified.find(q => q.code === t2.code)) qualified.push({...t2});
            if (t1.losses === 3 && !eliminated.find(e => e.code === t1.code)) eliminated.push({...t1});
            if (t2.losses === 3 && !eliminated.find(e => e.code === t2.code)) eliminated.push({...t2});
          }
        }
      });
      
      swissMatches.push({ round: r, matches: roundMatches });
      
      if (qualified.length >= 8) break;
    }

    // 八强队伍
    const top8 = qualified.slice(0, 8).map(t => t.code);

    // 淘汰赛 - 八强
    const quarter1 = simulateBO5(top8[0], top8[7], strengths[top8[0]], strengths[top8[7]]);
    const quarter2 = simulateBO5(top8[1], top8[6], strengths[top8[1]], strengths[top8[6]]);
    const quarter3 = simulateBO5(top8[2], top8[5], strengths[top8[2]], strengths[top8[5]]);
    const quarter4 = simulateBO5(top8[3], top8[4], strengths[top8[3]], strengths[top8[4]]);

    // 四强
    const semi1 = simulateBO5(quarter1.winner, quarter2.winner, strengths[quarter1.winner], strengths[quarter2.winner]);
    const semi2 = simulateBO5(quarter3.winner, quarter4.winner, strengths[quarter3.winner], strengths[quarter4.winner]);

    // 决赛
    const final = simulateBO5(semi1.winner, semi2.winner, strengths[semi1.winner], strengths[semi2.winner]);

    setResults({
      playIn: playInResult,
      playInWinner,
      playInLoser,
      swissMatches,
      qualified: qualified.slice(0, 8),
      eliminated,
      quarters: [quarter1, quarter2, quarter3, quarter4],
      semis: [semi1, semi2],
      final,
      champion: final.winner,
      strengths,
      selectedOdds,
      normalizedOdds,
      normalizedProbs,
      top8Seeds: top8  // 添加八强种子信息
    });
    setSimulated(true);
  };

  const TeamDisplay = ({ code }) => {
    if (!code || !teamsData[code]) {
      return <span className="font-semibold text-red-600">Unknown</span>;
    }
    return (
      <>
        {/* 移动端显示缩写 */}
        <span className="sm:hidden font-semibold text-blue-600">{code}</span>
        {/* 桌面端和平板显示全名 (≥640px) */}
        <span className="hidden sm:inline font-semibold text-blue-600">{teamsData[code].name}</span>
      </>
    );
  };

  const BO5Display = ({ match }) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-3 border border-gray-200">
      <div className="grid grid-cols-3 items-center mb-2">
        <div className="text-left">
          <TeamDisplay code={match.team1} />
        </div>
        <div className="text-center">
          <div className="font-bold text-2xl text-purple-600">{match.score1} - {match.score2}</div>
          <div className="text-xs text-gray-500">理论BO5胜率: {(parseFloat(match.baseBO5Prob) * 100).toFixed(1)}%</div>
        </div>
        <div className="text-right">
          <TeamDisplay code={match.team2} />
        </div>
      </div>
      
      {/* 显示基础单局胜率（参考值） */}
      <div className="text-sm text-gray-600 mb-2 bg-blue-50 p-2 rounded">
        <span>基础单局: {teamsData[match.team1]?.name} {(match.baseProb * 100).toFixed(1)}%</span>
      </div>

      <div className="text-sm space-y-1">
        {match.games.map((game, idx) => {
          const team1Prob = game.team1Prob;
          // 计算当前局结束后的比分
          let currentScore1 = 0, currentScore2 = 0;
          for (let i = 0; i <= idx; i++) {
            if (match.games[i].winner === match.team1) currentScore1++;
            else currentScore2++;
          }
          
          return (
            <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
              {/* 左侧：小字获胜信息 */}
              <div className="text-xs text-gray-500 w-32">
                第{idx + 1}局: {teamsData[game.winner]?.name}获胜
              </div>
              
              {/* 中间：突出显示比分 */}
              <div className="flex items-center gap-2 font-semibold text-base">
                <span className="text-gray-800 hidden sm:inline">{teamsData[match.team1]?.name}</span>
                <span className="text-gray-800 sm:hidden">{match.team1}</span>
                <span className="text-blue-600">{currentScore1}-{currentScore2}</span>
                <span className="text-gray-800 hidden sm:inline">{teamsData[match.team2]?.name}</span>
                <span className="text-gray-800 sm:hidden">{match.team2}</span>
              </div>
              
              {/* 右侧：胜率 */}
              <div className="text-xs text-gray-500 w-32 text-right hidden sm:block">
                {teamsData[match.team1]?.name}胜率 {(team1Prob * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 w-20 text-right sm:hidden">
                {(team1Prob * 100).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center bg-green-100 py-2 rounded">
        <span className="text-green-700 font-bold">胜者: </span>
        <TeamDisplay code={match.winner} />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 mr-3" />
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">2025英雄联盟全球总决赛模拟器</h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">
          每局独立计算单局胜率，并施加 ±10%状态波动
        </p>
        
        {!simulated && (
          <button
            onClick={runSimulation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-base sm:text-lg transition-colors flex items-center mx-auto gap-2 shadow-lg"
          >
            <Swords className="w-5 h-5" />
            开始模拟比赛
          </button>
        )}
        
        {simulated && (
          <button
            onClick={runSimulation}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            🔄 重新模拟
          </button>
        )}
      </div>

      {simulated && results && (
        <div className="space-y-8">
          {/* 入围赛 */}
          <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-purple-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              入围赛（10月14日）
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              BO5 单场淘汰 - 北京智慧电竞赛事中心
            </p>
            <BO5Display match={results.playIn} />
            <div className="mt-4 bg-purple-100 p-3 rounded-lg text-center">
              <span className="font-bold text-purple-800">
                ✅ 晋级瑞士轮: <TeamDisplay code={results.playInWinner} />
              </span>
              <br/>
              <span className="text-xs sm:text-sm text-gray-600 mt-1 inline-block">
                {results.playInWinner === 'iG' 
                  ? '→ iG进POOL3，TES进POOL2，KT进POOL3 (LPL为入围赛胜出赛区)'
                  : '→ T1进POOL3，KT进POOL2，TES进POOL3 (LCK为入围赛胜出赛区)'}
              </span>
            </div>
          </section>

          {/* 瑞士轮 */}
          <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-blue-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">瑞士轮（10月15-25日）</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              16支队伍，三胜晋级八强，三败淘汰 - 北京智慧电竞赛事中心<br/>
              <span className="text-red-600 font-semibold">首轮抽签规则：</span><br/>
              <span className="text-blue-600">• POOL1 vs POOL3，POOL2内部对战</span><br/>
              <span className="text-blue-600">• 同赛区避战，采用顺延策略：抽到同赛区则顺延到下一个队伍</span><br/>
              <span className="text-orange-600 font-semibold">• 决定性对局（2胜或2败）采用BO3，其他对局BO1</span>
            </p>
            
            {results.swissMatches.map((round, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-blue-700 bg-blue-50 p-2 rounded">
                  第{round.round}轮 {round.round === 1 && '(特殊抽签规则)'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {round.matches.map((match, mIdx) => {
                    const isSameRegion = teamsData[match.team1]?.region === teamsData[match.team2]?.region;
                    return (
                      <div key={mIdx} className={`p-3 rounded border-2 ${match.decisive ? 'bg-yellow-50 border-yellow-400' : isSameRegion ? 'bg-orange-50 border-orange-400' : 'bg-gray-50 border-gray-300'}`}>
                        {/* 队伍信息行 - BO1/BO3按钮在同一行 */}
                        <div className="grid grid-cols-3 items-center mb-2">
                          <div className="text-left">
                            <TeamDisplay code={match.team1} />
                            <div className="text-xs text-gray-500">{teamsData[match.team1]?.region}</div>
                            <div className="text-xs font-semibold text-blue-600">
                              {match.team1RecordBefore || '0-0'}
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${match.decisive ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                              {match.type}
                            </span>
                          </div>
                          <div className="text-right">
                            <TeamDisplay code={match.team2} />
                            <div className="text-xs text-gray-500">{teamsData[match.team2]?.region}</div>
                            <div className="text-xs font-semibold text-blue-600">
                              {match.team2RecordBefore || '0-0'}
                            </div>
                          </div>
                        </div>
                        
                        {isSameRegion && round.round === 1 && (
                          <div className="text-xs text-orange-600 text-center mb-1">
                            ⚠️ 同赛区对战（顺延后仍无法避免）
                          </div>
                        )}
                        {match.type === 'BO3' ? (
                          <div className="text-center">
                            {/* 比分 */}
                            <div className="font-bold text-lg mb-1">{match.score1} - {match.score2}</div>
                            <div className="text-xs text-gray-500 mb-2">理论BO3胜率: {(parseFloat(match.baseBO3Prob) * 100).toFixed(1)}%</div>
                            
                            {/* 胜方和决定性对局（提前到这里） */}
                            <div className="text-sm text-green-600 font-semibold mb-1">
                              胜: <TeamDisplay code={match.winner} />
                            </div>
                            {match.decisive && <div className="text-xs text-red-600 mb-2">⚡ 决定性对局</div>}
                            
                            {/* 可折叠的小场详情 */}
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                                📋 展开小场详情
                              </summary>
                              
                              {/* 显示基础单局胜率 */}
                              <div className="text-xs text-gray-600 mt-2 mb-2 bg-blue-50 p-1 rounded">
                                基础单局: <span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span> {(match.baseProb * 100).toFixed(1)}%
                              </div>
                              
                              {/* 显示每局详情 */}
                              <div className="text-sm space-y-1 mb-2">
                                {match.games && match.games.map((game, gIdx) => {
                                  const team1Prob = game.team1Prob;
                                  // 计算当前局结束后的比分
                                  let currentScore1 = 0, currentScore2 = 0;
                                  for (let i = 0; i <= gIdx; i++) {
                                    if (match.games[i].winner === match.team1) currentScore1++;
                                    else currentScore2++;
                                  }
                                  
                                  return (
                                    <div key={gIdx} className="flex justify-between items-center bg-white p-1 rounded text-xs">
                                      {/* 左侧：小字获胜信息 */}
                                      <div className="text-gray-500" style={{minWidth: '80px'}}>
                                        第{gIdx + 1}局: <span className="hidden sm:inline">{teamsData[game.winner]?.name}</span><span className="sm:hidden">{game.winner}</span>胜
                                      </div>
                                      
                                      {/* 中间：突出显示比分 */}
                                      <div className="flex items-center gap-1 font-semibold">
                                        <span className="text-gray-800 hidden sm:inline">{teamsData[match.team1]?.name}</span>
                                        <span className="text-gray-800 sm:hidden">{match.team1}</span>
                                        <span className="text-blue-600">{currentScore1}-{currentScore2}</span>
                                        <span className="text-gray-800 hidden sm:inline">{teamsData[match.team2]?.name}</span>
                                        <span className="text-gray-800 sm:hidden">{match.team2}</span>
                                      </div>
                                      
                                      {/* 右侧：胜率 */}
                                      <div className="text-gray-500 text-right hidden sm:block" style={{minWidth: '80px'}}>
                                        <span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span> {(team1Prob * 100).toFixed(1)}%
                                      </div>
                                      <div className="text-gray-500 text-right sm:hidden" style={{minWidth: '50px'}}>
                                        {(team1Prob * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <div className="text-center">
                            {/* 比分显示 */}
                            <div className="font-bold text-lg mb-2">
                              {match.winner === match.team1 ? '1 - 0' : '0 - 1'}
                            </div>
                            
                            {/* 获胜者 */}
                            <div className="text-sm text-green-600 font-semibold mb-2">
                              胜: <TeamDisplay code={match.winner} />
                            </div>
                            
                            {/* 单局胜率放在最下面 */}
                            <div className="text-xs text-gray-500">
                              <span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span>胜率: {(parseFloat(match.adjustedProb) * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-6 bg-green-50 p-4 rounded-lg border-2 border-green-300">
              <h3 className="font-bold text-base sm:text-lg mb-3 text-green-800">✅ 晋级八强队伍（3胜）：</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {results.qualified.map((team, idx) => (
                  <div key={idx} className="bg-white p-3 rounded shadow text-center border border-green-300">
                    <TeamDisplay code={team.code} />
                    <div className="text-xs text-gray-500 mt-1">{team.wins}-{team.losses}</div>
                    
                    {/* 可折叠的战绩统计 */}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                        查看战绩
                      </summary>
                      <div className="mt-2 text-left space-y-1">
                        {team.matchHistory && team.matchHistory.map((match, mIdx) => (
                          <div key={mIdx} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="font-semibold text-gray-700 mb-1">
                              第{match.round}轮 ({match.recordAfter})
                            </div>
                            <div className={`font-semibold ${match.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="hidden sm:inline">{teamsData[team.code]?.name} {match.score} {teamsData[match.opponent]?.name}</span>
                              <span className="sm:hidden">{team.code} {match.score} {match.opponent}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-red-50 p-4 rounded-lg border-2 border-red-300">
              <h3 className="font-bold text-base sm:text-lg mb-3 text-red-800">❌ 淘汰队伍（3败）：</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {results.eliminated.map((team, idx) => (
                  <div key={idx} className="bg-white p-2 rounded shadow text-center border border-red-200">
                    <TeamDisplay code={team.code} />
                    <div className="text-xs text-gray-500 mt-1">{team.wins}-{team.losses}</div>
                    
                    {/* 可折叠的战绩统计 */}
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                        查看战绩
                      </summary>
                      <div className="mt-2 text-left space-y-1">
                        {team.matchHistory && team.matchHistory.map((match, mIdx) => (
                          <div key={mIdx} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                            <div className="font-semibold text-gray-700 mb-1">
                              第{match.round}轮 ({match.recordAfter})
                            </div>
                            <div className={`font-semibold ${match.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="hidden sm:inline">{teamsData[team.code]?.name} {match.score} {teamsData[match.opponent]?.name}</span>
                              <span className="sm:hidden">{team.code} {match.score} {match.opponent}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>

            {/* 瑞士轮赛程流程图 - 恢复final版本的完整颜色 */}
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 p-3 md:p-6 rounded-lg border-2 border-blue-300">
              <h3 className="font-bold text-base md:text-xl mb-2 md:mb-4 text-blue-900 text-center">瑞士轮赛果</h3>
              
              <div className="bg-white p-2 md:p-8 rounded-lg overflow-x-auto">
                <div className="min-w-[700px] md:min-w-[1080px] relative">
                  {/* 第一轮：所有队伍 0-0 - 恢复蓝色背景 */}
                  <div className="flex flex-col items-center mb-12 md:mb-16">
                    <div className="bg-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg border-2 border-blue-700">
                      <div className="font-bold text-sm md:text-lg mb-2 md:mb-3 text-center">第一轮 0-0</div>
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {results.swissMatches[0]?.matches.map((match, idx) => {
                          const score1 = match.winner === match.team1 ? 1 : 0;
                          const score2 = match.winner === match.team2 ? 1 : 0;
                          return (
                            <div key={idx} className="bg-white/20 px-4 md:px-6 py-2 rounded border border-white/30 w-40 md:w-52">
                              <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                <div className="text-sm font-bold text-center">{score1}-{score2}</div>
                                <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* 第二轮分支 - 恢复颜色 */}
                  <div className="flex justify-center gap-8 md:gap-20 mb-12 md:mb-16">
                    {/* 0-1战绩 */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white px-4 md:px-8 py-3 md:py-5 rounded-lg border-2 border-gray-500 w-48 md:w-80">
                        <div className="font-bold text-sm md:text-base mb-1 md:mb-2 text-center text-gray-800">第二轮 0-1</div>
                        <div className="text-xs text-center text-gray-600 mb-2 md:mb-3">BO1</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[1]?.matches
                            .filter(m => m.team1RecordBefore === '0-1')
                            .map((match, idx) => {
                              const score1 = match.winner === match.team1 ? 1 : 0;
                              const score2 = match.winner === match.team2 ? 1 : 0;
                              return (
                                <div key={idx} className="bg-gray-100 px-4 md:px-6 py-2 rounded border border-gray-300 w-44 md:w-72">
                                  <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                    <div className="text-xs text-right text-gray-800"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                    <div className="text-sm font-bold text-center">{score1}-{score2}</div>
                                    <div className="text-xs text-left text-gray-800"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                    
                    {/* 1-0战绩 */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white px-4 md:px-8 py-3 md:py-5 rounded-lg border-2 border-blue-500 w-48 md:w-80">
                        <div className="font-bold text-sm md:text-base mb-1 md:mb-2 text-center text-gray-800">第二轮 1-0</div>
                        <div className="text-xs text-center text-blue-600 mb-2 md:mb-3">BO1</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[1]?.matches
                            .filter(m => m.team1RecordBefore === '1-0')
                            .map((match, idx) => {
                              const score1 = match.winner === match.team1 ? 1 : 0;
                              const score2 = match.winner === match.team2 ? 1 : 0;
                              return (
                                <div key={idx} className="bg-blue-50 px-4 md:px-6 py-2 rounded border border-blue-300 w-44 md:w-72">
                                  <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                    <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                    <div className="text-sm font-bold text-center">{score1}-{score2}</div>
                                    <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 第三轮分支 - 恢复完整颜色 */}
                  <div className="flex justify-center gap-4 md:gap-12 mb-12 md:mb-16">
                    {/* 0-2战绩 - BO3决定性对局 */}
                    <div className="flex flex-col items-center">
                      <div className="bg-red-50 px-3 md:px-6 py-3 md:py-4 rounded-lg border-2 border-red-500 w-48 md:w-80">
                        <div className="font-bold text-xs md:text-sm mb-1 md:mb-2 text-center text-gray-800">第三轮 0-2</div>
                        <div className="text-xs text-center text-red-600 mb-2 md:mb-3">BO3</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[2]?.matches
                            .filter(m => m.team1RecordBefore === '0-2')
                            .map((match, idx) => (
                              <div key={idx} className="bg-white px-4 md:px-6 py-2 rounded border border-red-300 w-44 md:w-72">
                                <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                  <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                  <div className="text-sm font-bold text-center text-red-600">{match.score1}-{match.score2}</div>
                                  <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      {/* 淘汰队伍 - 合并为一个BOX */}
                      {results.swissMatches[2]?.matches.filter(m => m.team1RecordBefore === '0-2').length > 0 && (
                        <div className="mt-2 md:mt-3 bg-red-500 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-red-600 w-44 md:w-72">
                          <div className="text-xs font-bold text-center mb-1 md:mb-2">淘汰队伍</div>
                          <div className="text-xs text-center">
                            {results.swissMatches[2]?.matches
                              .filter(m => m.team1RecordBefore === '0-2')
                              .map((match, idx) => {
                                const loser = match.winner === match.team1 ? match.team2 : match.team1;
                                return (
                                  <React.Fragment key={idx}>
                                    <span className="hidden sm:inline">{teamsData[loser]?.name}</span>
                                    <span className="sm:hidden">{loser}</span>
                                  </React.Fragment>
                                );
                              })
                              .reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ' · ', curr], [])}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 1-1战绩 */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white px-3 md:px-6 py-3 md:py-4 rounded-lg border-2 border-gray-500 w-48 md:w-80">
                        <div className="font-bold text-xs md:text-sm mb-1 md:mb-2 text-center text-gray-800">第三轮 1-1</div>
                        <div className="text-xs text-center text-gray-600 mb-2 md:mb-3">BO1</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[2]?.matches
                            .filter(m => m.team1RecordBefore === '1-1')
                            .map((match, idx) => {
                              const score1 = match.winner === match.team1 ? 1 : 0;
                              const score2 = match.winner === match.team2 ? 1 : 0;
                              return (
                                <div key={idx} className="bg-gray-100 px-4 md:px-6 py-2 rounded border border-gray-300 w-44 md:w-72">
                                  <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                    <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                    <div className="text-sm font-bold text-center">{score1}-{score2}</div>
                                    <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                    
                    {/* 2-0战绩 - BO3决定性对局 */}
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-100 px-3 md:px-6 py-3 md:py-4 rounded-lg border-2 border-blue-600 w-48 md:w-80">
                        <div className="font-bold text-xs md:text-sm mb-1 md:mb-2 text-center text-gray-800">第三轮 2-0</div>
                        <div className="text-xs text-center text-blue-600 mb-2 md:mb-3">BO3</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[2]?.matches
                            .filter(m => m.team1RecordBefore === '2-0')
                            .map((match, idx) => (
                              <div key={idx} className="bg-white px-4 md:px-6 py-2 rounded border border-blue-400 w-44 md:w-72">
                                <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                  <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                  <div className="text-sm font-bold text-center text-blue-600">{match.score1}-{match.score2}</div>
                                  <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      {/* 晋级队伍 - 合并为一个BOX */}
                      {results.swissMatches[2]?.matches.filter(m => m.team1RecordBefore === '2-0').length > 0 && (
                        <div className="mt-2 md:mt-3 bg-green-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-green-700 w-44 md:w-72">
                          <div className="text-xs font-bold text-center mb-1 md:mb-2">晋级队伍</div>
                          <div className="text-xs text-center">
                            {results.swissMatches[2]?.matches
                              .filter(m => m.team1RecordBefore === '2-0')
                              .map((match, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="hidden sm:inline">{teamsData[match.winner]?.name}</span>
                                  <span className="sm:hidden">{match.winner}</span>
                                </React.Fragment>
                              ))
                              .reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ' · ', curr], [])}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 第四轮分支 - 恢复颜色 */}
                  <div className="flex justify-center gap-8 md:gap-32 mb-12 md:mb-16">
                    {/* 1-2战绩 - BO3 */}
                    <div className="flex flex-col items-center">
                      <div className="bg-red-50 px-3 md:px-6 py-3 md:py-4 rounded-lg border-2 border-red-500 w-48 md:w-80">
                        <div className="font-bold text-sm md:text-base mb-1 md:mb-2 text-center text-gray-800">第四轮 1-2</div>
                        <div className="text-xs text-center text-red-600 mb-2 md:mb-3">BO3</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[3]?.matches
                            .filter(m => m.team1RecordBefore === '1-2')
                            .map((match, idx) => (
                              <div key={idx} className="bg-white px-4 md:px-6 py-2 rounded border border-red-300 w-44 md:w-72">
                                <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                  <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                  <div className="text-sm font-bold text-center text-red-600">{match.score1}-{match.score2}</div>
                                  <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      {/* 淘汰队伍 - 合并为一个BOX */}
                      {results.swissMatches[3]?.matches.filter(m => m.team1RecordBefore === '1-2').length > 0 && (
                        <div className="mt-2 md:mt-3 bg-red-500 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-red-600 w-44 md:w-72">
                          <div className="text-xs font-bold text-center mb-1 md:mb-2">淘汰队伍</div>
                          <div className="text-xs text-center">
                            {results.swissMatches[3]?.matches
                              .filter(m => m.team1RecordBefore === '1-2')
                              .map((match, idx) => {
                                const loser = match.winner === match.team1 ? match.team2 : match.team1;
                                return (
                                  <React.Fragment key={idx}>
                                    <span className="hidden sm:inline">{teamsData[loser]?.name}</span>
                                    <span className="sm:hidden">{loser}</span>
                                  </React.Fragment>
                                );
                              })
                              .reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ' · ', curr], [])}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 2-1战绩 - BO3 */}
                    <div className="flex flex-col items-center">
                      <div className="bg-blue-100 px-3 md:px-6 py-3 md:py-4 rounded-lg border-2 border-blue-600 w-48 md:w-80">
                        <div className="font-bold text-sm md:text-base mb-1 md:mb-2 text-center text-gray-800">第四轮 2-1</div>
                        <div className="text-xs text-center text-blue-600 mb-2 md:mb-3">BO3</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[3]?.matches
                            .filter(m => m.team1RecordBefore === '2-1')
                            .map((match, idx) => (
                              <div key={idx} className="bg-white px-4 md:px-6 py-2 rounded border border-blue-400 w-44 md:w-72">
                                <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                  <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                  <div className="text-sm font-bold text-center text-blue-600">{match.score1}-{match.score2}</div>
                                  <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      {/* 晋级队伍 - 合并为一个BOX */}
                      {results.swissMatches[3]?.matches.filter(m => m.team1RecordBefore === '2-1').length > 0 && (
                        <div className="mt-2 md:mt-3 bg-green-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-green-700 w-44 md:w-72">
                          <div className="text-xs font-bold text-center mb-1 md:mb-2">晋级队伍</div>
                          <div className="text-xs text-center">
                            {results.swissMatches[3]?.matches
                              .filter(m => m.team1RecordBefore === '2-1')
                              .map((match, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="hidden sm:inline">{teamsData[match.winner]?.name}</span>
                                  <span className="sm:hidden">{match.winner}</span>
                                </React.Fragment>
                              ))
                              .reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ' · ', curr], [])}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 第五轮：2-2 - 恢复紫色配色 */}
                  {results.swissMatches[4] && results.swissMatches[4].matches.length > 0 && (
                    <div className="flex flex-col items-center mb-12 md:mb-16">
                      <div className="bg-purple-100 px-6 md:px-8 py-4 md:py-5 rounded-lg border-2 border-purple-500 w-48 md:w-80">
                        <div className="font-bold text-base md:text-lg mb-1 md:mb-2 text-center text-gray-800">第五轮 2-2</div>
                        <div className="text-xs text-center text-purple-600 mb-2 md:mb-3">BO3</div>
                        <div className="space-y-2 md:space-y-3 flex flex-col items-center">
                          {results.swissMatches[4].matches.map((match, idx) => (
                            <div key={idx} className="bg-white px-6 md:px-8 py-2 rounded border border-purple-400 w-44 md:w-72">
                              <div className="grid grid-cols-3 items-center gap-1 md:gap-2">
                                <div className="text-xs text-right"><span className="hidden sm:inline">{teamsData[match.team1]?.name}</span><span className="sm:hidden">{match.team1}</span></div>
                                <div className="text-sm font-bold text-center text-purple-600">{match.score1}-{match.score2}</div>
                                <div className="text-xs text-left"><span className="hidden sm:inline">{teamsData[match.team2]?.name}</span><span className="sm:hidden">{match.team2}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* 晋级和淘汰队伍 - 合并为两个BOX */}
                      <div className="mt-2 md:mt-3 flex gap-2 md:gap-4 justify-center">
                        <div className="bg-red-500 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-red-600 w-44 md:w-72">
                          <div className="text-xs font-bold text-center mb-1 md:mb-2">淘汰队伍</div>
                          <div className="text-xs text-center">
                            {results.swissMatches[4].matches.map((match, idx) => {
                              const loser = match.winner === match.team1 ? match.team2 : match.team1;
                              return (
                                <React.Fragment key={idx}>
                                  <span className="hidden sm:inline">{teamsData[loser]?.name}</span>
                                  <span className="sm:hidden">{loser}</span>
                                </React.Fragment>
                              );
                            }).reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ' · ', curr], [])}
                          </div>
                        </div>
                        <div className="bg-green-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-green-700 w-44 md:w-72">
                          <div className="text-xs font-bold text-center mb-1 md:mb-2">晋级队伍</div>
                          <div className="text-xs text-center">
                            {results.swissMatches[4].matches.map((match, idx) => (
                              <React.Fragment key={idx}>
                                <span className="hidden sm:inline">{teamsData[match.winner]?.name}</span>
                                <span className="sm:hidden">{match.winner}</span>
                              </React.Fragment>
                            )).reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ' · ', curr], [])}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 淘汰赛抽签分组图（不含赛果） */}
          <section className="bg-white rounded-xl shadow-lg p-3 md:p-6 border-2 border-purple-300">
            <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-purple-700 text-center">🎯 淘汰赛抽签分组</h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 text-center">
              单败淘汰制 · BO5
            </p>

            <div className="overflow-x-auto">
              <div className="min-w-[700px] md:min-w-[1080px] flex items-center justify-center gap-2 md:gap-2">
                {/* 左侧：上半区八强赛 */}
                <div className="w-32 md:w-48 space-y-6 md:space-y-12">
                  <div className="text-center font-bold text-xs md:text-sm text-blue-700 mb-2 md:mb-4 bg-blue-100 py-1 md:py-2 rounded">
                    上半区
                  </div>
                  <div className="bg-blue-50 p-2 md:p-3 rounded-lg border-2 border-blue-300 shadow-md">
                    <div className="text-xs text-center text-gray-600 mb-1 md:mb-2 font-semibold">
                      G1
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <TeamDisplay code={results.top8Seeds[0]} />
                    </div>
                    <div className="text-center text-xs text-gray-400 my-1">vs</div>
                    <div className="flex justify-between items-center">
                      <TeamDisplay code={results.top8Seeds[7]} />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-2 md:p-3 rounded-lg border-2 border-blue-300 shadow-md">
                    <div className="text-xs text-center text-gray-600 mb-1 md:mb-2 font-semibold">
                      G2
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <TeamDisplay code={results.top8Seeds[3]} />
                    </div>
                    <div className="text-center text-xs text-gray-400 my-1">vs</div>
                    <div className="flex justify-between items-center">
                      <TeamDisplay code={results.top8Seeds[4]} />
                    </div>
                  </div>
                </div>

                {/* 左中：上半区半决赛 */}
                <div className="w-40 md:w-44 flex items-center">
                  <div className="w-full">
                    <div className="text-center font-bold text-xs md:text-sm text-blue-700 mb-2 md:mb-4 bg-blue-200 py-1 md:py-2 rounded">
                      上半区 - 半决赛
                    </div>
                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-3 md:p-4 rounded-lg border-2 border-blue-400 shadow-lg">
                      <div className="text-xs text-center text-gray-700 mb-1 md:mb-2 font-semibold">
                        G5
                      </div>
                      <div className="text-center text-xs md:text-sm text-gray-600 py-2 md:py-4">
                        G1 胜者<br/>vs<br/>G2 胜者
                      </div>
                    </div>
                  </div>
                </div>

                {/* 正中：决赛 */}
                <div className="w-48 md:w-64 flex items-center justify-center">
                  <div className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-orange-200 p-4 md:p-6 rounded-2xl border-4 border-yellow-500 shadow-2xl">
                    <div className="text-center mb-2 md:mb-4">
                      <Trophy className="w-8 h-8 md:w-10 md:h-10 mx-auto text-yellow-700 mb-2" />
                      <div className="font-bold text-base md:text-xl text-gray-800">G7 - 总决赛</div>
                      <div className="text-xs text-gray-600 mt-1">11月9日 · 成都</div>
                    </div>
                    <div className="text-center text-xs md:text-sm text-gray-600 py-2 md:py-4">
                      G5 胜者<br/>vs<br/>G6 胜者
                    </div>
                  </div>
                </div>

                {/* 右中：下半区半决赛 */}
                <div className="w-40 md:w-44 flex items-center">
                  <div className="w-full">
                    <div className="text-center font-bold text-xs md:text-sm text-red-700 mb-2 md:mb-4 bg-red-200 py-1 md:py-2 rounded">
                      下半区 - 半决赛
                    </div>
                    <div className="bg-gradient-to-r from-red-100 to-red-200 p-3 md:p-4 rounded-lg border-2 border-red-400 shadow-lg">
                      <div className="text-xs text-center text-gray-700 mb-1 md:mb-2 font-semibold">
                        G6
                      </div>
                      <div className="text-center text-xs md:text-sm text-gray-600 py-2 md:py-4">
                        G3 胜者<br/>vs<br/>G4 胜者
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右侧：下半区八强赛 */}
                <div className="w-32 md:w-48 space-y-6 md:space-y-12">
                  <div className="text-center font-bold text-xs md:text-sm text-red-700 mb-2 md:mb-4 bg-red-100 py-1 md:py-2 rounded">
                    下半区
                  </div>
                  <div className="bg-red-50 p-2 md:p-3 rounded-lg border-2 border-red-300 shadow-md">
                    <div className="text-xs text-center text-gray-600 mb-1 md:mb-2 font-semibold">
                      G3
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <TeamDisplay code={results.top8Seeds[1]} />
                    </div>
                    <div className="text-center text-xs text-gray-400 my-1">vs</div>
                    <div className="flex justify-between items-center">
                      <TeamDisplay code={results.top8Seeds[6]} />
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-2 md:p-3 rounded-lg border-2 border-red-300 shadow-md">
                    <div className="text-xs text-center text-gray-600 mb-1 md:mb-2 font-semibold">
                      G4
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <TeamDisplay code={results.top8Seeds[2]} />
                    </div>
                    <div className="text-center text-xs text-gray-400 my-1">vs</div>
                    <div className="flex justify-between items-center">
                      <TeamDisplay code={results.top8Seeds[5]} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 八强赛赛果模拟 */}
          <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-orange-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-orange-700">🏆 八强赛赛果模拟</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              BO5 - 上海梅赛德斯-奔驰文化中心
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.quarters.map((match, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">
                    八强第{idx + 1}场
                  </h4>
                  <BO5Display match={match} />
                </div>
              ))}
            </div>
          </section>

          {/* 半决赛赛果模拟 */}
          <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-red-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-red-700">🔥 半决赛赛果模拟</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              BO5 - 上海梅赛德斯-奔驰文化中心
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.semis.map((match, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">半决赛第{idx + 1}场</h4>
                  <BO5Display match={match} />
                </div>
              ))}
            </div>
          </section>

          {/* 总决赛赛果模拟 */}
          <section className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-orange-200 rounded-xl shadow-2xl p-6 sm:p-8 border-4 border-yellow-400">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-700" />
              总决赛赛果模拟
            </h2>
            <p className="text-xs sm:text-sm text-gray-800 mb-6 text-center font-semibold">
              BO5 - 成都东安湖体育公园多功能体育馆
            </p>
            <BO5Display match={results.final} />
            
            <div className="mt-6 sm:mt-8 text-center">
              <div className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-8 sm:px-10 py-4 sm:py-6 rounded-2xl shadow-2xl border-4 border-yellow-300">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 animate-pulse" />
                <div className="text-lg sm:text-xl font-bold mb-2">🏆 2025 全球总决赛冠军 🏆</div>
                <div className="text-3xl sm:text-5xl font-black mb-2">
                  {teamsData[results.champion].name}
                </div>
                <div className="text-base sm:text-lg mt-2 opacity-95 bg-white/20 px-4 py-1 rounded-full inline-block">
                  {teamsData[results.champion].region} 赛区
                </div>
              </div>
            </div>
          </section>

          {/* 淘汰赛赛果总结表（对称布局，决赛居中） */}
          <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-4 sm:p-8 border-2 border-purple-300">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-purple-800 text-center">
              🏆 淘汰赛完整赛果图
            </h2>

            {/* 桌面端：横向布局 */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[1080px] flex items-center justify-center gap-2">
                {/* 左侧：上半区八强赛 */}
                <div className="w-48 space-y-12">
                  <div className="text-center font-bold text-sm text-blue-700 mb-4 bg-blue-100 py-2 rounded">
                    上半区 - 四分之一决赛
                  </div>
                  {results.quarters.slice(0, 2).map((match, idx) => (
                    <div key={idx} className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300 shadow-md">
                      <div className="text-xs text-center text-gray-600 mb-2 font-semibold">
                        G{idx + 1}
                      </div>
                      <div className={`flex justify-between items-center mb-1 ${match.winner === match.team1 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={match.team1} />
                        <span className="text-lg">{match.score1}</span>
                      </div>
                      <div className={`flex justify-between items-center ${match.winner === match.team2 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={match.team2} />
                        <span className="text-lg">{match.score2}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 左中：上半区半决赛 */}
                <div className="w-44 flex items-center">
                  <div className="w-full">
                    <div className="text-center font-bold text-sm text-blue-700 mb-4 bg-blue-200 py-2 rounded">
                      上半区 - 半决赛
                    </div>
                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 rounded-lg border-2 border-blue-400 shadow-lg">
                      <div className="text-xs text-center text-gray-700 mb-2 font-semibold">
                        G5
                      </div>
                      <div className={`flex justify-between items-center mb-2 ${results.semis[0].winner === results.semis[0].team1 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={results.semis[0].team1} />
                        <span className="text-xl">{results.semis[0].score1}</span>
                      </div>
                      <div className={`flex justify-between items-center ${results.semis[0].winner === results.semis[0].team2 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={results.semis[0].team2} />
                        <span className="text-xl">{results.semis[0].score2}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 正中：决赛 */}
                <div className="w-64 flex items-center justify-center">
                  <div className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-orange-200 p-6 rounded-2xl border-4 border-yellow-500 shadow-2xl">
                    <div className="text-center mb-4">
                      <Trophy className="w-10 h-10 mx-auto text-yellow-700 mb-2" />
                      <div className="font-bold text-xl text-gray-800">总决赛</div>
                      <div className="text-xs text-gray-600 mt-1">11月9日 · 成都</div>
                    </div>
                    <div className={`flex justify-between items-center mb-2 ${results.final.winner === results.final.team1 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                      <TeamDisplay code={results.final.team1} />
                      <span className="text-3xl font-black">{results.final.score1}</span>
                    </div>
                    <div className={`flex justify-between items-center mb-4 ${results.final.winner === results.final.team2 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                      <TeamDisplay code={results.final.team2} />
                      <span className="text-3xl font-black">{results.final.score2}</span>
                    </div>
                    <div className="mt-4 text-center bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-black py-3 rounded-xl">
                      <Trophy className="w-6 h-6 inline mr-2" />
                      冠军: <TeamDisplay code={results.champion} />
                    </div>
                  </div>
                </div>

                {/* 右中：下半区半决赛 */}
                <div className="w-44 flex items-center">
                  <div className="w-full">
                    <div className="text-center font-bold text-sm text-red-700 mb-4 bg-red-200 py-2 rounded">
                      下半区 - 半决赛
                    </div>
                    <div className="bg-gradient-to-r from-red-100 to-red-200 p-4 rounded-lg border-2 border-red-400 shadow-lg">
                      <div className="text-xs text-center text-gray-700 mb-2 font-semibold">
                        G6
                      </div>
                      <div className={`flex justify-between items-center mb-2 ${results.semis[1].winner === results.semis[1].team1 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={results.semis[1].team1} />
                        <span className="text-xl">{results.semis[1].score1}</span>
                      </div>
                      <div className={`flex justify-between items-center ${results.semis[1].winner === results.semis[1].team2 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={results.semis[1].team2} />
                        <span className="text-xl">{results.semis[1].score2}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右侧：下半区八强赛 */}
                <div className="w-48 space-y-12">
                  <div className="text-center font-bold text-sm text-red-700 mb-4 bg-red-100 py-2 rounded">
                    下半区 - 四分之一决赛
                  </div>
                  {results.quarters.slice(2, 4).map((match, idx) => (
                    <div key={idx} className="bg-red-50 p-3 rounded-lg border-2 border-red-300 shadow-md">
                      <div className="text-xs text-center text-gray-600 mb-2 font-semibold">
                        G{idx + 3}
                      </div>
                      <div className={`flex justify-between items-center mb-1 ${match.winner === match.team1 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={match.team1} />
                        <span className="text-lg">{match.score1}</span>
                      </div>
                      <div className={`flex justify-between items-center ${match.winner === match.team2 ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                        <TeamDisplay code={match.team2} />
                        <span className="text-lg">{match.score2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 移动端：纵向布局 */}
            <div className="md:hidden space-y-6">
              {/* 八强赛赛果 */}
              <div>
                <h3 className="font-bold text-center text-purple-700 mb-3 text-lg">八强赛赛果</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
                    <div className="text-xs text-center text-gray-600 mb-2 font-semibold">上半区</div>
                    <div className="grid grid-cols-2 gap-2">
                      {results.quarters.slice(0, 2).map((match, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-blue-200">
                          <div className="text-xs text-center text-gray-600 mb-1">G{idx + 1}</div>
                          <div className={`flex justify-between items-center text-xs ${match.winner === match.team1 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                            <TeamDisplay code={match.team1} />
                            <span className="text-base">{match.score1}</span>
                          </div>
                          <div className={`flex justify-between items-center text-xs ${match.winner === match.team2 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                            <TeamDisplay code={match.team2} />
                            <span className="text-base">{match.score2}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg border-2 border-red-300">
                    <div className="text-xs text-center text-gray-600 mb-2 font-semibold">下半区</div>
                    <div className="grid grid-cols-2 gap-2">
                      {results.quarters.slice(2, 4).map((match, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-red-200">
                          <div className="text-xs text-center text-gray-600 mb-1">G{idx + 3}</div>
                          <div className={`flex justify-between items-center text-xs ${match.winner === match.team1 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                            <TeamDisplay code={match.team1} />
                            <span className="text-base">{match.score1}</span>
                          </div>
                          <div className={`flex justify-between items-center text-xs ${match.winner === match.team2 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                            <TeamDisplay code={match.team2} />
                            <span className="text-base">{match.score2}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 半决赛赛果 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-400">
                <h3 className="font-bold text-center text-purple-700 mb-3 text-lg">半决赛赛果</h3>
                <div className="grid grid-cols-2 gap-2">
                  {results.semis.map((match, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border-2 border-purple-300">
                      <div className="text-xs text-center text-gray-600 mb-2">G{idx + 5}</div>
                      <div className={`flex justify-between items-center mb-1 text-xs ${match.winner === match.team1 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                        <TeamDisplay code={match.team1} />
                        <span className="text-lg">{match.score1}</span>
                      </div>
                      <div className={`flex justify-between items-center text-xs ${match.winner === match.team2 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                        <TeamDisplay code={match.team2} />
                        <span className="text-lg">{match.score2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 总决赛赛果 */}
              <div className="bg-gradient-to-br from-yellow-100 to-orange-200 p-4 rounded-lg border-4 border-yellow-500">
                <Trophy className="w-8 h-8 mx-auto text-yellow-700 mb-2" />
                <h3 className="font-bold text-center text-gray-800 mb-3 text-lg">总决赛 (G7)</h3>
                <div className="bg-white p-3 rounded-lg">
                  <div className={`flex justify-between items-center mb-2 ${results.final.winner === results.final.team1 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                    <TeamDisplay code={results.final.team1} />
                    <span className="text-2xl font-black">{results.final.score1}</span>
                  </div>
                  <div className={`flex justify-between items-center ${results.final.winner === results.final.team2 ? 'font-bold text-green-600' : 'text-gray-500'}`}>
                    <TeamDisplay code={results.final.team2} />
                    <span className="text-2xl font-black">{results.final.score2}</span>
                  </div>
                </div>
                <div className="mt-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-black py-2 px-4 rounded-xl text-center">
                  <Trophy className="w-5 h-5 inline mr-2" />
                  冠军: {teamsData[results.champion].name}
                </div>
              </div>
            </div>
          </section>

          {/* 战力参考 */}
          <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-300">
            <h2 className="text-lg sm:text-xl font-bold mb-4">📊 强度参考</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              模拟基于赔率。在赔率区间（灰色字体）随机选择,然后计算归一化赔率（蓝色字体）。
            </p>
            
            {/* 可折叠的数据详情 */}
            <details>
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-semibold mb-4">
                🔍 展开查看详细数据
              </summary>
              
              {/* 2列布局：移动端2列，平板3列，桌面3列 */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(teamsData).sort((a, b) => results.strengths[b] - results.strengths[a]).map((code, idx) => (
                  <div key={code} className={`p-4 rounded-lg border-2 ${idx < 3 ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                    {/* 战队名称 - 最大字体 */}
                    <div className="text-base sm:text-lg font-bold text-gray-800 mb-1">
                      {teamsData[code].name}
                    </div>
                    
                    {/* 所属赛区 - 小字 */}
                    <div className="text-xs text-gray-500 mb-3">
                      {teamsData[code].region}
                    </div>
                    
                    {/* 归一化赔率 - 中等字体，蓝色 */}
                    <div className="text-sm sm:text-base font-semibold text-blue-600 mb-2">
                      {results.normalizedOdds[code].toFixed(2)}
                    </div>
                    
                    {/* 原始赔率区间 - 小字，灰色 */}
                    <div className="text-xs text-gray-600">
                      {teamsData[code].oddsRange[0].toFixed(2)} - {teamsData[code].oddsRange[1].toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>
      )}
    </div>
  );
};

export default Worlds2025Simulator;
