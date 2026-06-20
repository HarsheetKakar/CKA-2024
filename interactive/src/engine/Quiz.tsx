import './Quiz.css';

export interface QuizChoice {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  /** Optional scene-setting line shown above the prompt. */
  scenario?: string;
  choices: QuizChoice[];
}

export interface QuizProps {
  questions: QuizQuestion[];
  /** questionId -> choiceId | null. Fully controlled by the parent day. */
  answers: Record<string, string | null>;
  onAnswer: (questionId: string, choiceId: string) => void;
  invalidIds?: Set<string>;
  lockedIds?: Set<string>;
  disabled?: boolean;
}

export function Quiz({
  questions,
  answers,
  onAnswer,
  invalidIds,
  lockedIds,
  disabled = false,
}: QuizProps) {
  return (
    <div className="quiz">
      {questions.map((q, qi) => {
        const invalid = invalidIds?.has(q.id) ?? false;
        const locked = lockedIds?.has(q.id) ?? false;
        return (
          <fieldset
            key={q.id}
            className={`quiz__card ${invalid ? 'is-invalid' : ''} ${locked ? 'is-locked' : ''}`}
            disabled={disabled || locked}
          >
            <legend className="quiz__legend">
              <span className="quiz__num" aria-hidden="true">
                {qi + 1}
              </span>
              <span className="quiz__prompt">
                {q.scenario && <span className="quiz__scenario">{q.scenario}</span>}
                {q.prompt}
              </span>
            </legend>
            <div className="quiz__choices">
              {q.choices.map((c) => {
                const checked = answers[q.id] === c.id;
                return (
                  <label key={c.id} className={`quiz__choice ${checked ? 'is-checked' : ''}`}>
                    <input
                      type="radio"
                      name={q.id}
                      value={c.id}
                      checked={checked}
                      disabled={disabled || locked}
                      onChange={() => onAnswer(q.id, c.id)}
                    />
                    <span className="quiz__radio" aria-hidden="true" />
                    <span className="quiz__choice-label">{c.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
