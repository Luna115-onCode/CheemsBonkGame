import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToolsService } from '../../services/tools.service';

type Difficulty = 'Easy' | 'Normal' | 'Hard';

@Component({
  selector: 'app-tic-tac-toe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tic_tac_toe.component.html',
  styleUrl: './tic_tac_toe.component.css'
})
export class TicTacToeComponent implements OnInit, OnDestroy {
  tools: ToolsService = inject(ToolsService);
  router: Router = inject(Router);

  board: number[] = Array(9).fill(0);
  turn: number = 1; // 1 = Player, 2 = AI
  
  playerWins: number = 0;
  aiWins: number = 0;
  
  difficulty: Difficulty = 'Normal';
  gameStatus: 'playing' | 'player_win' | 'ai_win' | 'draw' = 'playing';
  winningLine: number[] = [];
  
  playerImg = 'games/tic-tac-toe/assets/x.webp'; 
  aiImg = 'games/tic-tac-toe/assets/o.webp';
  
  private leaveTimeout: any;
  private aiTimeout: any;

  get lang() {
    return this.tools.tic_tac_toe[this.tools.lang] || {};
  }

  ngOnInit(): void {
    this.tools.actPage = "tic_tac_toe" as any;
    this.tools.setTitle("Tic Tac Toe");
    this.tools.playMusic("music_1");
    this.startNewGame();
  }


  startNewGame(): void {
    this.board.fill(0);
    this.gameStatus = 'playing';
    this.winningLine = [];
    
    const diffs: Difficulty[] = ['Easy', 'Normal', 'Hard'];
    this.difficulty = diffs[Math.floor(Math.random() * diffs.length)];
    
    this.turn = Math.random() < 0.5 ? 1 : 2;
    
    if (this.turn === 2) {
      this.scheduleAIMove();
    }
  }

  onCellClick(index: number): void {
    if (this.gameStatus !== 'playing' || this.turn !== 1 || this.board[index] !== 0) {
      if (this.board[index] !== 0 && this.gameStatus === 'playing') {
        this.tools.playSound('sfx_1'); 
      }
      return;
    }

    this.board[index] = 1;
    this.tools.playSound('sfx_3'); 
    
    this.checkGameState();
    
    if (this.gameStatus === 'playing') {
      this.turn = 2;
      this.scheduleAIMove();
    }
  }

  scheduleAIMove(): void {
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    this.aiTimeout = setTimeout(() => {
      this.makeAIMove();
    }, 800 + Math.random() * 500);
  }

  makeAIMove(): void {
    if (this.gameStatus !== 'playing') return;

    let moveIndex = -1;
    
    if (this.difficulty === 'Easy') {
      moveIndex = this.getRandomMove();
    } else if (this.difficulty === 'Normal') {
      moveIndex = this.getHeuristicMove();
    } else {
      moveIndex = this.getMinimaxMove();
    }

    if (moveIndex !== -1) {
      this.board[moveIndex] = 2;
      this.tools.playSound('sfx_2');
      this.checkGameState();
      
      if (this.gameStatus === 'playing') {
        this.turn = 1;
      }
    }
  }

  getRandomMove(): number {
    const emptyIndices = this.board.map((val, idx) => val === 0 ? idx : -1).filter(idx => idx !== -1);
    if (emptyIndices.length === 0) return -1;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  getHeuristicMove(): number {
    const winMove = this.findWinningMove(2);
    if (winMove !== -1) return winMove;
    
    const blockMove = this.findWinningMove(1);
    if (blockMove !== -1) return blockMove;
    
    if (this.board[4] === 0) return 4;
    
    return this.getRandomMove();
  }

  findWinningMove(player: number): number {
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === 0) {
        this.board[i] = player;
        const win = this.checkWinState(this.board) === player;
        this.board[i] = 0;
        if (win) return i;
      }
    }
    return -1;
  }

  getMinimaxMove(): number {
    let bestScore = -Infinity;
    let move = -1;
    const emptyIndices = this.board.map((val, idx) => val === 0 ? idx : -1).filter(idx => idx !== -1);
    
    if (emptyIndices.length === 9) {
      const corners = [0, 2, 4, 6, 8];
      return corners[Math.floor(Math.random() * corners.length)];
    }

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === 0) {
        this.board[i] = 2; 
        let score = this.minimax(this.board, 0, false);
        this.board[i] = 0;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move !== -1 ? move : this.getRandomMove();
  }

  minimax(board: number[], depth: number, isMaximizing: boolean): number {
    const result = this.checkWinState(board);
    if (result === 2) return 10 - depth;
    if (result === 1) return depth - 10;
    if (this.isBoardFull(board)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === 0) {
          board[i] = 2;
          let score = this.minimax(board, depth + 1, false);
          board[i] = 0;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === 0) {
          board[i] = 1;
          let score = this.minimax(board, depth + 1, true);
          board[i] = 0;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  checkWinState(board: number[]): number {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      if (board[line[0]] !== 0 && board[line[0]] === board[line[1]] && board[line[1]] === board[line[2]]) {
        return board[line[0]];
      }
    }
    return 0;
  }

  isBoardFull(board: number[]): boolean {
    return board.indexOf(0) === -1;
  }

  checkGameState(): void {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let line of lines) {
      if (this.board[line[0]] !== 0 && this.board[line[0]] === this.board[line[1]] && this.board[line[1]] === this.board[line[2]]) {
        this.winningLine = line;
        const winner = this.board[line[0]];
        if (winner === 1) {
          this.gameStatus = 'player_win';
          this.playerWins++;
          this.tools.playSound('sfx_4'); 
        } else {
          this.gameStatus = 'ai_win';
          this.aiWins++;
          this.tools.playSound('sfx_1'); 
        }
        this.scheduleRestart();
        return;
      }
    }
    
    if (this.isBoardFull(this.board)) {
      this.gameStatus = 'draw';
      this.tools.playSound('sfx_3');
      this.scheduleRestart();
    }
  }

  scheduleRestart(): void {
    setTimeout(() => {
      this.startNewGame();
    }, 2500);
  }

  trackByFn(index: number): number {
    return index;
  }

  ngOnDestroy(): void {
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout);
    if (this.aiTimeout) clearTimeout(this.aiTimeout);
    
    if (this.playerWins > 0) {
       this.tools.leaveMinigame("tic_tac_toe", 0, this.playerWins); 
    }
  }
}
