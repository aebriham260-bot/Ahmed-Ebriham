/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { GameManager } from './game/GameManager';
import { Swords, Heart, Trophy, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (gameState === 'PLAYING' && containerRef.current && !gameManagerRef.current) {
      const gm = new GameManager(containerRef.current);
      gameManagerRef.current = gm;

      const loop = () => {
        if (gm.isGameOver) {
          setGameState('GAMEOVER');
          setWinner(gm.winner);
          return;
        }
        gm.update();
        setPlayerHealth(gm.player.health);
        setEnemyHealth(gm.enemy.health);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.dispose();
        gameManagerRef.current = null;
      }
    };
  }, [gameState]);

  const startGame = () => {
    setGameState('PLAYING');
    setPlayerHealth(100);
    setEnemyHealth(100);
    setWinner(null);
  };

  const restartGame = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.dispose();
      gameManagerRef.current = null;
    }
    setGameState('START');
  };

  return (
    <div className="relative w-full h-screen bg-neutral-900 overflow-hidden font-sans text-white">
      {/* Game Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* UI Overlays */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 p-8"
          >
            <motion.div
              initial={{ y: -50, scale: 0.8 }}
              animate={{ y: 0, scale: 1 }}
              className="text-center"
            >
              <h1 className="text-7xl font-black tracking-tighter italic mb-2 flex items-center gap-4">
                IRON <Swords className="w-16 h-16 text-blue-500" /> FIST
              </h1>
              <p className="text-neutral-400 text-lg mb-12 uppercase tracking-[0.3em]">3D Fighting Simulator</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto text-left">
                <div className="bg-neutral-800/50 p-6 rounded-2xl border border-white/10">
                  <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> CONTROLS
                  </h3>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    <li className="flex justify-between"><span>Move</span> <span className="font-mono text-white">W A S D</span></li>
                    <li className="flex justify-between"><span>Jump</span> <span className="font-mono text-white">SPACE</span></li>
                    <li className="flex justify-between"><span>Attack</span> <span className="font-mono text-white">J</span></li>
                  </ul>
                </div>
                <div className="bg-neutral-800/50 p-6 rounded-2xl border border-white/10">
                  <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> OBJECTIVE
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Defeat the AI opponent by depleting their health bar. Use movement to dodge and time your attacks carefully.
                  </p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="group relative px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition-transform overflow-hidden"
              >
                <span className="relative z-10">ENTER ARENA</span>
                <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between"
          >
            {/* Health Bars */}
            <div className="flex justify-between items-start gap-12">
              {/* Player Health */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between mb-2 items-end">
                  <span className="text-2xl font-black italic tracking-tighter">PLAYER</span>
                  <span className="text-sm font-mono text-blue-400">{Math.ceil(playerHealth)}%</span>
                </div>
                <div className="h-4 bg-neutral-800 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${playerHealth}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center pt-2">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="text-xl font-black italic">VS</span>
                </div>
              </div>

              {/* Enemy Health */}
              <div className="flex-1 max-w-md text-right">
                <div className="flex justify-between mb-2 items-end">
                  <span className="text-sm font-mono text-red-400">{Math.ceil(enemyHealth)}%</span>
                  <span className="text-2xl font-black italic tracking-tighter">ENEMY</span>
                </div>
                <div className="h-4 bg-neutral-800 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    className="h-full bg-red-500 ml-auto"
                    initial={{ width: '100%' }}
                    animate={{ width: `${enemyHealth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Controls Hint */}
            <div className="flex justify-center">
              <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex gap-8 text-xs font-mono text-neutral-400">
                <div className="flex gap-2 items-center"><span className="bg-white/10 px-2 py-0.5 rounded text-white">WASD</span> MOVE</div>
                <div className="flex gap-2 items-center"><span className="bg-white/10 px-2 py-0.5 rounded text-white">SPACE</span> JUMP</div>
                <div className="flex gap-2 items-center"><span className="bg-white/10 px-2 py-0.5 rounded text-white">J</span> ATTACK</div>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-center"
            >
              <Trophy className={`w-24 h-24 mx-auto mb-6 ${winner === 'Player' ? 'text-yellow-400' : 'text-neutral-500'}`} />
              <h2 className="text-8xl font-black tracking-tighter italic mb-4">
                {winner === 'Player' ? 'VICTORY' : 'DEFEAT'}
              </h2>
              <p className="text-neutral-400 text-xl mb-12 uppercase tracking-widest">
                {winner === 'Player' ? 'The champion remains' : 'Better luck next time'}
              </p>
              
              <button
                onClick={restartGame}
                className="flex items-center gap-3 px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition-transform"
              >
                <RefreshCw className="w-6 h-6" /> REMATCH
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

