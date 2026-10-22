import type { SportsApi } from '@sports247/api';
import type { GuessGame } from '@sports247/domain';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/render';
import GamePage from './GamePage';

const guess: GuessGame = {
  type: 'guess',
  id: 5,
  title: 'خمن المنتخب',
  question: 'ايه اسم المنتخب ده ؟',
  questionImage: null,
  choices: [
    { id: 15, text: 'مصر', image: null, correct: false },
    { id: 16, text: 'ساحل العاج', image: null, correct: true },
  ],
  played: false,
  answerPath: '/api/guess-games/5/answer',
};

function setup(game: GuessGame = guess) {
  const answerGuess = vi.fn().mockResolvedValue({ status: 200 });
  const api: Partial<SportsApi> = {
    game: vi.fn().mockResolvedValue(game),
    games: vi.fn().mockResolvedValue([{ id: 11, title: 'خمن المنتخب', image: null, type: 'guess', played: false }]),
    answerGuess,
  };
  renderWithApp(<GamePage />, { api, path: '/ar/games/11', route: '/:lang/games/:id' });
  return { api, answerGuess };
}

describe('Guess game', () => {
  it('requires a choice, sends the guest id and reveals the answer only after submitting', async () => {
    const { api, answerGuess } = setup();
    const submit = await screen.findByRole('button', { name: 'تأكيد الإجابة' });
    expect(submit).toBeDisabled();
    expect(api.game).toHaveBeenCalledWith(11, 'test-guest');
    expect(screen.queryByText(/الإجابة الصحيحة/)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'مصر' }));
    await userEvent.click(submit);

    expect(answerGuess).toHaveBeenCalledWith('/api/guess-games/5/answer', 'test-guest', 15);
    expect(await screen.findByRole('status')).toHaveTextContent('إجابة غير صحيحة');
    expect(screen.getByRole('status')).toHaveTextContent('الإجابة الصحيحة: ساحل العاج');
  });

  it('blocks a second play on the same day', async () => {
    setup({ ...guess, played: true });
    expect(await screen.findByRole('status')).toHaveTextContent('لعبت هذه اللعبة اليوم');
    expect(screen.queryByRole('button', { name: 'تأكيد الإجابة' })).toBeNull();
  });
});
