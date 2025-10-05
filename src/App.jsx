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

  // 施加比赛日状态波动（±10%）
  const applyMatchDayFluctuation = (baseProb) => {
    const fluctuation = 1 + (Math.random() * 0.20 - 0.10); // ±10%
    let adjustedProb = baseProb * fluctuation;
    // 确保概率在合理范围内 [0.01, 0.99]
    adjustedProb = Math.max(0.01, Math.min(0.99, adjustedProb));
    return adjustedProb;
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
    const baseProb = calcBO1WinProb(s1, s2);
    const p1 = applyMatchDayFluctuation(baseProb); // 施加±10%状态波动
    const winner = Math.random() < p1 ? team1 : team2;
    return { 
      team1, team2, winner, 
      baseProb: baseProb.toFixed(3),
      adjustedProb: p1.toFixed(3)
    };
  };

  // 模拟 BO3
  const simulateBO3 = (team1, team2, s1, s2) => {
    const baseProb = calcBO1WinProb(s1, s2);
    
    let score1 = 0, score2 = 0;
    const games = [];
    
    while (score1 < 2 && score2 < 2) {
      const p1 = applyMatchDayFluctuation(baseProb); // 每局独立施加状态波动
      if (Math.random() < p1) {
        score1++;
        games.push({ winner: team1, prob: p1.toFixed(3) });
      } else {
        score2++;
        games.push({ winner: team2, prob: (1 - p1).toFixed(3) });
      }
    }
    
    const pBO3 = calcBO3WinProb(baseProb); // 理论BO3胜率（无波动）
    
    return { 
      team1, team2, score1, score2, games, 
      winner: score1 === 2 ? team1 : team2,
      baseBO3Prob: pBO3.toFixed(3)
    };
  };

  // 模拟 BO5
  const simulateBO5 = (team1, team2, s1, s2) => {
    const baseProb = calcBO1WinProb(s1, s2);
    
    let score1 = 0, score2 = 0;
    const games = [];
    
    while (score1 < 3 && score2 < 3) {
      const p1 = applyMatchDayFluctuation(baseProb); // 每局独立施加状态波动
      if (Math.random() < p1) {
        score1++;
        games.push({ winner: team1, prob: p1.toFixed(3) });
      } else {
        score2++;
        games.push({ winner: team2, prob: (1 - p1).toFixed(3) });
      }
    }
    
    const pBO5 = calcBO5WinProb(baseProb); // 理论BO5胜率（无波动）
    
    return { 
      team1, team2, score1, score2, games, 
      winner: score1 === 3 ? team1 : team2,
      baseBO5Prob: pBO5.toFixed(3)
    };
  };

  // 瑞士轮首轮抽签（POOL1 vs POOL3，POOL2内部，同赛区避战，采用顺延策略）
  const drawSwissRound1 = (swissTeams, strengths) => {
    const pool1 = swissTeams.filter(t => t.poolActual === 1);
    const pool2 = swissTeams.filter(t => t.poolActual === 2);
    const pool3 = swissTeams.filter(t => t.poolActual === 3);
    
    const matches = [];
    const used = new Set();
    
    // POOL1 vs POOL3（同赛区避战，顺延策略）
    // 随机打乱抽签顺序
    const shuffledPool1 = [...pool1].sort(() => Math.random() - 0.5);
    const pool3Available = [...pool3].sort(() => Math.random() - 0.5);
    
    shuffledPool1.forEach(t1 => {
      // 从当前可用的POOL3队伍中按顺序查找，遇到同赛区则顺延
      let matched = false;
      for (let i = 0; i < pool3Available.length; i++) {
        const t3 = pool3Available[i];
        if (!used.has(t3.code)) {
          // 如果不是同赛区，立即配对
          if (teamsData[t1.code]?.region !== teamsData[t3.code]?.region) {
            matches.push({ team1: t1.code, team2: t3.code });
            used.add(t1.code);
            used.add(t3.code);
            matched = true;
            break;
          }
          // 如果是同赛区，顺延到下一个（continue）
        }
      }
      
      // 如果遍历完所有POOL3队伍都没找到非同赛区的对手
      // 只能接受同赛区对战（极端情况）
      if (!matched && !used.has(t1.code)) {
        for (let i = 0; i < pool3Available.length; i++) {
          const t3 = pool3Available[i];
          if (!used.has(t3.code)) {
            matches.push({ team1: t1.code, team2: t3.code });
            used.add(t1.code);
            used.add(t3.code);
            break;
          }
        }
      }
    });
    
    // POOL2 内部对战（同赛区避战，顺延策略）
    const pool2Available = [...pool2].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < pool2Available.length; i++) {
      const t1 = pool2Available[i];
      if (used.has(t1.code)) continue;
      
      let matched = false;
      // 从t1之后的队伍开始顺延查找
      for (let j = i + 1; j < pool2Available.length; j++) {
        const t2 = pool2Available[j];
        if (used.has(t2.code)) continue;
        
        // 如果不是同赛区，立即配对
        if (teamsData[t1.code]?.region !== teamsData[t2.code]?.region) {
          matches.push({ team1: t1.code, team2: t2.code });
          used.add(t1.code);
          used.add(t2.code);
          matched = true;
          break;
        }
        // 如果是同赛区，顺延到下一个
      }
      
      // 如果没找到非同赛区对手，接受第一个可用的（即使同赛区）
      if (!matched && !used.has(t1.code)) {
        for (let j = i + 1; j < pool2Available.length; j++) {
          const t2 = pool2Available[j];
          if (!used.has(t2.code)) {
            matches.push({ team1: t1.code, team2: t2.code });
            used.add(t1.code);
            used.add(t2.code);
            break;
          }
        }
      }
    }
    
    return matches;
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
      ...pool1Teams.map(code => ({ code, poolActual: 1, wins: 0, losses: 0, strength: strengths[code] })),
      ...pool2Teams.map(code => ({ code, poolActual: 2, wins: 0, losses: 0, strength: strengths[code] })),
      ...pool3Teams.map(code => ({ code, poolActual: 3, wins: 0, losses: 0, strength: strengths[code] }))
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
      
      if (match.winner === pair.team1) {
        t1.wins++;
        t2.losses++;
      } else {
        t2.wins++;
        t1.losses++;
      }
      
      return { ...match, type: 'BO1', decisive: false };
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
            
            let matchResult;
            if (isDecisive) {
              matchResult = simulateBO3(t1.code, t2.code, t1.strength, t2.strength);
              roundMatches.push({ ...matchResult, type: 'BO3', decisive: true });
            } else {
              matchResult = simulateBO1(t1.code, t2.code, t1.strength, t2.strength);
              roundMatches.push({ ...matchResult, type: 'BO1', decisive: false });
            }
            
            if (matchResult.winner === t1.code) {
              t1.wins++;
              t2.losses++;
            } else {
              t2.wins++;
              t1.losses++;
            }
            
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
      normalizedProbs
    });
    setSimulated(true);
  };

  const TeamDisplay = ({ code }) => {
    if (!code || !teamsData[code]) {
      return <span className="font-semibold text-red-600">Unknown</span>;
    }
    return <span className="font-semibold text-blue-600">{teamsData[code].name}</span>;
  };

  const BO5Display = ({ match }) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-3 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <TeamDisplay code={match.team1} />
        <div className="text-center">
          <div className="font-bold text-2xl text-purple-600">{match.score1} - {match.score2}</div>
          <div className="text-xs text-gray-500">理论BO5胜率: {(parseFloat(match.baseBO5Prob) * 100).toFixed(1)}%</div>
        </div>
        <TeamDisplay code={match.team2} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        {match.games.map((game, idx) => (
          <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
            <span className="font-medium">第{idx + 1}局</span>
            <span className="text-xs text-gray-500">单局胜率: {(parseFloat(game.prob) * 100).toFixed(1)}%</span>
            <span className={`font-semibold ${game.winner === match.team1 ? 'text-blue-600' : 'text-gray-400'}`}>
              {teamsData[match.team1]?.name}
            </span>
            <span className={`font-semibold ${game.winner === match.team2 ? 'text-blue-600' : 'text-gray-400'}`}>
              {teamsData[match.team2]?.name}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center bg-green-100 py-2 rounded">
        <span className="text-green-700 font-bold">胜者: </span>
        <TeamDisplay code={match.winner} />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 text-yellow-500 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800">2025英雄联盟全球总决赛</h1>
        </div>
        <p className="text-gray-600 mb-2">基于 Bradley-Terry 模型的赛果模拟</p>
        <p className="text-sm text-gray-500 mb-4">
          s<sub>i</sub> = -ln(odds<sub>normalized</sub>) · γ = 0.5 · 每局±10%状态波动
        </p>
        
        {!simulated && (
          <button
            onClick={runSimulation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors flex items-center mx-auto gap-2 shadow-lg"
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
          <section className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              入围赛（10月14日）
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              BO5 单场淘汰 - 北京智慧电竞赛事中心<br/>
              <span className="text-orange-600">每局独立计算单局胜率，并施加±10%状态波动</span>
            </p>
            <BO5Display match={results.playIn} />
            <div className="mt-4 bg-purple-100 p-3 rounded-lg text-center">
              <span className="font-bold text-purple-800">
                ✅ 晋级瑞士轮: <TeamDisplay code={results.playInWinner} />
              </span>
              <br/>
              <span className="text-sm text-gray-600 mt-1 inline-block">
                {results.playInWinner === 'iG' 
                  ? '→ iG进POOL3，TES进POOL2，KT进POOL3 (LPL为入围赛胜出赛区)'
                  : '→ T1进POOL3，KT进POOL2，TES进POOL3 (LCK为入围赛胜出赛区)'}
              </span>
            </div>
          </section>

          {/* 瑞士轮 */}
          <section className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <h2 className="text-2xl font-bold mb-4">瑞士轮（10月15-25日）</h2>
            <p className="text-sm text-gray-600 mb-4">
              16支队伍，三胜晋级八强，三败淘汰 - 北京智慧电竞赛事中心<br/>
              <span className="text-red-600 font-semibold">首轮抽签规则：</span><br/>
              <span className="text-blue-600">• POOL1 vs POOL3，POOL2内部对战</span><br/>
              <span className="text-blue-600">• 同赛区避战，采用顺延策略：抽到同赛区则顺延到下一个队伍</span><br/>
              <span className="text-orange-600 font-semibold">• 决定性对局（2胜或2负）采用BO3，其他对局BO1</span><br/>
              <span className="text-orange-600">• 每局独立施加±10%状态波动</span>
            </p>
            
            {results.swissMatches.map((round, idx) => (
              <div key={idx} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-blue-700 bg-blue-50 p-2 rounded">
                  第{round.round}轮 {round.round === 1 && '(特殊抽签规则)'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {round.matches.map((match, mIdx) => {
                    const isSameRegion = teamsData[match.team1]?.region === teamsData[match.team2]?.region;
                    return (
                      <div key={mIdx} className={`p-3 rounded border-2 ${match.decisive ? 'bg-yellow-50 border-yellow-400' : isSameRegion ? 'bg-orange-50 border-orange-400' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-left">
                            <TeamDisplay code={match.team1} />
                            <div className="text-xs text-gray-500">{teamsData[match.team1]?.region}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${match.decisive ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {match.type}
                          </span>
                          <div className="text-right">
                            <TeamDisplay code={match.team2} />
                            <div className="text-xs text-gray-500">{teamsData[match.team2]?.region}</div>
                          </div>
                        </div>
                        {isSameRegion && round.round === 1 && (
                          <div className="text-xs text-orange-600 text-center mb-1">
                            ⚠️ 同赛区对战（顺延后仍无法避免）
                          </div>
                        )}
                        {match.type === 'BO3' ? (
                          <div className="text-center">
                            <div className="font-bold text-lg mb-1">{match.score1} - {match.score2}</div>
                            <div className="text-xs text-gray-500 mb-1">理论BO3胜率: {(parseFloat(match.baseBO3Prob) * 100).toFixed(1)}%</div>
                            <div className="text-sm text-green-600 font-semibold">
                              胜: <TeamDisplay code={match.winner} />
                            </div>
                            {match.decisive && <div className="text-xs text-red-600 mt-1">⚡ 决定性对局</div>}
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">单局胜率(含波动): {(parseFloat(match.adjustedProb) * 100).toFixed(1)}%</div>
                            <div className="text-sm text-green-600 font-semibold">
                              胜: <TeamDisplay code={match.winner} />
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
              <h3 className="font-bold text-lg mb-3 text-green-800">✅ 晋级八强队伍（3胜）：</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {results.qualified.map((team, idx) => (
                  <div key={idx} className="bg-white p-3 rounded shadow text-center border border-green-300">
                    <div className="font-bold text-sm mb-1">#{idx + 1} 种子</div>
                    <TeamDisplay code={team.code} />
                    <div className="text-xs text-gray-500 mt-1">{team.wins}-{team.losses}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-red-50 p-4 rounded-lg border-2 border-red-300">
              <h3 className="font-bold text-lg mb-3 text-red-800">❌ 淘汰队伍（3败）：</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {results.eliminated.map((team, idx) => (
                  <div key={idx} className="bg-white p-2 rounded shadow text-center border border-red-200">
                    <TeamDisplay code={team.code} />
                    <div className="text-xs text-gray-500 mt-1">{team.wins}-{team.losses}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 八强赛 */}
          <section className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
            <h2 className="text-2xl font-bold mb-4 text-orange-700">🏆 八强赛（10月28-31日）</h2>
            <p className="text-sm text-gray-600 mb-4">
              BO5 - 上海梅赛德斯-奔驰文化中心<br/>
              <span className="text-orange-600">每局独立施加±10%状态波动</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.quarters.map((match, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">
                    八强第{idx + 1}场 (种子 {idx*2+1} vs {8-idx*2})
                  </h4>
                  <BO5Display match={match} />
                </div>
              ))}
            </div>
          </section>

          {/* 四强赛 */}
          <section className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-200">
            <h2 className="text-2xl font-bold mb-4 text-red-700">🔥 半决赛（11月1-2日）</h2>
            <p className="text-sm text-gray-600 mb-4">
              BO5 - 上海梅赛德斯-奔驰文化中心（无缝衔接）<br/>
              <span className="text-orange-600">每局独立施加±10%状态波动</span>
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

          {/* 决赛 */}
          <section className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-orange-200 rounded-xl shadow-2xl p-8 border-4 border-yellow-400">
            <h2 className="text-3xl font-bold mb-4 text-center flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-700" />
              总决赛（11月9日）
            </h2>
            <p className="text-sm text-gray-800 mb-6 text-center font-semibold">
              BO5 - 成都东安湖体育公园多功能体育馆<br/>
              <span className="text-orange-700">每局独立施加±10%状态波动</span>
            </p>
            <BO5Display match={results.final} />
            
            <div className="mt-8 text-center">
              <div className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-10 py-6 rounded-2xl shadow-2xl border-4 border-yellow-300">
                <Trophy className="w-16 h-16 mx-auto mb-3 animate-pulse" />
                <div className="text-xl font-bold mb-2">🏆 2025 全球总决赛冠军 🏆</div>
                <div className="text-5xl font-black mb-2">
                  {teamsData[results.champion].name}
                </div>
                <div className="text-lg mt-2 opacity-95 bg-white/20 px-4 py-1 rounded-full inline-block">
                  {teamsData[results.champion].region} 赛区
                </div>
              </div>
            </div>
          </section>

          {/* 战力参考 */}
          <section className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
            <h2 className="text-xl font-bold mb-4">📊 Bradley-Terry 强度参考</h2>
            <p className="text-sm text-gray-600 mb-2">
              <strong>归一化流程：</strong>
            </p>
            <ol className="text-xs text-gray-600 mb-4 list-decimal list-inside space-y-1">
              <li>在赔率区间内随机选择赔率</li>
              <li>计算隐含概率 p<sub>i</sub> = 1/odds<sub>i</sub></li>
              <li>归一化使 Σp<sub>i</sub> = 1（消除抽水）</li>
              <li>计算强度 s<sub>i</sub> = -ln(odds<sub>normalized</sub>)</li>
            </ol>
            <p className="text-sm text-gray-600 mb-4">
              <strong>比赛模拟：</strong>基础单局胜率 + 每局±10%状态波动
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {Object.keys(teamsData).sort((a, b) => results.strengths[b] - results.strengths[a]).map((code, idx) => (
                <div key={code} className={`p-3 rounded border-2 ${idx < 3 ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold">{teamsData[code].name}</div>
                      <div className="text-xs text-gray-500">{teamsData[code].region}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">s = {results.strengths[code].toFixed(3)}</div>
                      <div className="text-xs text-purple-600">
                        归一化概率: {(results.normalizedProbs[code] * 100).toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        原始赔率: {results.selectedOdds[code].toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        归一化赔率: {results.normalizedOdds[code].toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-300">
              <p className="text-sm text-blue-800">
                ✓ 验证：所有队伍归一化概率之和 = {Object.values(results.normalizedProbs).reduce((sum, p) => sum + p, 0).toFixed(6)} ≈ 1.000000
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Worlds2025Simulator;
